'use client'

import { useState, useEffect } from 'react'
import type { DiceRollResult } from '@/services/diceService'
import { formatDiceResult, formatDiceRoll } from '@/services/diceService'

interface DiceRollerProps {
  result: DiceRollResult | null
  onRoll?: () => void
  disabled?: boolean
}

export default function DiceRoller({ result, onRoll, disabled }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false)

  useEffect(() => {
    if (result) {
      setIsRolling(false)
    }
  }, [result])

  const handleRoll = () => {
    if (disabled || isRolling) return
    setIsRolling(true)
    onRoll?.()
  }

  return (
    <div className="space-y-3">
      {/* Botão de rolar */}
      {!result && (
        <button
          onClick={handleRoll}
          disabled={disabled || isRolling}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {isRolling ? '🎲 Rolando...' : '🎲 Rolar Dados'}
        </button>
      )}

      {/* Resultado da rolagem */}
      {result && (
        <div className="space-y-2">
          <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-purple-500 shadow-xl">
            {/* Valores individuais dos dados */}
            <div className="flex flex-wrap gap-2 mb-3">
              {result.rolls.map((roll, index) => (
                <div
                  key={index}
                  className={`px-3 py-2 rounded-lg font-bold text-lg ${
                    roll.isCritical
                      ? 'bg-yellow-500 text-yellow-900 animate-pulse'
                      : roll.isFumble
                      ? 'bg-red-500 text-red-900 animate-pulse'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  {roll.value}
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Total</div>
              <div className="text-3xl font-bold text-white">
                {result.total}
                {result.modifier !== 0 && (
                  <span className="text-lg text-gray-400">
                    {result.modifier > 0 ? ` + ${result.modifier}` : ` ${result.modifier}`}
                  </span>
                )}
                <span className="text-2xl text-purple-400 ml-2">
                  = {result.finalTotal}
                </span>
              </div>
            </div>

            {/* Indicadores de crítico/falha */}
            {result.hasCritical && (
              <div className="mt-3 p-2 bg-yellow-900/50 border border-yellow-500 rounded text-center">
                <span className="text-yellow-300 font-bold text-sm">🎯 CRÍTICO! Dano dobrado!</span>
              </div>
            )}
            {result.hasFumble && (
              <div className="mt-3 p-2 bg-red-900/50 border border-red-500 rounded text-center">
                <span className="text-red-300 font-bold text-sm">💥 FALHA CRÍTICA!</span>
              </div>
            )}
          </div>

          {/* Detalhes da rolagem */}
          <div className="text-xs text-gray-400 text-center">
            {formatDiceResult(result)}
          </div>
        </div>
      )}
    </div>
  )
}
