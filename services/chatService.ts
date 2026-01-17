/**
 * Serviço para gerenciar chat/logs dos games
 * Agora funciona como um log automático de ações do jogo
 */

import { supabase } from '@/lib/supabase/client'
import { getAblyChannel } from '@/lib/ably/client'
import type { Chat, ChatInsert, Json } from '@/lib/supabase/types'

export type LogEventType = 
  | 'action_created'
  | 'action_resolved'
  | 'player_joined'
  | 'player_left'
  | 'player_role_changed'
  | 'map_uploaded'
  | 'map_deleted'
  | 'game_status_changed'
  | 'game_created'
  | 'master_changed'
  | 'combat_xp'
  | 'master_xp_grant'
  | 'combat_damage'
  | 'combat_healing'

export interface LogEventMetadata {
  type: LogEventType
  actor?: string // user_id do responsável
  actorName?: string // nome do jogador (se disponível)
  target?: string // alvo da ação (ex: player_id, character_id)
  targetName?: string
  details?: Record<string, any> // informações adicionais
}

/**
 * Buscar logs de um game
 */
export async function getGameLogs(gameId: string, limit: number = 100) {
  const { data, error } = await supabase
    .from('rpg_chat')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []).reverse() as Chat[]
}

/**
 * Criar um log automático de evento do jogo
 */
export async function logGameEvent(
  gameId: string,
  eventType: LogEventType,
  message: string,
  metadata?: Partial<LogEventMetadata>
) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const logData: ChatInsert = {
    game_id: gameId,
    user_id: metadata?.actor || user?.id || null, // null para eventos do sistema
    message,
    metadata: {
      type: eventType,
      ...metadata,
    } as Json, // Cast para Json (LogEventMetadata é serializável)
  }

  const { data, error } = await supabase
    .from('rpg_chat')
    .insert(logData)
    .select()
    .single()

  if (error) throw error

  const newLog = data as Chat

  // Publicar no Ably para notificar outros clientes em tempo real
  try {
    const channel = getAblyChannel(`game:${gameId}:chat`)
    if (channel) {
      await channel.publish('new_log', {
        logId: newLog.id,
        gameId: gameId,
      })
    }
  } catch (err) {
    console.warn('Erro ao publicar log no Ably:', err)
    // Não falhar se o Ably não funcionar, o log já foi salvo
  }

  return newLog
}

/**
 * @deprecated Use logGameEvent ao invés de sendMessage
 * Mantido para compatibilidade, mas agora cria logs automáticos
 */
export async function sendMessage(gameId: string, message: string) {
  return logGameEvent(gameId, 'action_created', message, {
    actor: undefined, // será preenchido automaticamente
  })
}

/**
 * Inscrever-se em novos logs usando Ably
 * Retorna função de unsubscribe
 */
export function subscribeToLogs(gameId: string, callback: (log: Chat) => void) {
  try {
    const channel = getAblyChannel(`game:${gameId}:chat`)
    
    if (!channel) {
      console.warn('Canal Ably não disponível, usando fallback')
      return () => {}
    }
    
    // Escutar eventos de novo log
    channel.subscribe('new_log', async (message) => {
      const { logId } = message.data as { logId: string; gameId: string }
      
      // Buscar o log completo do Supabase
      try {
        const { data, error } = await supabase
          .from('rpg_chat')
          .select('*')
          .eq('id', logId)
          .single()

        if (!error && data) {
          callback(data as Chat)
        }
      } catch (err) {
        console.warn('Erro ao buscar log após notificação Ably:', err)
      }
    })

    // Também escutar 'new_message' para compatibilidade
    channel.subscribe('new_message', async (message) => {
      const { messageId } = message.data as { messageId: string; gameId: string }
      
      try {
        const { data, error } = await supabase
          .from('rpg_chat')
          .select('*')
          .eq('id', messageId)
          .single()

        if (!error && data) {
          callback(data as Chat)
        }
      } catch (err) {
        console.warn('Erro ao buscar mensagem após notificação Ably:', err)
      }
    })

    return () => {
      try {
        channel.unsubscribe('new_log')
        channel.unsubscribe('new_message')
      } catch (err) {
        console.warn('Erro ao fazer unsubscribe do Ably:', err)
      }
    }
  } catch (err) {
    console.warn('Erro ao criar subscription de logs no Ably:', err)
    // Retorna função vazia se falhar
    return () => {}
  }
}

/**
 * @deprecated Use subscribeToLogs ao invés de subscribeToMessages
 */
export function subscribeToMessages(gameId: string, callback: (message: Chat) => void) {
  return subscribeToLogs(gameId, callback)
}
