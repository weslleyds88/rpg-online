/**
 * Serviço para gerenciar NPCs/Adversários
 * Apenas o mestre pode criar, editar e deletar NPCs
 */

import { supabase } from '@/lib/supabase/client'
import type { NPC, NPCInsert, NPCUpdate } from '@/lib/supabase/types'

/**
 * Buscar todos os NPCs de um jogo
 */
export async function getGameNPCs(gameId: string) {
  const { data, error } = await supabase
    .from('rpg_npcs')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as NPC[]
}

/**
 * Buscar um NPC específico por ID
 */
export async function getNPCById(id: string) {
  const { data, error } = await supabase
    .from('rpg_npcs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as NPC
}

/**
 * Criar um novo NPC (apenas mestre)
 */
export async function createNPC(npc: Omit<NPCInsert, 'created_by'>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const npcData: NPCInsert = {
    ...npc,
    created_by: user.id,
    max_hp: npc.max_hp ?? npc.hp ?? 10,
    max_mp: npc.max_mp ?? npc.mp ?? 0,
    hp: npc.hp ?? npc.max_hp ?? 10,
    mp: npc.mp ?? npc.max_mp ?? 0,
    type: npc.type || 'npc',
    level: npc.level || 1,
    status: npc.status || 'active',
    color: npc.color || '#ef4444',
    stats: npc.stats || {},
    sheet: npc.sheet || {},
  }

  const { data, error } = await supabase
    .from('rpg_npcs')
    .insert(npcData)
    .select()
    .single()

  if (error) throw error
  return data as NPC
}

/**
 * Atualizar um NPC (apenas mestre)
 */
export async function updateNPC(id: string, updates: NPCUpdate) {
  const { data, error } = await supabase
    .from('rpg_npcs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as NPC
}

/**
 * Atualizar posição de um NPC no mapa
 */
export async function updateNPCPosition(id: string, x: number, y: number) {
  const { data, error } = await supabase
    .from('rpg_npcs')
    .update({ position_x: x, position_y: y })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as NPC
}

/**
 * Deletar um NPC (apenas mestre)
 */
export async function deleteNPC(id: string) {
  const { error } = await supabase
    .from('rpg_npcs')
    .delete()
    .eq('id', id)

  if (error) throw error
}
