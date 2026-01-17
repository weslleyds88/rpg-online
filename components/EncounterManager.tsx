'use client'

import { useState, useEffect } from 'react'
import { 
  createEncounter, 
  addParticipantToEncounter, 
  getActiveEncounter,
  updateEncounter,
  calculateTurnOrder
} from '@/services/encounterService'
import { getGameNPCs } from '@/services/npcService'
import { getGamePlayers } from '@/services/playerService'
import { supabase } from '@/lib/supabase/client'
import type { Encounter, Player, NPC, Character } from '@/lib/supabase/types'

interface EncounterManagerProps {
  gameId: string
  isMaster: boolean
  players: Player[]
  onEncounterChange: () => void
}

export default function EncounterManager({ gameId, isMaster, players, playerCharacters, onEncounterChange }: EncounterManagerProps) {
  const [encounter, setEncounter] = useState<Encounter | null>(null)
  const [npcs, setNPCs] = useState<NPC[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
  const [selectedNPCs, setSelectedNPCs] = useState<Set<string>>(new Set())
  const [encounterName, setEncounterName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadActiveEncounter()
    loadNPCs()
  }, [gameId])

  const loadActiveEncounter = async () => {
    try {
      const active = await getActiveEncounter(gameId)
      setEncounter(active)
    } catch (err) {
      console.error('Erro ao carregar encounter:', err)
    }
  }

  const loadNPCs = async () => {
    try {
      const data = await getGameNPCs(gameId)
      setNPCs(data.filter(n => n.status === 'active'))
    } catch (err) {
      console.error('Erro ao carregar NPCs:', err)
    }
  }

  const handleCreateEncounter = async () => {
    if (!isMaster) return
    if (selectedPlayers.size === 0 && selectedNPCs.size === 0) {
      alert('Selecione pelo menos um participante')
      return
    }

    setLoading(true)
    try {
      // Criar encounter
      const newEncounter = await createEncounter(gameId, encounterName || undefined)
      
      if (!newEncounter || !newEncounter.id) {
        throw new Error('Erro ao criar combate: ID não retornado')
      }
      
      // Adicionar players selecionados
      for (const playerId of selectedPlayers) {
        try {
          await addParticipantToEncounter(newEncounter.id, 'player', playerId)
        } catch (err) {
          console.error(`Erro ao adicionar player ${playerId}:`, err)
          // Continuar mesmo se um falhar
        }
      }

      // Adicionar NPCs selecionados
      for (const npcId of selectedNPCs) {
        try {
          await addParticipantToEncounter(newEncounter.id, 'npc', npcId)
        } catch (err) {
          console.error(`Erro ao adicionar NPC ${npcId}:`, err)
          // Continuar mesmo se um falhar
        }
      }

      setSelectedPlayers(new Set())
      setSelectedNPCs(new Set())
      setEncounterName('')
      await loadActiveEncounter()
      onEncounterChange()
    } catch (err) {
      console.error('Erro ao criar encounter:', err)
      alert('Erro ao criar combate')
    } finally {
      setLoading(false)
    }
  }

  const handleStartCombat = async () => {
    if (!encounter || !isMaster) return
    
    setLoading(true)
    try {
      // Calcular ordem de turnos (se todos já tiverem rolado)
      await calculateTurnOrder(encounter.id)
      
      // Resetar has_acted de todos os participantes para começar o combate limpo
      const { error: resetError } = await supabase
        .from('rpg_initiative_entries')
        .update({ has_acted: false })
        .eq('encounter_id', encounter.id)
      
      if (resetError) throw resetError
      
      // Ativar o combate - começar com o primeiro participante na ordem de iniciativa
      await updateEncounter(encounter.id, { 
        status: 'active',
        current_turn: 1,
        current_round: 1
      })
      
      await loadActiveEncounter()
      onEncounterChange()
    } catch (err) {
      console.error('Erro ao iniciar combate:', err)
      alert('Erro ao iniciar combate')
    } finally {
      setLoading(false)
    }
  }

  const togglePlayer = (playerId: string) => {
    const newSet = new Set(selectedPlayers)
    if (newSet.has(playerId)) {
      newSet.delete(playerId)
    } else {
      newSet.add(playerId)
    }
    setSelectedPlayers(newSet)
  }

  const toggleNPC = (npcId: string) => {
    const newSet = new Set(selectedNPCs)
    if (newSet.has(npcId)) {
      newSet.delete(npcId)
    } else {
      newSet.add(npcId)
    }
    setSelectedNPCs(newSet)
  }

  if (!isMaster) {
    return (
      <div className="text-xs text-gray-400 text-center py-4">
        Apenas o mestre pode gerenciar combates
      </div>
    )
  }

  if (encounter) {
    return (
      <div className="space-y-2">
        <div className="p-2 bg-indigo-900/30 rounded border border-indigo-700">
          <p className="text-xs text-indigo-200 mb-2">
            Combate: <span className="font-semibold text-white">{encounter.name || 'Sem nome'}</span>
          </p>
          <p className="text-xs text-gray-400 mb-2">
            Status: <span className="text-white">{encounter.status === 'setup' ? 'Configuração' : encounter.status === 'active' ? 'Em Andamento' : 'Finalizado'}</span>
          </p>
          {encounter.status === 'setup' && (
            <button
              onClick={handleStartCombat}
              disabled={loading}
              className="w-full px-2 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Iniciando...' : 'Iniciar Combate'}
            </button>
          )}
          {encounter.status === 'active' && (
            <p className="text-xs text-green-400 text-center">
              Combate em andamento - Veja em "Iniciativa"
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Nome do combate */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Nome do Combate (opcional)</label>
        <input
          type="text"
          value={encounterName}
          onChange={(e) => setEncounterName(e.target.value)}
          placeholder="Ex: Combate na Taverna"
          className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-xs placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Seleção de Players */}
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Jogadores</label>
        <div className="space-y-1 max-h-[120px] overflow-y-auto">
          {players.filter(p => p.character_id).length === 0 ? (
            <p className="text-xs text-gray-500">Nenhum jogador com personagem</p>
          ) : (
            players
              .filter(p => p.character_id)
              .map((player) => (
                <label
                  key={player.id}
                  className="flex items-center space-x-2 p-1.5 hover:bg-gray-800 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlayers.has(player.id)}
                    onChange={() => togglePlayer(player.id)}
                    className="w-3 h-3 text-indigo-600 bg-gray-900 border-gray-700 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs text-gray-300">
                    {(() => {
                      const character = playerCharacters.get(player.user_id)
                      return character?.name || `Player ${player.user_id.slice(0, 8)}`
                    })()}
                  </span>
                </label>
              ))
          )}
        </div>
      </div>

      {/* Seleção de NPCs */}
      {npcs.length > 0 && (
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">NPCs/Adversários</label>
          <div className="space-y-1 max-h-[120px] overflow-y-auto">
            {npcs.map((npc) => (
              <label
                key={npc.id}
                className="flex items-center space-x-2 p-1.5 hover:bg-gray-800 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedNPCs.has(npc.id)}
                  onChange={() => toggleNPC(npc.id)}
                  className="w-3 h-3 text-indigo-600 bg-gray-900 border-gray-700 rounded focus:ring-indigo-500"
                />
                <span className="text-xs text-gray-300">{npc.name}</span>
                <span className="text-xs text-gray-500">({npc.type})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Botão criar */}
      <button
        onClick={handleCreateEncounter}
        disabled={loading || (selectedPlayers.size === 0 && selectedNPCs.size === 0)}
        className="w-full px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Criando...' : 'Criar Combate'}
      </button>
    </div>
  )
}
