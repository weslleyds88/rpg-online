'use client'

import Link from 'next/link'
import InviteCode from './InviteCode'
import type { Game } from '@/lib/supabase/types'

interface GameHeaderProps {
  game: Game
  isMaster: boolean
  onDeleteGame?: () => void
  onGameUpdate?: (game: Game) => void
}

export default function GameHeader({ game, isMaster, onDeleteGame, onGameUpdate }: GameHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-700 z-50 flex items-center px-6">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            ← Voltar
          </Link>
          <div className="h-6 w-px bg-gray-700" />
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-white">{game.name}</h1>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {game.status}
                </span>
                {isMaster && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-indigo-400">👑 Mestre</span>
                  </>
                )}
              </div>
            </div>
            {isMaster && game.invite_code && (
              <div className="h-6 w-px bg-gray-700" />
            )}
            {isMaster && game.invite_code && (
              <InviteCode game={game} onUpdate={onGameUpdate} />
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isMaster && onDeleteGame && (
            <button
              onClick={onDeleteGame}
              className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
            >
              🗑️ Excluir Sala
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
