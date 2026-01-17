/**
 * Serviço para gerenciar combate
 * Integra rolagem de dados, aplicação de dano e histórico
 */

import { 
  rollDiceWithModifier, 
  applyCriticalDamage,
  type DiceType,
  type DiceRollResult 
} from './diceService'
import { supabase } from '@/lib/supabase/client'
import type { CombatAction, CombatLogEntry } from '@/lib/supabase/types'

export interface CombatTarget {
  id: string
  type: 'player' | 'npc'
  name: string
  currentHp: number
  maxHp: number
  status: 'active' | 'inactive' | 'dead'
}

export interface CombatActionData {
  id?: string
  name: string
  diceType: DiceType
  diceAmount: number
  modifier: number
  damageType: string
  targetType: 'single' | 'multiple'
  description?: string
}

export interface CombatActionResult {
  action: CombatActionData
  rollResult: DiceRollResult
  targets: CombatTarget[]
  damageDealt: Map<string, number> // targetId -> damage
  criticalHits: string[] // targetIds que receberam crítico
  fumbles: boolean
}

/**
 * Executar uma ação de combate
 */
export async function executeCombatAction(
  action: CombatActionData,
  targets: CombatTarget[],
  actorId: string,
  actorType: 'player' | 'npc',
  actorName: string,
  encounterId: string
): Promise<CombatActionResult> {
  // Validar alvos
  if (targets.length === 0) {
    throw new Error('Nenhum alvo selecionado')
  }

  if (action.targetType === 'single' && targets.length > 1) {
    throw new Error('Esta ação só pode atingir um alvo')
  }

  // Rolar dados
  const rollResult = rollDiceWithModifier(
    action.diceType,
    action.diceAmount,
    action.modifier
  )

  // Aplicar dano aos alvos
  const damageDealt = new Map<string, number>()
  const criticalHits: string[] = []
  const updatedTargets: CombatTarget[] = []

  for (const target of targets) {
    let damage = rollResult.finalTotal

    // Aplicar crítico (dobrar dano)
    if (rollResult.hasCritical) {
      damage = applyCriticalDamage(damage)
      criticalHits.push(target.id)
    }

    // Aplicar dano ao alvo
    const newHp = Math.max(0, target.currentHp - damage)
    damageDealt.set(target.id, damage)

    // Atualizar status do alvo
    let newStatus: 'active' | 'inactive' | 'dead' = 'active'
    if (newHp === 0) {
      // NPCs e monstros são deletados quando chegam a 0 HP
      // Players ficam inconscientes (status 'inactive' no banco)
      if (target.type === 'player') {
        newStatus = 'inactive' // Players ficam inativos quando chegam a 0 HP
      } else {
        newStatus = 'dead'
      }
    }

    updatedTargets.push({
      ...target,
      currentHp: newHp,
      status: newStatus,
    })

    // Atualizar HP no banco de dados
    await updateTargetHp(target.id, target.type, newHp, newStatus)
  }

  // Registrar no histórico de combate
  await logCombatAction({
    encounter_id: encounterId,
    actor_id: actorId,
    actor_type: actorType,
    actor_name: actorName,
    action_name: action.name,
    action_id: action.id || null,
    dice_type: action.diceType,
    dice_amount: action.diceAmount,
    dice_modifier: action.modifier,
    roll_values: rollResult.rolls.map(r => r.value),
    roll_total: rollResult.total,
    final_damage: rollResult.finalTotal,
    is_critical: rollResult.hasCritical,
    is_fumble: rollResult.hasFumble,
    targets_hit: targets.map(t => ({ id: t.id, type: t.type, name: t.name })),
    damage_dealt: Array.from(damageDealt.entries()).map(([id, damage]) => ({
      target_id: id,
      damage,
    })),
  })

  return {
    action,
    rollResult,
    targets: updatedTargets,
    damageDealt,
    criticalHits,
    fumbles: rollResult.hasFumble,
  }
}

/**
 * Atualizar HP de um alvo (player ou NPC)
 */
