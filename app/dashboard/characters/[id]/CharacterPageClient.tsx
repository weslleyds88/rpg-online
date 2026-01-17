'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCharacterById, updateCharacter } from '@/services/characterService'
import type { Character, CharacterUpdate, CharacterStats } from '@/lib/supabase/types'
import Link from 'next/link'

export default function CharacterPageClient() {
  const router = useRouter()
  const params = useParams()
  const characterId = params.id as string

  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCharacter()
  }, [characterId])

  const loadCharacter = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getCharacterById(characterId)
      setCharacter(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar personagem')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (updates: CharacterUpdate) => {
    if (!character) return

    try {
      setSaving(true)
      setError(null)
      const updated = await updateCharacter(characterId, updates)
      setCharacter(updated)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar personagem')
    } finally {
      setSaving(false)
    }
  }

  // Helper para obter stats do personagem
  const getStats = (): CharacterStats => {
    return character?.stats || {
      race: '',
      class: '',
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-white">Carregando...</h1>
        </div>
      </div>
    )
  }

  if (error && !character) {
    return (
      <div className="min-h-screen bg-gray-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300">
            ← Voltar para Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!character) return null

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300">
            ← Voltar para Dashboard
          </Link>
        </div>

        <div className="bg-gray-900 rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">{character.name}</h1>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Editar
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-white mb-4">Informações Básicas</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-400">Classe:</span>{' '}
                  <span className="text-white">{character.class || 'Não definida'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Nível:</span>{' '}
                  <span className="text-white">{character.level || 1}</span>
                </div>
                <div>
                  <span className="text-gray-400">HP:</span>{' '}
                  <span className="text-white">{character.hp}</span>
                </div>
                <div>
                  <span className="text-gray-400">MP:</span>{' '}
                  <span className="text-white">{character.mp || 0}</span>
                </div>
              </div>
            </div>

            {/* Atributos */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-white mb-4">Atributos</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400">Força:</span>{' '}
                  <span className="text-white">{stats.strength}</span>
                </div>
                <div>
                  <span className="text-gray-400">Destreza:</span>{' '}
                  <span className="text-white">{stats.dexterity}</span>
                </div>
                <div>
                  <span className="text-gray-400">Constituição:</span>{' '}
                  <span className="text-white">{stats.constitution}</span>
                </div>
                <div>
                  <span className="text-gray-400">Inteligência:</span>{' '}
                  <span className="text-white">{stats.intelligence}</span>
                </div>
                <div>
                  <span className="text-gray-400">Sabedoria:</span>{' '}
                  <span className="text-white">{stats.wisdom}</span>
                </div>
                <div>
                  <span className="text-gray-400">Carisma:</span>{' '}
                  <span className="text-white">{stats.charisma}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ficha Completa (se houver) */}
          {character.sheet && Object.keys(character.sheet).length > 0 && (
            <div className="mt-6 bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-white mb-4">Ficha Completa</h2>
              <pre className="text-gray-300 text-sm overflow-auto">
                {JSON.stringify(character.sheet, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
