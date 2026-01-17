/**
 * Hook para gerenciar ações/turnos de um game
 */

import { useState, useEffect, useRef } from 'react'
import { getGameActions, createAction, resolveAction, deleteAction, subscribeToActions } from '@/services/actionService'
import type { Action, ActionInsert } from '@/lib/supabase/types'

export function useActions(gameId: string | null) {
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!gameId) return

    loadActions(true) // Primeira carga com loading

    // Tentar inscrever-se em novas ações (Realtime)
    unsubscribeRef.current = subscribeToActions(gameId, (newAction) => {
      setActions((prev) => {
        const exists = prev.find(a => a.id === newAction.id)
        if (exists) {
          return prev.map(a => a.id === newAction.id ? newAction : a)
        }
        return [newAction, ...prev]
      })
    })

    // Polling como fallback (verifica a cada 15 segundos para evitar piscadas)
    // Não mostra loading no polling para evitar piscadas
    const pollingInterval = setInterval(() => {
      loadActions(false)
    }, 15000)

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      clearInterval(pollingInterval)
    }
  }, [gameId])

  const loadActions = async (showLoading = false) => {
    if (!gameId) return

    try {
      if (showLoading) setLoading(true)
      setError(null)
      const data = await getGameActions(gameId)
      setActions(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar ações'))
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const addAction = async (action: Omit<ActionInsert, 'game_id' | 'actor'>) => {
    if (!gameId) return

    try {
      setError(null)
      const newAction = await createAction(action, gameId)
      // A ação será adicionada automaticamente via subscription
      return newAction
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao criar ação')
      setError(error)
      throw error
    }
  }

  const resolveActionById = async (actionId: string) => {
    try {
      setError(null)
      await resolveAction(actionId)
      // A atualização será feita automaticamente via subscription
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao resolver ação')
      setError(error)
      throw error
    }
  }

  const removeAction = async (actionId: string) => {
    try {
      setError(null)
      await deleteAction(actionId)
      setActions((prev) => prev.filter(a => a.id !== actionId))
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao deletar ação')
      setError(error)
      throw error
    }
  }

  return {
    actions,
    loading,
    error,
    loadActions,
    addAction,
    resolveActionById,
    removeAction,
  }
}
