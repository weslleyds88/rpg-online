'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getGameByInviteCode } from '@/services/inviteService'
import { joinGame } from '@/services/playerService'
import CharacterSelector from '@/components/CharacterSelector'
import Link from 'next/link'
import type { Game } from '@/lib/supabase/types'

export default function JoinGamePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [game, setGame] = useState<Game | null>(null)
  const [showCharacterSelector, setShowCharacterSelector] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const foundGame = await getGameByInviteCode(code.toUpperCase().trim())
      setGame(foundGame)
      setShowCharacterSelector(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao encontrar sala')
    } finally {
      setLoading(false)
    }
  }

  const handleCharacterSelect = async (characterId: string) => {
    if (!game) return

    try {
      setLoading(true)
      await joinGame(game.id, characterId)
      router.push(`/dashboard/games/${game.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar na sala')
      setLoading(false)
    }
  }

  if (showCharacterSelector && game) {
    return (
      <CharacterSelector
        gameId={game.id}
        onSelect={handleCharacterSelect}
        onCancel={() => {
          setShowCharacterSelector(false)
          setGame(null)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
          >
            ← Voltar para Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Entrar em uma Sala</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Código de Convite *
              </label>
              <input
                type="text"
                id="code"
                required
                maxLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl font-mono tracking-widest uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="ABC123"
                autoFocus
              />
              <p className="mt-2 text-sm text-gray-500">
                Digite o código de 6 caracteres fornecido pelo mestre da sala
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Entrando...' : 'Entrar na Sala'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
