'use client'

import type { CombatAction } from '@/lib/supabase/types'

interface ActionSelectorProps {
  actions: CombatAction[]
  selectedAction: CombatAction | null
  onSelectAction: (action: CombatAction) => void
  disabled?: boolean
}

export default function ActionSelector({
  actions,
  selectedAction,
  onSelectAction,
  disabled,
}: ActionSelectorProps) {
  const formatDiceNotation = (action: CombatAction): string => {
    const modifierStr = action.modifier !== 0
      ? (action.modifier > 0 ? ` + ${action.modifier}` : ` ${action.modifier}`)
      : ''
    return `${action.dice_amount}d${action.dice_type}${modifierStr}`
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-300 mb-2">
        Selecionar Ação
      </label>
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
        {actions.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-4">
            Nenhuma ação disponível
          </div>
        ) : (
          actions.map((action) => (
            <button
              key={action.id}
              onClick={() => !disabled && onSelectAction(action)}
              disabled={disabled}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedAction?.id === action.id
                  ? 'bg-indigo-900/50 border-indigo-500 ring-2 ring-indigo-400'
                  : 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{action.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDiceNotation(action)} • {action.damage_type}
                  </div>
                  {action.description && (
                    <div className="text-xs text-gray-500 mt-1">{action.description}</div>
                  )}
                </div>
                <div className="ml-2 text-xs text-gray-500">
                  {action.target_type === 'single' ? '👤' : '👥'}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
