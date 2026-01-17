'use client'

import { useEffect, useRef } from 'react'
import type { CombatLogEntry } from '@/lib/supabase/types'

interface CombatLogProps {
  logs: CombatLogEntry[]
}

export default function CombatLog({ logs }: CombatLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll para o final quando novos logs são adicionados
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const formatLogEntry = (log: CombatLogEntry): string => {
    const diceNotation = `${log.dice_amount}d${log.dice_type}`
    const modifierStr = log.dice_modifier !== 0
      ? (log.dice_modifier > 0 ? ` + ${log.dice_modifier}` : ` ${log.dice_modifier}`)
      : ''
    const rollStr = log.roll_values.join(', ')
    
    let message = `${log.actor_name} usou ${log.action_name}`
    
    if (log.targets_hit && Array.isArray(log.targets_hit) && log.targets_hit.length > 0) {
      const targetNames = log.targets_hit.map((t: any) => t.name).join(', ')
      message += ` em ${targetNames}`
    }
    
    message += ` e causou ${log.final_damage} de dano`
    message += ` (${diceNotation}${modifierStr} = [${rollStr}] = ${log.roll_total}${modifierStr})`
    
    if (log.is_critical) {
      message += ' 🎯 CRÍTICO!'
    }
    
    if (log.is_fumble) {
      message += ' 💥 FALHA CRÍTICA!'
    }
    
    return message
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-300 mb-2">
        Histórico de Combate
      </label>
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-3 h-[200px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-8">
            Nenhuma ação registrada ainda
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="text-xs text-gray-300 p-2 bg-gray-800/50 rounded border-l-2 border-purple-500"
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-gray-400">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                  {log.is_critical && (
                    <span className="text-yellow-400 text-xs">🎯</span>
                  )}
                  {log.is_fumble && (
                    <span className="text-red-400 text-xs">💥</span>
                  )}
                </div>
                <div>{formatLogEntry(log)}</div>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}
