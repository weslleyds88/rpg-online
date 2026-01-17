'use client'

import { useState } from 'react'
import { useCharacters } from '@/hooks/useCharacters'
import type { Character } from '@/lib/supabase/types'

interface CharacterSelectorProps {
  gameId: string
  onSelect: (characterId: string) => Promise<void>
  onCancel?: () => void
}

export default function CharacterSelector({ gameId, onSelect, onCancel }: CharacterSelectorProps) {
  const { characters, loading } = useCharacters()
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCharacterId) return

    try {
      setSubmitting(true)
      setError(null)
      await onSelect(selectedCharacterId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao selecionar personagem')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Carregando personagens...</p>
        </div>
      </div>
    )
  }

  if (characters.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Nenhum Personagem</h2>
          <p className="text-gray-600 mb-6">
            Você precisa criar um personagem antes de entrar na sala.
          </p>
          <div className="flex space-x-4">
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Voltar
              </button>
            )}
            <a
              href="/dashboard/characters/new"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 text-center"
            >
              Criar Personagem
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Selecione seu Personagem</h2>
        <p className="text-gray-600 mb-6">
          Escolha o personagem que você vai usar nesta sessão de RPG.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            {characters.map((character) => {
              const stats = character.stats as any || {}
              const isSelected = selectedCharacterId === character.id

              return (
                <label
                  key={character.id}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="character"
                    value={character.id}
                    checked={isSelected}
                    onChange={(e) => setSelectedCharacterId(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{character.name}</h3>
                        {character.class && (
                          <span className="text-sm text-gray-500">({character.class})</span>
                        )}
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-semibold">
                          Nv. {character.level}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">HP:</span>{' '}
                          <span className="font-medium text-red-600">
                            {character.hp}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">MP:</span>{' '}
                          <span className="font-medium text-blue-600">
                            {character.mp}
                          </span>
                        </div>
                        {stats.strength && (
                          <div>
                            <span className="text-gray-600">Força:</span>{' '}
                            <span className="font-medium">{stats.strength}</span>
                          </div>
                        )}
                        {stats.dexterity && (
                          <div>
                            <span className="text-gray-600">Destreza:</span>{' '}
                            <span className="font-medium">{stats.dexterity}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="ml-4">
                        <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              )
            })}
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={!selectedCharacterId || submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Entrando...' : 'Entrar na Sala'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
