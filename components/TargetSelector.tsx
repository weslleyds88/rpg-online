'use client'

import type { CombatTarget } from '@/services/combatService'

interface TargetSelectorProps {
  targets: CombatTarget[]
  selectedTargets: CombatTarget[]
  onSelectTarget: (target: CombatTarget) => void
  maxTargets?: number // Para ações de alvo único
  disabled?: boolean
}

export default function TargetSelector({
  targets,
  selectedTargets,
  onSelectTarget,
  maxTargets = 1,
  disabled,
}: TargetSelectorProps) {
  const isSelected = (target: CombatTarget) => {
    return selectedTargets.some(t => t.id === target.id && t.type === target.type)
  }

  const canSelect = (target: CombatTarget) => {
    if (disabled) return false
    if (isSelected(target)) return true // Pode deselecionar
    if (maxTargets === 1) return selectedTargets.length === 0
    return selectedTargets.length < maxTargets
  }

  const getHpPercentage = (target: CombatTarget) => {
    if (target.maxHp === 0) return 0
    return Math.max(0, Math.min(100, (target.currentHp / target.maxHp) * 100))
  }

  const getHpColor = (percentage: number) => {
    if (percentage > 60) return 'bg-green-500'
    if (percentage > 30) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-300 mb-2">
        Selecionar Alvo{maxTargets > 1 ? 's' : ''}
        {maxTargets > 1 && (
          <span className="text-xs text-gray-500 ml-2">
            ({selectedTargets.length}/{maxTargets})
          </span>
        )}
      </label>
      <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
        {targets.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-4">
            Nenhum alvo disponível
          </div>
        ) : (
          targets
            .filter(t => t.status !== 'dead') // Não mostrar alvos mortos
            .map((target) => {
              const selected = isSelected(target)
              const canSelectTarget = canSelect(target)
              const hpPercentage = getHpPercentage(target)

              return (
                <button
                  key={`${target.type}-${target.id}`}
                  onClick={() => canSelectTarget && onSelectTarget(target)}
                  disabled={!canSelectTarget}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selected
                      ? 'bg-indigo-900/50 border-indigo-500 ring-2 ring-indigo-400'
                      : canSelectTarget
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600'
                      : 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${target.type === 'player' ? 'text-blue-400' : 'text-red-400'}`}>
                        {target.type === 'player' ? '👤' : '👹'}
                      </span>
                      <span className="font-medium text-white text-sm">{target.name}</span>
                      {target.status === 'inactive' && (
                        <span className="text-xs text-yellow-400">💤 Inconsciente</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {target.currentHp}/{target.maxHp} HP
                    </span>
                  </div>

                  {/* Barra de vida */}
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${getHpColor(hpPercentage)} transition-all duration-300`}
                      style={{ width: `${hpPercentage}%` }}
                    />
                  </div>
                </button>
              )
            })
        )}
      </div>
    </div>
  )
}
