'use client'

import { useState, useEffect } from 'react'
import { 
  executeCombatAction, 
  getCombatActions, 
  getCombatLog,
  type CombatActionData,
  type CombatTarget 
} from '@/services/combatService'
import { rollDiceWithModifier, type DiceRollResult } from '@/services/diceService'
import type { CombatAction } from '@/lib/supabase/types'
import ActionSelector from './ActionSelector'
import TargetSelector from './TargetSelector'
import DiceRoller from './DiceRoller'
import CombatLog from './CombatLog'
import { useAuth } from '@/hooks/useAuth'

interface CombatPanelProps {
  gameId: string
  encounterId: string
  currentActorId: string
  currentActorType: 'player' | 'npc'
  currentActorName: string
  availableTargets: CombatTarget[]
  isMaster: boolean
  onActionExecuted?: () => void
}

export default function CombatPanel({
  gameId,
  encounterId,
  currentActorId,
  currentActorType,
  currentActorName,
  availableTargets,
  isMaster,
  onActionExecuted,
}: CombatPanelProps) {
  const { user } = useAuth()
  const [actions, setActions] = useState<CombatAction[]>([])
  const [selectedAction, setSelectedAction] = useState<CombatAction | null>(null)
  const [selectedTargets, setSelectedTargets] = useState<CombatTarget[]>([])
  const [rollResult, setRollResult] = useState<DiceRollResult | null>(null)
  const [combatLogs, setCombatLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    loadActions()
    loadCombatLog()
    
    // Polling para atualizar logs
    const interval = setInterval(() => {
      loadCombatLog()
    }, 2000)

    return () => clearInterval(interval)
  }, [encounterId])

  const loadActions = async () => {
    try {
      const data = await getCombatActions(gameId)
      setActions(data)
    } catch (err) {
      console.error('Erro ao carregar ações:', err)
    }
  }

  const loadCombatLog = async () => {
    try {
      const logs = await getCombatLog(encounterId)
      setCombatLogs(logs)
    } catch (err) {
      console.error('Erro ao carregar histórico:', err)
    }
  }

  const handleSelectAction = (action: CombatAction) => {
    setSelectedAction(action)
    setSelectedTargets([]) // Reset targets quando muda ação
    setRollResult(null) // Reset roll result
  }

  const handleSelectTarget = (target: CombatTarget) => {
    if (selectedTargets.some(t => t.id === target.id && t.type === target.type)) {
      // Deselecionar
      setSelectedTargets(selectedTargets.filter(t => !(t.id === target.id && t.type === target.type)))
    } else {
      // Selecionar
      const maxTargets = selectedAction?.target_type === 'single' ? 1 : Infinity
      if (selectedTargets.length < maxTargets) {
        setSelectedTargets([...selectedTargets, target])
      }
    }
  }

  const handleRollDice = () => {
    if (!selectedAction) return
    
    const result = rollDiceWithModifier(
      selectedAction.dice_type,
      selectedAction.dice_amount,
      selectedAction.modifier
    )
    setRollResult(result)
  }

  const handleExecuteAction = async () => {
    if (!selectedAction || selectedTargets.length === 0 || !rollResult) return

    setExecuting(true)
    try {
      const actionData: CombatActionData = {
        id: selectedAction.id,
        name: selectedAction.name,
        diceType: selectedAction.dice_type,
        diceAmount: selectedAction.dice_amount,
        modifier: selectedAction.modifier,
        damageType: selectedAction.damage_type,
        targetType: selectedAction.target_type,
        description: selectedAction.description || undefined,
      }

      await executeCombatAction(
        actionData,
        selectedTargets,
        currentActorId,
        currentActorType,
        currentActorName,
        encounterId
      )

      // Resetar estado
      setSelectedAction(null)
      setSelectedTargets([])
      setRollResult(null)

      // Recarregar logs
      await loadCombatLog()

      // Notificar componente pai
      onActionExecuted?.()

      // Disparar evento para atualizar outros componentes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('combat-action-executed', {
          detail: { encounterId }
        }))
      }
    } catch (err) {
      console.error('Erro ao executar ação:', err)
      alert('Erro ao executar ação de combate')
    } finally {
      setExecuting(false)
    }
  }

  const canExecute = selectedAction && selectedTargets.length > 0 && rollResult && !executing

  return (
    <div className="space-y-4">
      {/* Seleção de Ação */}
      <ActionSelector
        actions={actions}
        selectedAction={selectedAction}
        onSelectAction={handleSelectAction}
        disabled={executing}
      />

      {/* Seleção de Alvos */}
      {selectedAction && (
        <TargetSelector
          targets={availableTargets}
          selectedTargets={selectedTargets}
          onSelectTarget={handleSelectTarget}
          maxTargets={selectedAction.target_type === 'single' ? 1 : Infinity}
          disabled={executing}
        />
      )}

      {/* Rolagem de Dados */}
      {selectedAction && selectedTargets.length > 0 && (
        <div>
          <DiceRoller
            result={rollResult}
            onRoll={handleRollDice}
            disabled={executing}
          />
        </div>
      )}

      {/* Botão de Executar */}
      {canExecute && (
        <button
          onClick={handleExecuteAction}
          disabled={executing}
          className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {executing ? '⚔️ Executando...' : '⚔️ Executar Ação'}
        </button>
      )}

      {/* Histórico de Combate */}
      <CombatLog logs={combatLogs} />
    </div>
  )
}
