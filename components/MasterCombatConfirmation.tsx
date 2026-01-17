'use client'

import { useState, useEffect } from 'react'
import { getActiveEncounter } from '@/services/encounterService'
import { getGameNPCs } from '@/services/npcService'
import { getGamePlayers } from '@/services/playerService'
import { createCombatTargets } from '@/services/combatService'
import { subscribeToCombatRequests, confirmCombatHit as sendCombatHitConfirmation } from '@/services/combatRealtimeService'
import type { Encounter, Player, NPC, Character, CombatAction } from '@/lib/supabase/types'
import type { PendingCombatAction } from '@/services/combatRealtimeService'
import { useAuth } from '@/hooks/useAuth'
import { logGameEvent } from '@/services/chatService'

// Usar o tipo do serviço de combate
type PendingAction = PendingCombatAction

interface MasterCombatConfirmationProps {
  gameId: string
  isMaster: boolean
  players: Player[]
  playerCharacters: Map<string, Character>
}

export default function MasterCombatConfirmation({
  gameId,
  isMaster,
  players,
  playerCharacters,
}: MasterCombatConfirmationProps) {
  const { user } = useAuth()
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  const [npcs, setNPCs] = useState<NPC[]>([])

  useEffect(() => {
    if (!isMaster) {
      console.log('MasterCombatConfirmation: não é mestre, não inicializando')
      return
    }

    console.log('MasterCombatConfirmation: inicializando para mestre, gameId:', gameId)
    loadNPCs()

    // Função para adicionar ação à lista
    const addPendingAction = (action: PendingAction) => {
      if (!action || !action.id) {
        console.error('Ação inválida recebida', action)
        return
      }

      // Verificar se é do mesmo jogo
      if (action.gameId !== gameId) {
        console.log('Ação de outro jogo, ignorando', action.gameId, gameId)
        return
      }

      console.log('✅ Ação válida recebida, adicionando à lista', action)
      setPendingActions(prev => {
        // Evitar duplicatas
        if (prev.some(p => p.id === action.id)) {
          console.log('Ação já existe, ignorando duplicata')
          return prev
        }
        console.log('Adicionando nova ação pendente. Total:', prev.length + 1)
        return [...prev, action]
      })
    }

    // Usar Ably para receber solicitações em tempo real
    const unsubscribe = subscribeToCombatRequests(gameId, addPendingAction)
    
    console.log('MasterCombatConfirmation: inscrito no canal Ably de combate')

    // Fallback: listener DOM (caso Ably não esteja disponível)
    const handleActionRequested = (event: Event) => {
      const customEvent = event as CustomEvent<PendingAction>
      if (customEvent.detail) {
        addPendingAction(customEvent.detail)
      }
    }
    window.addEventListener('combat-action-requested', handleActionRequested, true)

    return () => {
      unsubscribe()
      window.removeEventListener('combat-action-requested', handleActionRequested, true)
      console.log('MasterCombatConfirmation: listeners removidos')
    }
  }, [isMaster, gameId])

  const loadNPCs = async () => {
    try {
      const data = await getGameNPCs(gameId)
      setNPCs(data)
    } catch (err) {
      console.error('Erro ao carregar NPCs:', err)
    }
  }

  const handleConfirmHit = async (actionId: string, hit: boolean) => {
    const action = pendingActions.find(a => a.id === actionId)
    if (!action) return

    // Remover da lista de pendentes
    setPendingActions(prev => prev.filter(a => a.id !== actionId))

    // Enviar confirmação via Ably
    const success = sendCombatHitConfirmation(gameId, { actionId, hit, gameId })
    
    if (success) {
      console.log('✅ Confirmação enviada via Ably')
    } else {
      // Fallback: evento DOM
      window.dispatchEvent(new CustomEvent('combat-hit-confirmed', {
        detail: { actionId, hit }
      }))
    }

    // Registrar no log
    const targetNames = action.targets.map(t => t.name).join(', ')
    const message = hit
      ? `✅ ${action.actorName} acertou ${action.action.name} em ${targetNames}.`
      : `❌ ${action.actorName} errou ${action.action.name} em ${targetNames}.`

    await logGameEvent(gameId, 'combat_damage', message, {
      actor: action.actorId,
      details: {
        actor_name: action.actorName,
        action_name: action.action.name,
        targets: action.targets.map(t => t.name),
        hit: hit,
      },
    })
  }

  if (!isMaster) {
    return null
  }

  // Sempre renderizar o painel se for mestre (mesmo vazio)
  // Isso garante que o listener esteja sempre ativo

  return (
    <div className="fixed left-0 top-16 bottom-1/2 w-80 bg-gray-900 border-r border-gray-800 z-40 flex flex-col">
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="text-yellow-400">⚔️</span>
          Confirmação de Combate
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Debug: mostrar quantidade de ações pendentes */}
        <div className="mb-2 text-xs text-gray-400">
          Ações pendentes: {pendingActions.length}
        </div>
        
        {pendingActions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-500">
              Aguardando solicitações de confirmação...
            </p>
          </div>
        ) : (
          pendingActions.map((action) => (
          <div
            key={action.id}
            className="p-4 bg-gray-800 rounded-lg border-2 border-yellow-500 shadow-lg"
          >
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">
                  {action.actorType === 'player' ? '👤' : '👹'}
                </span>
                <span className="font-bold text-white">{action.actorName}</span>
              </div>
              <div className="text-sm text-gray-300 mb-1">
                Ação: <span className="font-semibold text-yellow-400">{action.action.name}</span>
              </div>
              <div className="text-xs text-gray-400">
                Alvos: {action.targets.map(t => t.name).join(', ')}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleConfirmHit(action.id, true)}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
              >
                ✓ Acertou
              </button>
              <button
                onClick={() => handleConfirmHit(action.id, false)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
              >
                ✗ Errou
              </button>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  )
}
