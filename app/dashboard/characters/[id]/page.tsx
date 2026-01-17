'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCharacterById, updateCharacter } from '@/services/characterService'
import type { Character, CharacterUpdate, CharacterStats } from '@/lib/supabase/types'
import Link from 'next/link'

// Necessário para static export com rotas dinâmicas
export function generateStaticParams() {
  // Retorna array vazio - as páginas serão geradas dinamicamente no cliente
  return []
}

export const dynamicParams = true

export default function CharacterPage() {
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
    if (!character) return {}
    if (typeof character.stats === 'object' && !Array.isArray(character.stats)) {
      return character.stats as CharacterStats
    }
    return {}
  }

  // Helper para atualizar um stat específico
  const updateStat = (key: string, value: number) => {
    if (!character) return
    const stats = getStats()
    const newStats = { ...stats, [key]: value }
    setCharacter({ ...character, stats: newStats })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
        </div>
      </div>
    )
  }

  if (error && !character) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <Link
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-500"
          >
            ← Voltar para Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!character) return null

  const stats = getStats()

  // Calcular modificadores de atributos (D&D style: (atributo - 10) / 2, arredondado para baixo)
  const getModifier = (value: number) => Math.floor((value - 10) / 2)
  const formatModifier = (value: number) => {
    const mod = getModifier(value)
    return mod >= 0 ? `+${mod}` : `${mod}`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
          >
            ← Voltar para Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{character.name}</h1>
              <p className="text-lg text-gray-600">
                {character.class || 'Sem classe'} • {stats.race || 'Sem raça'} • Nível {character.level}
              </p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Editar
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Status (HP e Mana) */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Pontos de Vida</h3>
              {editing ? (
                <div className="space-y-2">
                  <input
                    type="number"
                    min="0"
                    value={character.hp}
                    onChange={(e) =>
                      setCharacter({
                        ...character,
                        hp: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              ) : (
                <p className="text-2xl font-bold text-red-700">
                  {character.hp}
                </p>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Pontos de Mana</h3>
              {editing ? (
                <div className="space-y-2">
                  <input
                    type="number"
                    min="0"
                    value={character.mp}
                    onChange={(e) =>
                      setCharacter({
                        ...character,
                        mp: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              ) : (
                <p className="text-2xl font-bold text-blue-700">
                  {character.mp}
                </p>
              )}
            </div>
          </div>

          {/* Atributos */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Atributos</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'strength', label: 'Força', abbr: 'STR' },
                { key: 'dexterity', label: 'Destreza', abbr: 'DEX' },
                { key: 'constitution', label: 'Constituição', abbr: 'CON' },
                { key: 'intelligence', label: 'Inteligência', abbr: 'INT' },
                { key: 'wisdom', label: 'Sabedoria', abbr: 'WIS' },
                { key: 'charisma', label: 'Carisma', abbr: 'CHA' },
              ].map(({ key, label, abbr }) => {
                const value = (stats[key as keyof CharacterStats] as number) || 10
                return (
                  <div key={key} className="bg-gray-50 rounded-lg p-4 text-center">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">{label}</h3>
                    <p className="text-xs text-gray-500 mb-2">{abbr}</p>
                    {editing ? (
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={value}
                        onChange={(e) =>
                          updateStat(key, parseInt(e.target.value) || 1)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-center text-lg font-bold"
                      />
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          ({formatModifier(value)})
                        </p>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Botões de ação (quando editando) */}
          {editing && (
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                onClick={() => {
                  setEditing(false)
                  loadCharacter() // Recarregar dados originais
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleUpdate(character)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          )}

          {/* Informações adicionais */}
          <div className="mt-8 pt-8 border-t text-sm text-gray-500">
            <p>Criado em: {new Date(character.created_at).toLocaleDateString('pt-BR')}</p>
            <p>Status: {character.status}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

