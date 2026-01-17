'use client'

import { useState } from 'react'
import { updateCharacter } from '@/services/characterService'
import type { Character } from '@/lib/supabase/types'

interface LevelUpModalProps {
  character: Character
  newLevel: number
  onClose: () => void
  onComplete: () => void
}

export default function LevelUpModal({ character, newLevel, onClose, onComplete }: LevelUpModalProps) {
  const [hpIncrease, setHpIncrease] = useState(5) // Valor padrão de aumento de HP
  const [loading, setLoading] = useState(false)

  console.log('🎉 LevelUpModal renderizado!', { character: character.name, newLevel, maxHp: character.max_hp || character.hp })

  const handleConfirm = async () => {
    setLoading(true)
    try {
      // Usar max_hp se existir, senão usar hp como base
      const currentMaxHp = (character as any).max_hp ?? character.hp
      const newMaxHp = currentMaxHp + hpIncrease
      const newHp = character.hp + hpIncrease // Aumenta HP atual também

      console.log('💚 Atualizando HP:', { currentMaxHp, newMaxHp, currentHp: character.hp, newHp })

      await updateCharacter(character.id, {
        max_hp: newMaxHp,
        hp: newHp,
      })

      console.log('✅ HP atualizado com sucesso!')
      onComplete()
      onClose()
    } catch (err) {
      console.error('❌ Erro ao aumentar HP:', err)
      alert('Erro ao aumentar HP máximo: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-b border-gray-700 px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            ⭐ Parabéns! Você subiu de nível!
          </h2>
          <p className="text-gray-300 mt-1">
            {character.name} agora é nível <span className="font-bold text-purple-400">{newLevel}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Aumentar HP Máximo
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Ao subir de nível, você pode aumentar seu HP máximo. Escolha quanto deseja adicionar:
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Aumento de HP:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={hpIncrease}
                    onChange={(e) => setHpIncrease(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xl font-bold text-red-400 min-w-[3rem] text-center">
                    +{hpIncrease}
                  </span>
                </div>
              </div>

              <div className="bg-gray-700/50 rounded p-3 border border-gray-600">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">HP Máximo Atual:</span>
                  <span className="text-white font-medium">{(character as any).max_hp ?? character.hp}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-400">Novo HP Máximo:</span>
                  <span className="text-green-400 font-bold">
                    {((character as any).max_hp ?? character.hp) + hpIncrease}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-400">HP Atual:</span>
                  <span className="text-white font-medium">{character.hp}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-400">Novo HP Atual:</span>
                  <span className="text-green-400 font-bold">
                    {character.hp + hpIncrease}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Aplicando...' : 'Confirmar Aumento de HP'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              Pular
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
