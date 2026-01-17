/**
 * Hook para notificações em tempo real
 */

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Game, Player, Action, Chat } from '@/lib/supabase/types'

export type NotificationType = 
  | 'player_joined'
  | 'player_left'
  | 'new_message'
  | 'new_action'
  | 'game_status_changed'
  | 'master_changed'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  gameId?: string
  timestamp: Date
  data?: any
}

export function useNotifications(gameId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const unsubscribeRefs = useRef<Array<() => void>>([])

  useEffect(() => {
    if (!gameId) return

    const unsubscribers: Array<() => void> = []
    let lastPlayersCount = 0
    let lastGameStatus: string | null = null

    // Supabase Realtime desativado - usando apenas polling
    // O Ably já cobre comunicação em tempo real (chat, movimentos do mapa)
    // try {
    //   // Notificar quando um player entra
    //   const playersChannel = supabase
    //     .channel(`game:${gameId}:players`)
    //     .on(
    //       'postgres_changes',
    //       {
    //         event: 'INSERT',
    //         schema: 'public',
    //         table: 'rpg_players',
    //         filter: `game_id=eq.${gameId}`,
    //       },
    //       (payload) => {
    //         const player = payload.new as Player
    //         addNotification({
    //           type: 'player_joined',
    //           message: 'Um novo jogador entrou na sala',
    //           gameId,
    //           data: player,
    //         })
    //       }
    //     )
    //     .on(
    //       'postgres_changes',
    //       {
    //         event: 'DELETE',
    //         schema: 'public',
    //         table: 'rpg_players',
    //         filter: `game_id=eq.${gameId}`,
    //       },
    //       (payload) => {
    //         addNotification({
    //           type: 'player_left',
    //           message: 'Um jogador saiu da sala',
    //           gameId,
    //           data: payload.old,
    //         })
    //       }
    //     )
    //     .subscribe()

    //   unsubscribers.push(() => {
    //     try {
    //       supabase.removeChannel(playersChannel)
    //     } catch (err) {
    //       console.warn('Erro ao remover canal de players:', err)
    //     }
    //   })

    //   // Notificar quando o status do game muda
    //   const gameChannel = supabase
    //     .channel(`game:${gameId}:status`)
    //     .on(
    //       'postgres_changes',
    //       {
    //         event: 'UPDATE',
    //         schema: 'public',
    //         table: 'rpg_games',
    //         filter: `id=eq.${gameId}`,
    //       },
    //       (payload) => {
    //         const game = payload.new as Game
    //         addNotification({
    //           type: 'game_status_changed',
    //           message: `Status da sala mudou para: ${game.status}`,
    //           gameId,
    //           data: game,
    //         })
    //       }
    //     )
    //     .subscribe()

    //   unsubscribers.push(() => {
    //     try {
    //       supabase.removeChannel(gameChannel)
    //     } catch (err) {
    //       console.warn('Erro ao remover canal de game:', err)
    //     }
    //   })
    // } catch (err) {
    //   console.warn('Erro ao criar subscriptions de notificações:', err)
    // }

    // Polling como fallback (verifica mudanças a cada 15 segundos para evitar piscadas)
    const pollingInterval = setInterval(async () => {
      try {
        // Verificar mudanças nos players
        const { data: players } = await supabase
          .from('rpg_players')
          .select('id')
          .eq('game_id', gameId)

        if (players) {
          const currentCount = players.length
          if (currentCount !== lastPlayersCount && lastPlayersCount > 0) {
            if (currentCount > lastPlayersCount) {
              addNotification({
                type: 'player_joined',
                message: 'Um novo jogador entrou na sala',
                gameId,
              })
            } else {
              addNotification({
                type: 'player_left',
                message: 'Um jogador saiu da sala',
                gameId,
              })
            }
          }
          lastPlayersCount = currentCount
        }

        // Verificar mudanças no status do game
        const { data: game } = await supabase
          .from('rpg_games')
          .select('status')
          .eq('id', gameId)
          .single()

        if (game && game.status !== lastGameStatus && lastGameStatus !== null) {
          addNotification({
            type: 'game_status_changed',
            message: `Status da sala mudou para: ${game.status}`,
            gameId,
            data: game,
          })
        }
        lastGameStatus = game?.status || null
      } catch (err) {
        // Ignorar erros silenciosamente no polling
      }
    }, 15000)

    unsubscribeRefs.current = unsubscribers

    return () => {
      unsubscribers.forEach(unsub => {
        try {
          unsub()
        } catch (err) {
          console.warn('Erro ao fazer unsubscribe:', err)
        }
      })
      clearInterval(pollingInterval)
    }
  }, [gameId])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
    }
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)) // Manter apenas as últimas 50
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  return {
    notifications,
    clearNotifications,
  }
}
