/**
 * Hook para gerenciar personagens do usuário
 * Fornece lista de personagens e funções CRUD
 */

import { useState, useEffect } from 'react'
import { getUserCharacters, createCharacter, updateCharacter, deleteCharacter } from '@/services/characterService'
import type { Character, CharacterInsert, CharacterUpdate } from '@/lib/supabase/types'

export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Carregar personagens ao montar o componente
  useEffect(() => {
    loadCharacters()
  }, [])

  const loadCharacters = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUserCharacters()
      setCharacters(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar personagens'))
    } finally {
      setLoading(false)
    }
  }

  const addCharacter = async (character: CharacterInsert) => {
    try {
      setError(null)
      const newCharacter = await createCharacter(character)
      setCharacters((prev) => [newCharacter, ...prev])
      return newCharacter
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao criar personagem')
      setError(error)
      throw error
    }
  }

  const updateCharacterById = async (id: string, updates: CharacterUpdate) => {
    try {
      setError(null)
      const updated = await updateCharacter(id, updates)
      setCharacters((prev) =>
        prev.map((char) => (char.id === id ? updated : char))
      )
      return updated
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao atualizar personagem')
      setError(error)
      throw error
    }
  }

  const removeCharacter = async (id: string) => {
    try {
      setError(null)
      await deleteCharacter(id)
      setCharacters((prev) => prev.filter((char) => char.id !== id))
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao deletar personagem')
      setError(error)
      throw error
    }
  }

  return {
    characters,
    loading,
    error,
    loadCharacters,
    addCharacter,
    updateCharacterById,
    removeCharacter,
  }
}

