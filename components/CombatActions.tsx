'use client'

import { useState, useEffect } from 'react'
import { requestCombatConfirmation, subscribeToCombatConfirmations } from '@/services/combatRealtimeService'
import { getActiveEncounter, getEncounterParticipants, markParticipantActed, nextTurn, finishEncounter } from '@/services/encounterService'
import { getGameNPCs } from '@/services/npcService'
import { getGamePlayers } from '@/services/playerService'
import { createCombatTargets } from '@/services/combatService'
import { getCombatActions } from '@/services/combatService'
import type { Encounter, InitiativeEntry, Player, NPC, Character, CombatAction } from '@/lib/supabase/types'
import { useAuth } from '@/hooks/useAuth'
import TargetSelector from './TargetSelector'
import type { CombatTarget } from '@/services/combatService'

interface CombatActionsProps {
  gameId: string
  isMaster: boolean
  players: Player[]
  playerCharacters: Map<string, Character>
}

export default function CombatActions({ gameId, isMaster, players, playerCharacters }: CombatActionsProps) {
  const { user } = useAuth()
  const [encounter, setEncounter] = useState<Encounter | null>(null)
  const [participants, setParticipants] = useState<InitiativeEntry[]>([])
  const [npcs, setNPCs] = useState<NPC[]>([])
  const [actions, setActions] = useState<CombatAction[]>([])
  const [selectedTargets, setSelectedTargets] = useState<CombatTarget[]>([])
  const [selectedAction, setSelectedAction] = useState<CombatAction | null>(null)
  const [hitConfirmed, setHitConfirmed] = useState<boolean | null>(null)
  const [manualDamage, setManualDamage] = useState<string>('')
  const [manualHealing, setManualHealing] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)

  useEffect(() => {
    loadEncounter()
    loadNPCs()
    loadActions()
    
    const interval = setInterval(() => {
      loadEncounter()
      loadNPCs()
    }, 2000)

    // Listener para confirmação do mestre
    const handleHitConfirmed = (confirmation: { actionId: string; hit: boolean }) => {
      const { actionId, hit } = confirmation
      console.log('📥 Confirmação recebida:', { actionId, hit, pendingActionId })
      
      // Verificar se é a ação pendente atual
      if (pendingActionId === actionId) {
        console.log('✅ Confirmação válida para ação:', actionId, 'Hit:', hit)
        setHitConfirmed(hit)
        if (!hit) {
          // Se errou, resetar tudo
          setSelectedTargets([])
          setSelectedAction(null)
          setManualDamage('')
          setManualHealing('')
          setPendingActionId(null)
        }
      } else {
        console.log('⚠️ Confirmação ignorada: actionId não corresponde', { received: actionId, expected: pendingActionId })
      }
    }

    // Usar Ably para receber confirmações em tempo real
    const unsubscribe = subscribeToCombatConfirmations(gameId, handleHitConfirmed)
    
    // Fallback: evento DOM
    const handleHitConfirmedDOM = (event: Event) => {
      const customEvent = event as CustomEvent<{ actionId: string; hit: boolean }>
      handleHitConfirmed(customEvent.detail)
    }
    window.addEventListener('combat-hit-confirmed', handleHitConfirmedDOM)

    return () => {
      clearInterval(interval)
      unsubscribe()
      window.removeEventListener('combat-hit-confirmed', handleHitConfirmedDOM)
    }
  }, [gameId, pendingActionId])

  const loadEncounter = async () => {
    try {
      const active = await getActiveEncounter(gameId)
      setEncounter(active)
      if (active) {
        const parts = await getEncounterParticipants(active.id)
        setParticipants(parts)
      }
    } catch (err) {
      console.error('Erro ao carregar encounter:', err)
    }
  }

  const loadNPCs = async () => {
    try {
      const data = await getGameNPCs(gameId)
      setNPCs(data)
    } catch (err) {
      console.error('Erro ao carregar NPCs:', err)
    }
  }

  const loadActions = async () => {
    try {
      const data = await getCombatActions(gameId)
      setActions(data)
    } catch (err) {
      console.error('Erro ao carregar ações:', err)
    }
  }

  // Criar alvos disponíveis
  const availableTargets = createCombatTargets(players, npcs, playerCharacters)

  // Verificar quem está atacando (turno atual ou qualquer um se não houver combate ativo)
  const getCurrentActor = () => {
    if (!encounter || encounter.status !== 'active') {
      // Se não há combate ativo, qualquer um pode atacar
      // Retornar o player atual ou null
      const player = players.find(p => p.user_id === user?.id)
      if (player) {
        const character = playerCharacters.get(player.user_id)
        return {
          id: player.id,
          type: 'player' as const,
          name: character?.name || `Player ${player.user_id.slice(0, 8)}`,
          userId: player.user_id,
        }
      }
      return null
    }

    const sorted = participants
      .filter(p => p.turn_order !== null)
      .sort((a, b) => a.turn_order! - b.turn_order!)
    
    if (sorted.length === 0) return null
    
    const turnIndex = encounter.current_turn > 0 ? encounter.current_turn - 1 : 0
    const currentParticipant = sorted[turnIndex]
    
    if (!currentParticipant) return null

    if (currentParticipant.participant_type === 'player') {
      const player = players.find(p => p.id === currentParticipant.participant_id)
      if (player) {
        const character = playerCharacters.get(player.user_id)
        return {
          id: currentParticipant.participant_id,
          type: 'player' as const,
          name: character?.name || `Player ${player.user_id.slice(0, 8)}`,
          userId: player.user_id,
        }
      }
    } else {
      const npc = npcs.find(n => n.id === currentParticipant.participant_id)
      if (npc) {
        return {
          id: currentParticipant.participant_id,
          type: 'npc' as const,
          name: npc.name,
          userId: null,
        }
      }
    }
    
    return null
  }

  const currentActor = getCurrentActor()
  // Pode agir se:
  // 1. Não há combate ativo (qualquer um pode atacar)
  // 2. É o turno do player atual
  // 3. É o turno de um NPC e o usuário é mestre
  const canAct = !encounter || encounter.status !== 'active' || 
    (currentActor && (
      (currentActor.type === 'player' && currentActor.userId === user?.id) ||
      (currentActor.type === 'npc' && isMaster)
    ))

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
    setHitConfirmed(null)
    setManualDamage('')
    setManualHealing('')
  }

  const handleSelectAction = (action: CombatAction) => {
    setSelectedAction(action)
    setSelectedTargets([]) // Reset targets
    setHitConfirmed(null)
    setManualDamage('')
    setManualHealing('')
  }

  const requestMasterConfirmation = () => {
    console.log('requestMasterConfirmation chamado', {
      selectedAction,
      currentActor,
      selectedTargets,
      encounter
    })

    if (!selectedAction) {
      alert('Selecione uma ação primeiro')
      return
    }
    if (!currentActor) {
      alert('Erro: não foi possível identificar o ator atual')
      return
    }
    if (selectedTargets.length === 0) {
      alert('Selecione pelo menos um alvo')
      return
    }

    // Permitir mesmo sem encounter ativo (para testes)
    const actionId = `${currentActor.id}-${selectedAction.id}-${Date.now()}`
    setPendingActionId(actionId)
    
    const eventDetail = {
      id: actionId,
      actorId: currentActor.id,
      actorType: currentActor.type,
      actorName: currentActor.name,
      action: selectedAction,
      targets: selectedTargets.map(t => ({
        id: t.id,
        type: t.type,
        name: t.name,
      })),
      gameId,
      encounterId: encounter?.id || 'no-encounter',
    }

    console.log('Disparando solicitação de confirmação de combate', eventDetail)
    
    // Usar Ably para comunicação em tempo real
    const success = requestCombatConfirmation(gameId, eventDetail)
    
    if (success) {
      console.log('✅ Solicitação enviada via Ably com sucesso')
    } else {
      console.warn('⚠️ Falha ao enviar via Ably, tentando fallback...')
      // Fallback: eventos DOM
      const event = new CustomEvent('combat-action-requested', {
        detail: eventDetail,
        bubbles: true,
        cancelable: true
      })
      window.dispatchEvent(event)
      document.dispatchEvent(event)
    }
  }

  // Verificar se todos os NPCs do encontro morreram
  const checkIfAllNPCsDead = async (encounterId: string): Promise<boolean> => {
    try {
      // Buscar todos os participantes NPCs do encontro
      const encounterParticipants = await getEncounterParticipants(encounterId)
      const npcParticipants = encounterParticipants.filter(p => p.participant_type === 'npc')
      
      if (npcParticipants.length === 0) {
        // Se não há NPCs no encontro, não finalizar
        return false
      }

      // Buscar todos os NPCs do jogo
      const allNPCs = await getGameNPCs(gameId)
      
      // Verificar se todos os NPCs do encontro estão mortos (não existem mais ou têm HP <= 0)
      const allDead = npcParticipants.every(npcParticipant => {
        const npc = allNPCs.find(n => n.id === npcParticipant.participant_id)
        // NPC não existe mais (foi deletado) ou tem HP <= 0
        return !npc || npc.hp <= 0
      })

      return allDead
    } catch (err) {
      console.error('Erro ao verificar se todos os NPCs morreram:', err)
      return false
    }
  }

  // Verificar se todos os players do encontro morreram ou ficaram inconscientes
  const checkIfAllPlayersDead = async (encounterId: string): Promise<boolean> => {
    try {
      const { supabase } = await import('@/lib/supabase/client')
      
      // Buscar todos os participantes players do encontro
      const encounterParticipants = await getEncounterParticipants(encounterId)
      const playerParticipants = encounterParticipants.filter(p => p.participant_type === 'player')
      
      if (playerParticipants.length === 0) {
        // Se não há players no encontro, não finalizar
        return false
      }

      // Buscar todos os players do jogo
      const allPlayers = await getGamePlayers(gameId)
      
      // Verificar se todos os players do encontro estão mortos/inconscientes
      const allDeadOrInactive = await Promise.all(
        playerParticipants.map(async (playerParticipant) => {
          const player = allPlayers.find(p => p.id === playerParticipant.participant_id)
          if (!player?.character_id) return false
          
          // Buscar character
          const { data: character } = await supabase
            .from('rpg_characters')
            .select('hp, status')
            .eq('id', player.character_id)
            .single()
          
          // Player está morto/inconsciente se HP <= 0 ou status é 'inactive' ou 'dead'
          return !character || character.hp <= 0 || character.status === 'inactive' || character.status === 'dead'
        })
      )

      return allDeadOrInactive.every(isDead => isDead === true)
    } catch (err) {
      console.error('Erro ao verificar se todos os players morreram:', err)
      return false
    }
  }

  const handleExecuteAction = async () => {
    if (!selectedAction || selectedTargets.length === 0 || !currentActor) return
    
    // Para ações de ataque, precisa ter acertado
    // Para Cura, não precisa confirmação de acerto
    if (selectedAction.name !== 'Cura' && hitConfirmed !== true) return

    // Validar valores
    if (selectedAction.name === 'Cura') {
      const healing = parseInt(manualHealing)
      if (isNaN(healing) || healing <= 0) {
        alert('Insira um valor de cura válido')
        return
      }
    } else {
      // Ataque ou Ataque em Área
      const damage = parseInt(manualDamage)
      if (isNaN(damage) || damage <= 0) {
        alert('Insira um valor de dano válido')
        return
      }
    }

    // Se não há encounter ativo, não podemos aplicar
    if (!encounter || encounter.status !== 'active') {
      if (isMaster) {
        alert('Não há combate ativo. Crie e inicie um combate na seção "Gerenciar Combate" primeiro.')
      } else {
        alert('Não há combate ativo. O mestre precisa iniciar um combate primeiro.')
      }
      return
    }

    setLoading(true)
    try {
      // Aplicar dano ou cura manualmente
      if (selectedAction.name === 'Cura') {
        const healing = parseInt(manualHealing)
        await applyHealing(selectedTargets, healing, currentActor, encounter.id)
      } else {
        const damage = parseInt(manualDamage)
        await applyDamage(selectedTargets, damage, currentActor, encounter.id, selectedAction)
      }

      // Marcar participante como tendo agido e avançar turno
      const currentParticipant = participants.find(p => {
        if (currentActor.type === 'player') {
          return p.participant_type === 'player' && p.participant_id === currentActor.id
        } else {
          return p.participant_type === 'npc' && p.participant_id === currentActor.id
        }
      })

      if (currentParticipant) {
        await markParticipantActed(currentParticipant.id)
      }

      // Recarregar dados antes de verificar se todos os NPCs morreram
      await loadEncounter()
      await loadNPCs()

      // Verificar se todos os NPCs morreram OU se todos os players morreram/ficaram inconscientes
      const allNPCsDead = await checkIfAllNPCsDead(encounter.id)
      const allPlayersDead = await checkIfAllPlayersDead(encounter.id)
      
      if (allNPCsDead) {
        // Finalizar encontro automaticamente - vitória dos players
        await finishEncounter(encounter.id)
        await loadEncounter()
        alert('🎉 Todos os inimigos foram derrotados! A batalha foi finalizada.')
      } else if (allPlayersDead) {
        // Finalizar encontro automaticamente - derrota dos players
        await finishEncounter(encounter.id)
        await loadEncounter()
        alert('💀 Todos os jogadores foram derrotados! A batalha foi finalizada.')
      } else {
        // Avançar turno automaticamente (após 1 ação)
        await nextTurn(encounter.id)
        await loadEncounter()
      }

      // Resetar tudo
      setSelectedTargets([])
      setSelectedAction(null)
      setHitConfirmed(null)
      setPendingActionId(null)
      setManualDamage('')
      setManualHealing('')

      // Disparar evento
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('combat-action-executed', {
          detail: { encounterId: encounter.id }
        }))
        window.dispatchEvent(new CustomEvent('turn-advanced', {
          detail: { encounterId: encounter.id }
        }))
      }
    } catch (err) {
      console.error('Erro ao executar ação:', err)
      alert('Erro ao executar ação')
    } finally {
      setLoading(false)
    }
  }

  // Aplicar dano manual
  const applyDamage = async (
    targets: CombatTarget[],
    damage: number,
    actor: { id: string; type: 'player' | 'npc'; name: string },
    encounterId: string,
    action: CombatAction
  ) => {
    const { createAction } = await import('@/services/actionService')
    const { logGameEvent } = await import('@/services/chatService')
    const { addXPFromMonster } = await import('@/services/xpService')
    
    for (const target of targets) {
      // Atualizar HP
      const newHp = Math.max(0, target.currentHp - damage)
      const wasAlive = target.currentHp > 0
      const isNowDead = newHp === 0 && target.type === 'npc'
      
      // Salvar informações do NPC antes de deletar (se for NPC)
      let killedNPC: NPC | null = null
      if (target.type === 'npc') {
        killedNPC = npcs.find(n => n.id === target.id) || null
      }
      
      await updateTargetHp(target.id, target.type, newHp, target.status)

      // Se um NPC foi morto por um player, dar XP
      if (wasAlive && isNowDead && target.type === 'npc' && actor.type === 'player' && killedNPC) {
        try {
          // Buscar character do player
          const player = players.find(p => p.id === actor.id)
          if (player?.character_id) {
            // Buscar nível do character
            const { supabase } = await import('@/lib/supabase/client')
            const { data: character } = await supabase
              .from('rpg_characters')
              .select('level')
              .eq('id', player.character_id)
              .single()

            if (character) {
              const result = await addXPFromMonster(
                player.character_id,
                killedNPC.level || 1,
                character.level || 1
              )

              // Log de XP ganho
              if (result.xpGained > 0) {
                const xpMessage = result.leveledUp
                  ? `⭐ ${actor.name} derrotou ${target.name} e ganhou ${result.xpGained}% XP! Subiu para o nível ${result.newLevel}!`
                  : `✨ ${actor.name} derrotou ${target.name} e ganhou ${result.xpGained}% XP! (${result.newXP.toFixed(1)}% total)`
                
                await logGameEvent(gameId, 'combat_xp', xpMessage, {
                  actor: actor.id,
                  details: {
                    actor_name: actor.name,
                    target_name: target.name,
                    xp_gained: result.xpGained,
                    leveled_up: result.leveledUp,
                    new_level: result.newLevel
                  }
                })

                // Disparar evento de level up se o player subiu de nível
                if (result.leveledUp) {
                  console.log('🎉 Player subiu de nível! Disparando evento...', {
                    characterId: player.character_id,
                    newLevel: result.newLevel,
                    playerName: actor.name
                  })
                  if (typeof window !== 'undefined') {
                    const event = new CustomEvent('character-leveled-up', {
                      detail: {
                        characterId: player.character_id,
                        newLevel: result.newLevel
                      }
                    })
                    window.dispatchEvent(event)
                    console.log('✅ Evento character-leveled-up disparado')
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error('Erro ao adicionar XP:', err)
          // Não bloquear a ação se houver erro ao adicionar XP
        }
      }

      // Criar log no ActionLog via chatService
      const targetName = target.name
      const message = `⚔️ ${actor.name} usou ${action.name} em ${targetName} e causou ${damage} de dano. ${targetName} agora tem ${newHp}/${target.maxHp} HP.`
      
      await logGameEvent(gameId, 'combat_damage', message, {
        actor: actor.id,
        details: {
          actor_name: actor.name,
          action_name: action.name,
          target_name: targetName,
          damage: damage,
          new_hp: newHp,
          max_hp: target.maxHp,
        },
      })
    }
  }

  // Aplicar cura manual
  const applyHealing = async (
    targets: CombatTarget[],
    healing: number,
    actor: { id: string; type: 'player' | 'npc'; name: string },
    encounterId: string
  ) => {
    const { logGameEvent } = await import('@/services/chatService')
    
    for (const target of targets) {
      // Atualizar HP (não pode exceder maxHp)
      const newHp = Math.min(target.maxHp, target.currentHp + healing)
      await updateTargetHp(target.id, target.type, newHp, 'active')

      // Criar log no ActionLog via chatService
      const targetName = target.name
      const message = `💚 ${actor.name} curou ${targetName} em ${healing} HP. ${targetName} agora tem ${newHp}/${target.maxHp} HP.`
      
      await logGameEvent(gameId, 'combat_healing', message, {
        actor: actor.id,
        details: {
          actor_name: actor.name,
          target_name: targetName,
          healing: healing,
          new_hp: newHp,
          max_hp: target.maxHp,
        },
      })
    }
  }

  // Atualizar HP de um alvo
  const updateTargetHp = async (
    targetId: string,
    targetType: 'player' | 'npc',
    newHp: number,
    newStatus: 'active' | 'inactive' | 'dead'
  ) => {
    const { supabase } = await import('@/lib/supabase/client')
    
    if (targetType === 'player') {
      const { data: player } = await supabase
        .from('rpg_players')
        .select('character_id')
        .eq('id', targetId)
        .single()

      if (player?.character_id) {
        await supabase
          .from('rpg_characters')
          .update({
            hp: newHp,
            status: newHp === 0 ? 'inactive' : 'active',
          })
          .eq('id', player.character_id)
      }
    } else {
      if (newHp === 0) {
        await supabase
          .from('rpg_npcs')
          .delete()
          .eq('id', targetId)
        return
      }

      await supabase
        .from('rpg_npcs')
        .update({
          hp: newHp,
          status: 'active',
        })
        .eq('id', targetId)
    }
  }

  return (
    <div className="space-y-4">
      {/* Informação do atacante atual */}
      {encounter && encounter.status === 'active' && currentActor && (
        <div className="p-2 bg-indigo-900/30 border border-indigo-500 rounded text-xs">
          <p className="text-indigo-200 font-semibold">
            Turno: {currentActor.name}
          </p>
        </div>
      )}

      {!canAct && encounter && encounter.status === 'active' && (
        <div className="p-3 bg-gray-800 border border-gray-700 rounded text-xs text-gray-400 text-center">
          Aguarde seu turno para realizar ações de combate
        </div>
      )}

      {canAct && (
        <>
          {/* Seleção de Ação */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-300">
              Selecionar Ação
            </label>
            <div className="space-y-1 max-h-[150px] overflow-y-auto">
              {actions.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-2">
                  Nenhuma ação disponível
                </div>
              ) : (
                actions.map((action) => {
                  const diceNotation = `${action.dice_amount}d${action.dice_type}`
                  const modifierStr = action.modifier !== 0
                    ? (action.modifier > 0 ? ` + ${action.modifier}` : ` ${action.modifier}`)
                    : ''
                  
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleSelectAction(action)}
                      className={`w-full text-left p-2 rounded border text-xs ${
                        selectedAction?.id === action.id
                          ? 'bg-indigo-900/50 border-indigo-500'
                          : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                      }`}
                    >
                      <div className="font-medium text-white">{action.name}</div>
                      <div className="text-gray-400">
                        Ataque: d20{modifierStr} • Dano: {diceNotation}{modifierStr}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Seleção de Alvos */}
          {selectedAction && (
            <TargetSelector
              targets={availableTargets}
              selectedTargets={selectedTargets}
              onSelectTarget={handleSelectTarget}
              maxTargets={selectedAction.target_type === 'single' ? 1 : Infinity}
              disabled={false}
            />
          )}

          {/* Solicitar confirmação do mestre (apenas para ataques) */}
          {selectedAction && selectedTargets.length > 0 && selectedAction.name !== 'Cura' && !hitConfirmed && (
            <div className="space-y-2 p-3 bg-gray-800 rounded border border-gray-700">
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Confirmação de Acerto
              </label>
              <p className="text-xs text-gray-400 mb-3">
                {isMaster && currentActor?.type === 'npc' 
                  ? 'Role o dado fora do site e confirme se acertou ou errou.'
                  : 'Role o dado fora do site e informe o resultado ao mestre.'}
              </p>
              {!isMaster && (
                <button
                  onClick={() => requestMasterConfirmation()}
                  className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded text-xs"
                >
                  Solicitar Confirmação do Mestre
                </button>
              )}
              {/* Mestre controlando NPC: solicitar confirmação para aparecer no painel */}
              {isMaster && currentActor?.type === 'npc' && (
                <button
                  onClick={() => requestMasterConfirmation()}
                  className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded text-xs"
                >
                  Solicitar Confirmação (Aparecerá no painel esquerdo)
                </button>
              )}
              {!isMaster && hitConfirmed === null && (
                <div className="text-xs text-gray-500 text-center py-2">
                  Aguardando mestre confirmar acerto no painel esquerdo...
                </div>
              )}
              {isMaster && currentActor?.type === 'npc' && hitConfirmed === null && (
                <div className="text-xs text-gray-500 text-center py-2">
                  Confirme no painel esquerdo se acertou ou errou...
                </div>
              )}
              
              {(hitConfirmed !== null) && (
                <div className={`mt-2 p-2 rounded text-xs text-center ${
                  hitConfirmed ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                }`}>
                  {hitConfirmed ? '✓ Acertou! Insira o dano.' : '✗ Errou - Ação encerrada'}
                </div>
              )}
            </div>
          )}


          {/* Campo de Dano (apenas se acertou e é ataque) */}
          {hitConfirmed === true && selectedAction && selectedAction.name !== 'Cura' && selectedTargets.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300">
                Dano Causado
              </label>
              <input
                type="number"
                value={manualDamage}
                onChange={(e) => setManualDamage(e.target.value)}
                placeholder="Ex: 15"
                min="1"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
              />
            </div>
          )}

          {/* Campo de Cura (apenas para ação de Cura) */}
          {selectedAction && selectedAction.name === 'Cura' && selectedTargets.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300">
                Quantidade de Cura
              </label>
              <input
                type="number"
                value={manualHealing}
                onChange={(e) => setManualHealing(e.target.value)}
                placeholder="Ex: 10"
                min="1"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
              />
            </div>
          )}

          {/* Botão de Executar */}
          {((hitConfirmed === true && selectedAction && selectedAction.name !== 'Cura' && manualDamage) ||
            (selectedAction && selectedAction.name === 'Cura' && manualHealing && hitConfirmed !== false)) && 
           selectedTargets.length > 0 && encounter && (
            <button
              onClick={handleExecuteAction}
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? 'Aplicando...' 
                : selectedAction.name === 'Cura' 
                  ? '💚 Aplicar Cura' 
                  : '⚔️ Aplicar Dano'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