async function updateTargetHp(
  targetId: string,
  targetType: 'player' | 'npc',
  newHp: number,
  newStatus: 'active' | 'inactive' | 'dead'
) {
  if (targetType === 'player') {
    // Atualizar character HP
    const { data: player } = await supabase
      .from('rpg_players')
      .select('character_id')
      .eq('id', targetId)
      .single()

    if (player?.character_id) {
      await supabase
        .from('rpg_characters')
        .update({
          hp: newHp,
          status: newStatus,
        })
        .eq('id', player.character_id)
    }
  } else {
    // Se HP chegou a 0, deletar NPC (não se aplica a players)
    if (newHp === 0 && newStatus === 'dead') {
      await supabase
        .from('rpg_npcs')
        .delete()
        .eq('id', targetId)
      return
    }

    // Atualizar NPC HP (manter max_hp inalterado)
    await supabase
      .from('rpg_npcs')
      .update({
        hp: newHp,
        status: newStatus,
      })
      .eq('id', targetId)
  }
}

/**
 * Registrar ação de combate no histórico
 */
async function logCombatAction(logData: {
  encounter_id: string
  actor_id: string
  actor_type: 'player' | 'npc'
  actor_name: string
  action_name: string
  action_id: string | null
  dice_type: DiceType
  dice_amount: number
  dice_modifier: number
  roll_values: number[]
  roll_total: number
  final_damage: number
  is_critical: boolean
  is_fumble: boolean
  targets_hit: Array<{ id: string; type: 'player' | 'npc'; name: string }>
  damage_dealt: Array<{ target_id: string; damage: number }>
}) {
  const { error } = await supabase
    .from('rpg_combat_logs')
    .insert({
      encounter_id: logData.encounter_id,
      actor_id: logData.actor_id,
      actor_type: logData.actor_type,
      actor_name: logData.actor_name,
      action_name: logData.action_name,
      action_id: logData.action_id,
      dice_type: logData.dice_type,
      dice_amount: logData.dice_amount,
      dice_modifier: logData.dice_modifier,
      roll_values: logData.roll_values,
      roll_total: logData.roll_total,
      final_damage: logData.final_damage,
      is_critical: logData.is_critical,
      is_fumble: logData.is_fumble,
      targets_hit: logData.targets_hit,
      damage_dealt: logData.damage_dealt,
    })

  if (error) {
    console.error('Erro ao registrar ação de combate:', error)
    // Não lançar erro, apenas logar (combate não deve falhar por causa do log)
  }
}

/**
 * Buscar histórico de combate de um encounter
 */
export async function getCombatLog(encounterId: string) {
  const { data, error } = await supabase
    .from('rpg_combat_logs')
    .select('*')
    .eq('encounter_id', encounterId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data as CombatLogEntry[]
}

/**
 * Converter players e NPCs em CombatTargets
 */
export function createCombatTargets(
  players: Array<{ id: string; user_id: string; character_id: string | null }>,
  npcs: Array<{ id: string; name: string; hp: number; max_hp: number; status: string }>,
  playerCharacters: Map<string, { id: string; name: string; hp: number; status: string; sheet?: any }>
): CombatTarget[] {
  const targets: CombatTarget[] = []

  // Adicionar players como alvos
  for (const player of players) {
    if (player.character_id) {
      const character = Array.from(playerCharacters.values()).find(c => c.id === player.character_id)
      if (character) {
        // Tentar obter max_hp do sheet, senão usar hp atual como fallback
        const maxHp = (character.sheet as any)?.max_hp || character.hp || 10
        
        targets.push({
          id: player.id,
          type: 'player',
          name: character.name,
          currentHp: character.hp,
          maxHp: maxHp,
          status: character.status as 'active' | 'inactive' | 'dead',
        })
      }
    }
  }

  // Adicionar NPCs como alvos
  for (const npc of npcs) {
    targets.push({
      id: npc.id,
      type: 'npc',
      name: npc.name,
      currentHp: npc.hp,
      maxHp: npc.max_hp,
      status: npc.status as 'active' | 'inactive' | 'dead',
    })
  }

  return targets
}

/**
 * Buscar ações de combate disponíveis
 */
export async function getCombatActions(gameId: string) {
  const { data, error } = await supabase
    .from('rpg_combat_actions')
    .select('*')
    .eq('game_id', gameId)
    .order('name', { ascending: true })

  if (error) throw error
  return data as CombatAction[]
}

/**
 * Criar uma nova ação de combate
 */
export async function createCombatAction(
  gameId: string,
  actionData: Omit<CombatActionData, 'id'>
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('rpg_combat_actions')
    .insert({
      game_id: gameId,
      name: actionData.name,
      dice_type: actionData.diceType,
      dice_amount: actionData.diceAmount,
      modifier: actionData.modifier,
      damage_type: actionData.damageType,
      target_type: actionData.targetType,
      description: actionData.description || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data as CombatAction
}
