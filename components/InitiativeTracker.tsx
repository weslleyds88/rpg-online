'use client'

import { useState, useEffect } from 'react'
import { 
  getActiveEncounter, 
  getEncounterParticipants, 
  rollInitiative, 
  calculateTurnOrder,
  nextTurn,
  finishEncounter
} from '@/services/encounterService'
import { getGameNPCs } from '@/services/npcService'
import { getGamePlayers } from '@/services/playerService'
import type { Encounter, InitiativeEntry, Player, NPC, Character } from '@/lib/supabase/types'
import { useAuth } from '@/hooks/useAuth'

interface InitiativeTrackerProps {
  gameId: string
  isMaster: boolean
  players: Player[]
  playerCharacters: Map<string, Character>
}

export default function InitiativeTracker({ gameId, isMaster, players, playerCharacters }: InitiativeTrackerProps) {
  const { user } = useAuth()
  const [encounter, setEncounter] = useState<Encounter | null>(null)
  const [participants, setParticipants] = useState<InitiativeEntry[]>([])
  const [npcs, setNPCs] = useState<NPC[]>([])
  const [loading, setLoading] = useState(false)
  const [rollingFor, setRollingFor] = useState<string | null>(null)

  useEffect(() => {
    loadEncounter()
    loadNPCs()
    
    // Listener para quando o encounter mudar
    const handleEncounterChanged = () => {
      loadEncounter()
    }
    window.addEventListener('encounter-changed', handleEncounterChanged)
    
    // Listener para quando o turno avançar (atualização imediata)
    const handleTurnAdvanced = () => {
      if (encounter) {
        loadEncounter()
        loadParticipants()
      }
    }
    window.addEventListener('turn-advanced', handleTurnAdvanced)
    
    // Polling mais frequente quando há combate ativo (1 segundo)
    // Polling menos frequente quando não há combate (3 segundos)
    const pollingInterval = encounter?.status === 'active' ? 1000 : 3000
    const interval = setInterval(() => {
      if (encounter) {
        loadEncounter()
        loadParticipants()
      }
    }, pollingInterval)

    return () => {
      window.removeEventListener('encounter-changed', handleEncounterChanged)
      window.removeEventListener('turn-advanced', handleTurnAdvanced)
      clearInterval(interval)
    }
  }, [gameId, encounter?.id, encounter?.status])

  const loadEncounter = async () => {
    try {
      const active = await getActiveEncounter(gameId)
      setEncounter(active)
      if (active) {
        await loadParticipants()
      } else {
        setParticipants([])
      }
    } catch (err) {
      console.error('Erro ao carregar encounter:', err)
    }
  }

  const loadParticipants = async () => {
    if (!encounter) return
    try {
      const data = await getEncounterParticipants(encounter.id)
      setParticipants(data)
    } catch (err) {
      console.error('Erro ao carregar participantes:', err)
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

  const getNextToRoll = (): InitiativeEntry | null => {
    // Encontrar o primeiro participante que ainda não rolou, por ordem de criação
    const notRolled = participants
      .filter(p => p.initiative_value === null)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    return notRolled[0] || null
  }

  const canRollNow = (entry: InitiativeEntry): boolean => {
    const nextToRoll = getNextToRoll()
    if (!nextToRoll) return false
    return nextToRoll.id === entry.id
  }

  const handleRollInitiative = async (entryId: string) => {
    const entry = participants.find(p => p.id === entryId)
    if (!entry) return

    // Verificar se é a vez desta pessoa rolar
    if (!canRollNow(entry)) {
      alert('Aguarde sua vez de rolar!')
      return
    }

    // Verificar se é o próprio player ou o mestre controlando NPC
    if (entry.participant_type === 'player') {
      const player = players.find(p => p.id === entry.participant_id)
      // Players só podem rolar para si mesmos, mestre NÃO pode rolar para players
      if (player?.user_id !== user?.id) {
        alert('Você só pode rolar para seu próprio personagem!')
        return
      }
    } else {
      // NPC - só mestre pode rolar
      if (!isMaster) {
        alert('Apenas o mestre pode rolar para NPCs!')
        return
      }
    }

    setRollingFor(entryId)
    try {
      // Rolar d20
      const diceValue = Math.floor(Math.random() * 20) + 1
      await rollInitiative(entryId, diceValue)
      await loadParticipants()
      
      // Disparar evento para outros clientes atualizarem
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('encounter-changed'))
      }
      
      // Se todos tiverem rolado, calcular ordem automaticamente
      const updated = await getEncounterParticipants(encounter!.id)
      const allRolled = updated.every(p => p.initiative_value !== null)
      if (allRolled) {
        if (isMaster) {
          await calculateTurnOrder(encounter!.id)
          await loadEncounter()
          // Disparar evento novamente após calcular ordem
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('encounter-changed'))
          }
        } else {
          // Se não for mestre, apenas recarregar (o mestre vai calcular)
          await loadParticipants()
        }
      }
    } catch (err) {
      console.error('Erro ao rolar iniciativa:', err)
      alert('Erro ao rolar iniciativa')
    } finally {
      setRollingFor(null)
    }
  }

  const handleNextTurn = async () => {
    if (!encounter || !isMaster) return
    setLoading(true)
    try {
      await nextTurn(encounter.id)
      await loadEncounter()
    } catch (err) {
      console.error('Erro ao avançar turno:', err)
      alert('Erro ao avançar turno')
    } finally {
      setLoading(false)
    }
  }

  const handleAdvanceMyTurn = async () => {
    if (!encounter || !currentTurn) return
    
    const entry = participants.find(p => p.id === currentTurn.id)
    if (!entry) return

    // Verificar se é o próprio player ou mestre controlando NPC
    if (entry.participant_type === 'player') {
      const player = players.find(p => p.id === entry.participant_id)
      // MESTRE NÃO PODE AVANÇAR TURNO DE PLAYERS - só o próprio player
      if (player?.user_id !== user?.id) {
        alert('Você só pode avançar seu próprio turno!')
        return
      }
    } else {
      // NPC - só mestre pode avançar
      if (!isMaster) {
        alert('Apenas o mestre pode avançar turnos de NPCs!')
        return
      }
    }

    setLoading(true)
    try {
      // Avançar para o próximo turno
      await nextTurn(encounter.id)
      
      // Recarregar tudo para atualizar a UI
      await loadEncounter()
      await loadParticipants()
      
      // Disparar evento para outros clientes atualizarem imediatamente
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('encounter-changed'))
        window.dispatchEvent(new CustomEvent('turn-advanced', { 
          detail: { encounterId: encounter.id } 
        }))
      }
    } catch (err) {
      console.error('Erro ao avançar turno:', err)
      alert('Erro ao avançar turno')
    } finally {
      setLoading(false)
    }
  }

  const canAdvanceTurn = (entry: InitiativeEntry): boolean => {
    if (entry.participant_type === 'player') {
      const player = players.find(p => p.id === entry.participant_id)
      return player?.user_id === user?.id
    } else {
      // NPC - só mestre pode avançar
      return isMaster
    }
  }

  const handleFinishEncounter = async () => {
    if (!encounter || !isMaster) return
    if (!confirm('Finalizar este combate?')) return
    
    setLoading(true)
    try {
      await finishEncounter(encounter.id)
      setEncounter(null)
      setParticipants([])
    } catch (err) {
      console.error('Erro ao finalizar combate:', err)
      alert('Erro ao finalizar combate')
    } finally {
      setLoading(false)
    }
  }

  const getParticipantName = (entry: InitiativeEntry): string => {
    if (entry.participant_type === 'player') {
      const player = players.find(p => p.id === entry.participant_id)
      if (player) {
        const character = playerCharacters.get(player.user_id)
        return character?.name || `Player ${player.user_id.slice(0, 8)}`
      }
    } else {
      const npc = npcs.find(n => n.id === entry.participant_id)
      return npc?.name || `NPC ${entry.participant_id.slice(0, 8)}`
    }
    return 'Desconhecido'
  }

  const getParticipantType = (entry: InitiativeEntry): 'player' | 'npc' => {
    return entry.participant_type
  }

  const isMyParticipant = (entry: InitiativeEntry): boolean => {
    if (entry.participant_type === 'player') {
      const player = players.find(p => p.id === entry.participant_id)
      return player?.user_id === user?.id
    }
    return false
  }

  const getCurrentTurnParticipant = (): InitiativeEntry | null => {
    if (!encounter) return null
    
    const sorted = participants
      .filter(p => p.turn_order !== null)
      .sort((a, b) => a.turn_order! - b.turn_order!)
    
    if (sorted.length === 0) return null
    
    // current_turn é 1-indexed (1 = primeiro turno, 2 = segundo, etc.)
    // Mas o array é 0-indexed, então precisamos subtrair 1
    // Se current_turn for 0, trata como primeiro turno (índice 0)
    const turnIndex = encounter.current_turn > 0 ? encounter.current_turn - 1 : 0
    return sorted[turnIndex] || null
  }

  const sortedParticipants = [...participants]
    .filter(p => p.turn_order !== null)
    .sort((a, b) => a.turn_order! - b.turn_order!)

  const currentTurn = getCurrentTurnParticipant()

  if (!encounter) {
    return (
      <div className="text-xs text-gray-400 text-center py-4">
        Nenhum combate ativo
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header do combate */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
        <div>
          <h4 className="text-sm font-semibold text-white">
            {encounter.name || 'Combate'}
          </h4>
          <p className="text-xs text-gray-400">
            {encounter.status === 'setup' 
              ? 'Configuração - Role os dados de iniciativa'
              : (() => {
                  const totalParticipants = participants.filter(p => p.turn_order !== null).length
                  const actedCount = participants.filter(p => p.has_acted === true).length
                  return `Rodada ${encounter.current_round} • ${actedCount}/${totalParticipants} ações realizadas`
                })()}
          </p>
          {encounter.status === 'active' && (
            <p className="text-xs text-gray-500 mt-0.5">
              A ordem de ações é determinada pela iniciativa
            </p>
          )}
        </div>
        {isMaster && (
          <button
            onClick={handleFinishEncounter}
            disabled={loading}
            className="text-xs px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
          >
            Finalizar
          </button>
        )}
      </div>

      {/* Indicador de quem deve rolar iniciativa */}
      {encounter.status === 'setup' && getNextToRoll() && (
        <div className="p-3 bg-yellow-900/30 border-2 border-yellow-500 rounded-lg mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎲</span>
              <div>
                <p className="text-sm font-bold text-yellow-200">
                  {getParticipantName(getNextToRoll()!)}
                </p>
                <p className="text-xs text-gray-400">
                  {getParticipantType(getNextToRoll()!) === 'player' ? '👤 Jogador' : '👹 NPC'}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-yellow-300 mb-2">
            {isMyParticipant(getNextToRoll()!) 
              ? 'É sua vez! Role o dado de iniciativa (d20)'
              : 'Aguardando esta pessoa rolar...'}
          </p>
        </div>
      )}

      {/* Indicador de turno atual */}
      {encounter.status === 'active' && currentTurn && (
        <div className="p-3 bg-indigo-900/50 border-2 border-indigo-500 rounded-lg mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚔️</span>
              <div>
                <p className="text-sm font-bold text-indigo-200">
                  Ação de {getParticipantName(currentTurn)}
                </p>
                <p className="text-xs text-gray-400">
                  {getParticipantType(currentTurn) === 'player' ? '👤 Jogador' : '👹 NPC'} • Ordem: #{currentTurn.turn_order}
                </p>
              </div>
            </div>
            <span className="text-xs text-indigo-300 font-semibold">
              Rodada {encounter.current_round}
            </span>
          </div>
          {(() => {
            const totalParticipants = participants.filter(p => p.turn_order !== null).length
            const actedCount = participants.filter(p => p.has_acted === true).length
            const isLastAction = actedCount === totalParticipants - 1 && !currentTurn.has_acted
            return (
              <>
                {canAdvanceTurn(currentTurn) ? (
                  <button
                    onClick={handleAdvanceMyTurn}
                    disabled={loading}
                    className="w-full px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Avançando...' : isLastAction ? 'Finalizar Turno' : 'Realizar Ação'}
                  </button>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">
                    Aguardando {getParticipantName(currentTurn)} realizar sua ação...
                  </p>
                )}
                {isLastAction && canAdvanceTurn(currentTurn) && (
                  <p className="text-xs text-yellow-300 text-center mt-1">
                    Última ação do turno! Após isso, a rodada avança.
                  </p>
                )}
              </>
            )
          })(          )}
        </div>
      )}

      {/* Lista de participantes */}
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {participants.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-2">
            Nenhum participante
          </p>
        ) : (
          participants.map((entry) => {
            const name = getParticipantName(entry)
            const isCurrentTurn = currentTurn?.id === entry.id
            const isMyParticipantEntry = isMyParticipant(entry)
            const participantType = getParticipantType(entry)

            return (
              <div
                key={entry.id}
                className={`p-2 rounded border text-xs ${
                  isCurrentTurn
                    ? 'bg-indigo-900/50 border-indigo-500 ring-2 ring-indigo-400'
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs ${participantType === 'player' ? 'text-blue-400' : 'text-red-400'}`}>
                      {participantType === 'player' ? '👤' : '👹'}
                    </span>
                    <span className={`font-medium ${isCurrentTurn ? 'text-indigo-200' : 'text-white'}`}>
                      {name}
                    </span>
                    {isMyParticipantEntry && !isCurrentTurn && (
                      <span className="text-xs text-gray-400">(Você)</span>
                    )}
                  </div>
                  {entry.turn_order && (
                    <span className="text-gray-400">#{entry.turn_order}</span>
                  )}
                </div>
                
                {entry.initiative_value !== null ? (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">
                      Iniciativa: <span className="text-white font-bold">{entry.initiative_value}</span>
                      {entry.turn_order && (
                        <span className="ml-2 text-gray-500">• Ordem: #{entry.turn_order}</span>
                      )}
                    </span>
                    {encounter.status === 'active' && entry.has_acted && (
                      <span className="text-xs text-green-400 font-semibold">✓ Agiu</span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {canRollNow(entry) ? (
                      <div className="p-2 bg-yellow-900/30 border border-yellow-600 rounded">
                        <p className="text-xs text-yellow-300 font-semibold mb-1">
                          {isMyParticipant(entry) ? '🎲 SUA VEZ DE ROLAR!' : '⏳ Aguardando rolagem...'}
                        </p>
                        <button
                          onClick={() => handleRollInitiative(entry.id)}
                          disabled={rollingFor === entry.id || (entry.participant_type === 'player' && !isMyParticipant(entry) && !isMaster) || (entry.participant_type === 'npc' && !isMaster)}
                          className="w-full text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          {rollingFor === entry.id ? 'Rolando...' : '🎲 Rolar d20'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">Aguardando vez...</span>
                        <span className="text-xs text-gray-600">⏸️</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
