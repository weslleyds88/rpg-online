'use client'

import { useEffect, useState } from 'react'
import type { NPC } from '@/lib/supabase/types'

export default function NPCSelectionIndicator() {
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null)

  useEffect(() => {
    const handleNPCSelected = (e: Event) => {
      const customEvent = e as CustomEvent
      setSelectedNPC(customEvent.detail || null)
    }
    
    window.addEventListener('npc-selected', handleNPCSelected)
    return () => {
      window.removeEventListener('npc-selected', handleNPCSelected)
    }
  }, [])

  if (!selectedNPC) return null

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600/90 backdrop-blur-sm rounded-lg border border-indigo-500 px-4 py-2 shadow-lg z-10">
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: selectedNPC.color }}
        />
        <p className="text-sm font-medium text-white">
          Posicionando: <span className="font-bold">{selectedNPC.name}</span>
        </p>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('npc-selected', { detail: null }))
          }}
          className="ml-2 text-white hover:text-gray-200 transition-colors"
          title="Cancelar"
        >
          ✕
        </button>
      </div>
      <p className="text-xs text-indigo-200 mt-1">
        Clique no mapa para posicionar este NPC
      </p>
    </div>
  )
}
