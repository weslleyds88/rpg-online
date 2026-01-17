'use client'

import { useState, useEffect } from 'react'
import { updatePlayerColor } from '@/services/playerService'
import type { Player } from '@/lib/supabase/types'

interface PlayerColorPickerProps {
  gameId: string
  currentPlayer: Player | undefined
}

const DEFAULT_COLORS = [
  '#3b82f6', // Azul
  '#ef4444', // Vermelho
  '#10b981', // Verde
  '#f59e0b', // Amarelo/Laranja
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
  '#84cc16', // Lima
  '#f97316', // Laranja
  '#6366f1', // Índigo
]

export default function PlayerColorPicker({ gameId, currentPlayer }: PlayerColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState<string>(currentPlayer?.color || '#3b82f6')
  const [customColor, setCustomColor] = useState<string>(currentPlayer?.color || '#3b82f6')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (currentPlayer?.color) {
      setSelectedColor(currentPlayer.color)
      setCustomColor(currentPlayer.color)
    }
  }, [currentPlayer?.color])

  const handleColorChange = async (color: string) => {
    if (!currentPlayer) return

    setSelectedColor(color)
    setCustomColor(color)
    setSaving(true)

    try {
      await updatePlayerColor(gameId, currentPlayer.user_id, color)
      // Trigger re-render do mapa
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('players-changed'))
      }
    } catch (err) {
      console.error('Erro ao atualizar cor:', err)
      alert('Erro ao atualizar cor')
      // Reverter para cor anterior
      setSelectedColor(currentPlayer.color || '#3b82f6')
      setCustomColor(currentPlayer.color || '#3b82f6')
    } finally {
      setSaving(false)
    }
  }

  if (!currentPlayer) return null

  return (
    <div className="space-y-2 pt-2 border-t border-gray-700" onClick={(e) => e.stopPropagation()}>
      <label className="block text-xs text-gray-400 mb-1.5">Cor no Mapa</label>
      <div className="space-y-2">
        {/* Cores pré-definidas */}
        <div className="grid grid-cols-5 gap-1.5">
          {DEFAULT_COLORS.map((color) => (
            <button
              key={color}
              onClick={(e) => {
                e.stopPropagation()
                handleColorChange(color)
              }}
              disabled={saving}
              className={`w-full h-7 rounded border-2 transition-all ${
                selectedColor === color
                  ? 'border-white scale-110 shadow-lg'
                  : 'border-gray-600 hover:border-gray-500'
              } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        {/* Seletor de cor customizado */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="color"
            value={customColor}
            onChange={(e) => {
              e.stopPropagation()
              setCustomColor(e.target.value)
              handleColorChange(e.target.value)
            }}
            onClick={(e) => e.stopPropagation()}
            disabled={saving}
            className="flex-1 h-7 bg-gray-900 border border-gray-700 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-xs text-gray-400 min-w-[60px]">
            {saving ? 'Salvando...' : 'Personalizado'}
          </span>
        </div>
      </div>
    </div>
  )
}
