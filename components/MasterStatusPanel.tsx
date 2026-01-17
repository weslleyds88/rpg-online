'use client'

import StatusManager from './StatusManager'
import type { Player, Character } from '@/lib/supabase/types'

interface MasterStatusPanelProps {
  gameId: string
  isMaster: boolean
  players: Player[]
  playerCharacters: Map<string, Character>
  onUpdate?: () => void
}

export default function MasterStatusPanel({
  gameId,
  isMaster,
  players,
  playerCharacters,
  onUpdate,
}: MasterStatusPanelProps) {
  if (!isMaster) {
    return null
  }

  return (
    <div className="fixed left-0 top-1/2 bottom-0 w-80 bg-gray-900 border-r border-gray-800 z-30 flex flex-col">
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="text-green-400">💊</span>
          Gerenciar Status
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <StatusManager
          gameId={gameId}
          isMaster={isMaster}
          players={players}
          playerCharacters={playerCharacters}
          onUpdate={onUpdate}
        />
      </div>
    </div>
  )
}
