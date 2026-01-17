/**
 * Serviço para gerenciar encounters (combates) e iniciativa
 */

import { supabase } from '@/lib/supabase/client'
import type { Encounter, EncounterInsert, EncounterUpdate, InitiativeEntry, InitiativeEntryInsert, InitiativeEntryUpdate } from '@/lib/supabase/types'

/**
 * Buscar encounters ativos de um game
 */
export async function getGameEncounters(gameId: string, status?: 'setup' | 'active' | 'finished') {
  let query = supabase
    .from('rpg_encounters')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Encounter[]
}

/**
 * Buscar encounter ativo de um game (inclui 'setup' e 'active')
 */
export async function getActiveEncounter(gameId: string) {
  const { data, error } = await supabase
    .from('rpg_encounters')
    .select('*')
    .eq('game_id', gameId)
    .in('status', ['setup', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as Encounter | null
}

/**
 * Criar um novo encounter
 */
export async function createEncounter(gameId: string, name?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const encounterData: EncounterInsert = {
    game_id: gameId,
    name: name || null,
    status: 'setup',
    current_turn: 0,
    current_round: 1,
    created_by: user.id,
  }

  const { data, error } = await supabase
    .from('rpg_encounters')
    .insert(encounterData)
    .select()
    .single()

  if (error) throw error
  return data as Encounter
}

/**
 * Atualizar encounter
 */
export async function updateEncounter(encounterId: string, updates: EncounterUpdate) {
  const { data, error } = await supabase
    .from('rpg_encounters')
    .update(updates)
    .eq('id', encounterId)
    .select()
    .single()

  if (error) throw error
  return data as Encounter
}

/**
 * Adicionar participante ao encounter
 */
export async function addParticipantToEncounter(
  encounterId: string,
  participantType: 'player' | 'npc',
  participantId: string
) {
  if (!encounterId) {
    throw new Error('encounter_id é obrigatório')
  }

  const entryData: InitiativeEntryInsert = {
    encounter_id: encounterId,
    participant_type: participantType,
    participant_id: participantId,
    initiative_value: null,
    turn_order: null,
    has_acted: false,
  }

  const { data, error } = await supabase
    .from('rpg_initiative_entries')
    .insert(entryData)
    .select()
    .single()

  if (error) {
    console.error('Erro ao inserir participante:', error, 'Dados:', entryData)
    throw error
  }
  return data as InitiativeEntry
}

/**
 * Buscar participantes de um encounter
 */
export async function getEncounterParticipants(encounterId: string) {
  const { data, error } = await supabase
    .from('rpg_initiative_entries')
    .select('*')
    .eq('encounter_id', encounterId)
    .order('turn_order', { ascending: true, nullsLast: true })

  if (error) throw error
  return data as InitiativeEntry[]
}

/**
 * Rolar iniciativa para um participante
 */
export async function rollInitiative(entryId: string, diceValue: number) {
  const { data, error } = await supabase
    .from('rpg_initiative_entries')
    .update({ initiative_value: diceValue })
    .eq('id', entryId)
    .select()
    .single()

  if (error) throw error
  return data as InitiativeEntry
}

/**
 * Calcular ordem de turnos baseado na iniciativa
 */
export async function calculateTurnOrder(encounterId: string) {
  // Buscar todos os participantes com iniciativa
  const participants = await getEncounterParticipants(encounterId)
  
  // Filtrar apenas os que têm iniciativa
  const withInitiative = participants.filter(p => p.initiative_value !== null)
  
  // Ordenar por iniciativa (maior primeiro), em caso de empate, manter ordem original
  const sorted = [...withInitiative].sort((a, b) => {
    if (b.initiative_value! !== a.initiative_value!) {
      return b.initiative_value! - a.initiative_value!
    }
    // Em caso de empate, manter ordem de criação
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  // Atualizar turn_order de cada participante
  const updates = sorted.map((participant, index) => ({
    id: participant.id,
    turn_order: index + 1,
  }))

  // Atualizar todos de uma vez
  for (const update of updates) {
    await supabase
      .from('rpg_initiative_entries')
      .update({ turn_order: update.turn_order })
      .eq('id', update.id)
  }

  return sorted
}

/**
 * Avançar para o próximo turno
 * A iniciativa determina a ordem de ações dentro de um turno
 * O turno só acaba quando todas as ações forem feitas
 */
export async function nextTurn(encounterId: string) {
  const encounter = await supabase
    .from('rpg_encounters')
    .select('*')
    .eq('id', encounterId)
    .single()
    .then(({ data }) => data as Encounter)

  if (!encounter) throw new Error('Encounter não encontrado')

  const participants = await getEncounterParticipants(encounterId)
  const sortedParticipants = participants
    .filter(p => p.turn_order !== null)
    .sort((a, b) => a.turn_order! - b.turn_order!)

  if (sortedParticipants.length === 0) {
    throw new Error('Nenhum participante com ordem de turno definida')
  }

  // current_turn é 1-indexed (1 = primeiro na ordem, 2 = segundo, etc.)
  // Representa qual participante está agindo agora dentro do turno atual
  const currentTurnIndex0 = encounter.current_turn > 0 ? encounter.current_turn - 1 : 0
  
  // Marcar o participante atual como tendo agido
  const currentParticipant = sortedParticipants[currentTurnIndex0]
  if (currentParticipant) {
    await markParticipantActed(currentParticipant.id)
  }

  // Verificar se todos já agiram neste turno
  const allParticipants = await getEncounterParticipants(encounterId)
  const allHaveActed = allParticipants
    .filter(p => p.turn_order !== null)
    .every(p => p.has_acted === true)

  let nextTurnIndex: number
  let nextRound: number

  if (allHaveActed) {
    // Todos agiram! O turno acabou, vamos para a próxima rodada
    // Resetar has_acted de todos para a nova rodada
    await supabase
      .from('rpg_initiative_entries')
      .update({ has_acted: false })
      .eq('encounter_id', encounterId)
    
    // Voltar para o primeiro participante (ordem 1) na nova rodada
    nextTurnIndex = 1
    nextRound = encounter.current_round + 1
  } else {
    // Ainda há participantes que não agiram, avançar para o próximo na ordem
    const nextTurnIndex0 = (currentTurnIndex0 + 1) % sortedParticipants.length
    nextTurnIndex = nextTurnIndex0 + 1 // Converter para 1-indexed
    nextRound = encounter.current_round // Mesma rodada
  }

  // Atualizar encounter
  return updateEncounter(encounterId, {
    current_turn: nextTurnIndex,
    current_round: nextRound,
  })
}

/**
 * Marcar participante como tendo agido
 */
export async function markParticipantActed(entryId: string) {
  const { data, error } = await supabase
    .from('rpg_initiative_entries')
    .update({ has_acted: true })
    .eq('id', entryId)
    .select()
    .single()

  if (error) throw error
  return data as InitiativeEntry
}

/**
 * Remover participante do encounter
 */
export async function removeParticipantFromEncounter(entryId: string) {
  const { error } = await supabase
    .from('rpg_initiative_entries')
    .delete()
    .eq('id', entryId)

  if (error) throw error
}

/**
 * Finalizar encounter
 */
export async function finishEncounter(encounterId: string) {
  return updateEncounter(encounterId, { status: 'finished' })
}
