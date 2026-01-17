/**
 * Hook para gerenciar games do usuário
 */

import { useState, useEffect } from 'react'
import { getUserGames, createGame, updateGame, deleteGame } from '@/services/gameService'
import type { Game, GameInsert, GameUpdate } from '@/lib/supabase/types'

export function useGames() {
  const [games, setGames] = useState<(Game & { userRole?: 'master' | 'player' | 'gm' })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadGames()
  }, [])

  const loadGames = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUserGames()
      setGames(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar games'))
    } finally {
      setLoading(false)
    }
  }

  const addGame = async (game: Omit<GameInsert, 'master'>) => {
    try {
      setError(null)
      const newGame = await createGame(game)
      await loadGames() // Recarregar lista
      return newGame
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao criar game')
      setError(error)
      throw error
    }
  }

  const updateGameById = async (id: string, updates: GameUpdate) => {
    try {
      setError(null)
      const updated = await updateGame(id, updates)
      await loadGames() // Recarregar lista
      return updated
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao atualizar game')
      setError(error)
      throw error
    }
  }

  const removeGame = async (id: string) => {
    try {
      setError(null)
      await deleteGame(id)
      await loadGames() // Recarregar lista
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao deletar game')
      setError(error)
      throw error
    }
  }

  return {
    games,
    loading,
    error,
    loadGames,
    addGame,
    updateGameById,
    removeGame,
  }
}
