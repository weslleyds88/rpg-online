/**
 * Serviço para comunicação em tempo real de combate via Ably
 */

import { getAblyChannel } from '@/lib/ably/client'
import type { CombatAction } from '@/lib/supabase/types'

export interface PendingCombatAction {
  id: string
  actorId: string
  actorType: 'player' | 'npc'
  actorName: string
  action: CombatAction
  targets: Array<{ id: string; type: 'player' | 'npc'; name: string }>
  gameId: string
  encounterId: string
}

export interface CombatHitConfirmation {
  actionId: string
  hit: boolean
  gameId: string
}

/**
 * Solicita confirmação do mestre para uma ação de combate
 */
export function requestCombatConfirmation(gameId: string, action: PendingCombatAction) {
  try {
    const channel = getAblyChannel(`game:${gameId}:combat`)
    
    if (!channel) {
      console.warn('Canal Ably não disponível para combate')
      return false
    }
    
    channel.publish('combat_action_requested', action)
    console.log('Solicitação de combate enviada via Ably:', action)
    return true
  } catch (err) {
    console.error('Erro ao enviar solicitação de combate via Ably:', err)
    return false
  }
}

/**
 * Inscreve-se em solicitações de confirmação de combate (apenas mestre)
 * Retorna função de unsubscribe
 */
export function subscribeToCombatRequests(
  gameId: string,
  callback: (action: PendingCombatAction) => void
) {
  try {
    const channel = getAblyChannel(`game:${gameId}:combat`)
    
    if (!channel) {
      console.warn('Canal Ably não disponível para combate')
      return () => {}
    }
    
    // Escutar solicitações de confirmação
    channel.subscribe('combat_action_requested', (message) => {
      const action = message.data as PendingCombatAction
      console.log('Solicitação de combate recebida via Ably:', action)
      callback(action)
    })
    
    return () => {
      try {
        channel.unsubscribe('combat_action_requested')
      } catch (err) {
        console.warn('Erro ao fazer unsubscribe do canal de combate:', err)
      }
    }
  } catch (err) {
    console.warn('Erro ao criar subscription de combate no Ably:', err)
    return () => {}
  }
}

/**
 * Confirma acerto/erro de uma ação de combate
 */
export function confirmCombatHit(gameId: string, confirmation: CombatHitConfirmation) {
  try {
    const channel = getAblyChannel(`game:${gameId}:combat`)
    
    if (!channel) {
      console.warn('Canal Ably não disponível para combate')
      return false
    }
    
    channel.publish('combat_hit_confirmed', confirmation)
    console.log('Confirmação de combate enviada via Ably:', confirmation)
    return true
  } catch (err) {
    console.error('Erro ao enviar confirmação de combate via Ably:', err)
    return false
  }
}

/**
 * Inscreve-se em confirmações de acerto/erro (jogadores)
 * Retorna função de unsubscribe
 */
export function subscribeToCombatConfirmations(
  gameId: string,
  callback: (confirmation: CombatHitConfirmation) => void
) {
  try {
    const channel = getAblyChannel(`game:${gameId}:combat`)
    
    if (!channel) {
      console.warn('Canal Ably não disponível para combate')
      return () => {}
    }
    
    // Escutar confirmações
    channel.subscribe('combat_hit_confirmed', (message) => {
      const confirmation = message.data as CombatHitConfirmation
      console.log('Confirmação de combate recebida via Ably:', confirmation)
      callback(confirmation)
    })
    
    return () => {
      try {
        channel.unsubscribe('combat_hit_confirmed')
      } catch (err) {
        console.warn('Erro ao fazer unsubscribe do canal de combate:', err)
      }
    }
  } catch (err) {
    console.warn('Erro ao criar subscription de confirmações de combate no Ably:', err)
    return () => {}
  }
}
