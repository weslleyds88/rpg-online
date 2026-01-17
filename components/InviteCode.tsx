'use client'

import { useState } from 'react'
import { regenerateInviteCode } from '@/services/inviteService'
import type { Game } from '@/lib/supabase/types'

interface InviteCodeProps {
  game: Game
  onUpdate?: (game: Game) => void
}

export default function InviteCode({ game, onUpdate }: InviteCodeProps) {
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const copyToClipboard = async () => {
    if (game.invite_code) {
      await navigator.clipboard.writeText(game.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRegenerate = async () => {
    if (!confirm('Gerar um novo código? O código atual não funcionará mais.')) return

    try {
      setRegenerating(true)
      const updated = await regenerateInviteCode(game.id)
      if (onUpdate) onUpdate(updated)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao regenerar código')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 whitespace-nowrap">Código:</span>
      <code className="text-xs font-mono font-bold text-indigo-300 tracking-wider">
        {game.invite_code || 'Gerando...'}
      </code>
      <button
        onClick={copyToClipboard}
        className="px-2 py-0.5 text-xs font-medium text-indigo-300 bg-indigo-800/50 rounded hover:bg-indigo-800 transition-colors whitespace-nowrap"
        title="Copiar código"
      >
        {copied ? '✓' : 'Copiar'}
      </button>
      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        className="px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-300 disabled:opacity-50"
        title="Gerar novo código"
      >
        {regenerating ? '...' : '🔄'}
      </button>
    </div>
  )
}
