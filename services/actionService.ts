/**
 * Serviço para gerenciar ações/turnos
 */

import { supabase } from '@/lib/supabase/client'
import type { Action, ActionInsert } from '@/lib/supabase/types'

/**
 * Buscar ações de um game
 */
export async function getGameActions(gameId: string, resolved?: boolean) {
  let query = supabase
    .from('rpg_actions')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })

  if (resolved !== undefined) {
    query = query.eq('resolved', resolved)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Action[]
}

/**
 * Criar uma ação
 */
export async function createAction(action: Omit<ActionInsert, 'game_id' | 'actor'>, gameId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const actionData: ActionInsert = {
    ...action,
    game_id: gameId,
    actor: user.id,
    resolved: action.resolved || false,
  }

  const { data, error } = await supabase
    .from('rpg_actions')
    .insert(actionData)
    .select()
    .single()

  if (error) throw error

  // Criar log automático da ação
  try {
    const { logGameEvent } = await import('./chatService')
    const actionInfo = action.action as any
    const message = `⚔️ ${actionInfo.type?.toUpperCase() || 'Ação'}: ${actionInfo.description || 'Nova ação'}${actionInfo.target ? ` → ${actionInfo.target}` : ''}${actionInfo.damage ? ` (${actionInfo.damage} de dano)` : ''}`
    await logGameEvent(gameId, 'action_created', message, {
      actor: user.id,
      details: { actionId: data.id, actionType: actionInfo.type },
    })
  } catch (err) {
    console.warn('Erro ao criar log de ação:', err)
    // Não falhar se o log não funcionar
  }

  return data as Action
}

/**
 * Resolver uma ação (marcar como resolvida)
 */
export async function resolveAction(actionId: string) {
  // Buscar a ação primeiro para criar o log
  const { data: actionData } = await supabase
    .from('rpg_actions')
    .select('*')
    .eq('id', actionId)
    .single()

  const { data, error } = await supabase
    .from('rpg_actions')
    .update({ resolved: true })
    .eq('id', actionId)
    .select()
    .single()

  if (error) throw error

  // Criar log automático da resolução
  if (actionData) {
    try {
      const { logGameEvent } = await import('./chatService')
      const actionInfo = actionData.action as any
      const message = `✅ Ação resolvida: ${actionInfo.description || 'Ação'}`
      await logGameEvent(actionData.game_id, 'action_resolved', message, {
        actor: actionData.actor || undefined,
        details: { actionId: actionId },
      })
    } catch (err) {
      console.warn('Erro ao criar log de resolução:', err)
    }
  }

  return data as Action
}

/**
 * Deletar uma ação
 */
export async function deleteAction(actionId: string) {
  const { error } = await supabase
    .from('rpg_actions')
    .delete()
    .eq('id', actionId)

  if (error) throw error
}

/**
 * Inscrever-se em novas ações (realtime)
 * Retorna função de unsubscribe
 * 
 * DESATIVADO: Supabase Realtime não está configurado no servidor self-hosted
 * As ações são atualizadas via polling ou Ably se necessário
 */
export function subscribeToActions(gameId: string, callback: (action: Action) => void) {
  // Supabase Realtime desativado - retorna função vazia
  // As ações são atualizadas via polling ou podem ser integradas com Ably se necessário
  console.warn('subscribeToActions: Supabase Realtime desativado. Use polling ou Ably para atualizações em tempo real.')
  return () => {}
  
  // Código original comentado:
  // try {
  //   const channel = supabase
  //     .channel(`game:${gameId}:actions`)
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: 'INSERT',
  //         schema: 'public',
  //         table: 'rpg_actions',
  //         filter: `game_id=eq.${gameId}`,
  //       },
  //       (payload) => {
  //         callback(payload.new as Action)
  //       }
  //     )
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: 'UPDATE',
  //         schema: 'public',
  //         table: 'rpg_actions',
  //         filter: `game_id=eq.${gameId}`,
  //       },
  //       (payload) => {
  //         callback(payload.new as Action)
  //       }
  //     )
  //     .subscribe()

  //   return () => {
  //     try {
  //       supabase.removeChannel(channel)
  //     } catch (err) {
  //       console.warn('Erro ao remover canal:', err)
  //     }
  //   }
  // } catch (err) {
  //   console.warn('Erro ao criar subscription de ações:', err)
  //   return () => {}
  // }
}
