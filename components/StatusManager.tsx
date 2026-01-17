'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Player, NPC, Character } from '@/lib/supabase/types'
import { getGameNPCs } from '@/services/npcService'

interface StatusManagerProps {
  gameId: string
  isMaster: boolean
  players: Player[]
  playerCharacters: Map<string, Character>
  onUpdate?: () => void
}

interface ParticipantStatus {
  id: string
  type: 'player' | 'npc'
  name: string
  currentHp: number
  maxHp: number
  status: 'active' | 'inactive' | 'dead'
  userId?: string
  characterId?: string
  xp_percentage?: number
}

export default function StatusManager({ 
  gameId, 
  isMaster, 
  players, 
  playerCharacters,
  onUpdate 
}: StatusManagerProps) {
  const [npcs, setNPCs] = useState<NPC[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editHp, setEditHp] = useState<number>(0)
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'dead'>('active')
  const [showXPInput, setShowXPInput] = useState<string | null>(null)
  const [xpToAdd, setXpToAdd] = useState<string>('')
  const [showHPIncreaseInput, setShowHPIncreaseInput] = useState<string | null>(null)
  const [hpIncrease, setHpIncrease] = useState<string>('5')

  useEffect(() => {
    if (isMaster) {
      loadNPCs()
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

  // Criar lista unificada de participantes
  const participants: ParticipantStatus[] = [
    // Players
    ...players.map(player => {
      const character = playerCharacters.get(player.user_id)
      const currentHp = character?.hp || 0
      // Para players, usar max_hp se existir, senão usar HP atual ou 10 como padrão
      const maxHp = character ? ((character as any).max_hp ?? Math.max(currentHp, 10)) : 10
      return {
        id: player.id,
        type: 'player' as const,
        name: character?.name || `Player ${player.user_id.slice(0, 8)}`,
        currentHp,
        maxHp,
        status: (character?.status || 'active') as 'active' | 'inactive' | 'dead',
        userId: player.user_id,
        characterId: character?.id,
        xp_percentage: character?.xp_percentage || 0,
      }
    }),
    // NPCs
    ...npcs.map(npc => ({
      id: npc.id,
      type: 'npc' as const,
      name: npc.name,
      currentHp: npc.hp,
      maxHp: npc.max_hp,
      status: (npc.status || 'active') as 'active' | 'inactive' | 'dead',
    })),
  ]

  const updateParticipantStatus = async (
    participantId: string,
    type: 'player' | 'npc',
    newHp: number,
    newStatus: 'active' | 'inactive' | 'dead'
  ) => {
    setLoading(true)
    try {
      if (type === 'player') {
        const player = players.find(p => p.id === participantId)
        if (player?.character_id) {
          await supabase
            .from('rpg_characters')
            .update({
              hp: newHp,
              status: newStatus,
            })
            .eq('id', player.character_id)
        }
      } else {
        // NPC
        if (newStatus === 'dead' && newHp === 0) {
          // Deletar NPC se morto
          await supabase
            .from('rpg_npcs')
            .delete()
            .eq('id', participantId)
        } else {
          // Atualizar NPC
          await supabase
            .from('rpg_npcs')
            .update({
              hp: newHp,
              status: newStatus,
            })
            .eq('id', participantId)
        }
      }

      // Recarregar dados
      await loadNPCs()
      if (onUpdate) onUpdate()
      
      // Disparar evento para outros componentes atualizarem
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('status-updated', {
          detail: { participantId, type, newHp, newStatus }
        }))
      }
      
      setEditingId(null)
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      alert('Erro ao atualizar status')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = async (
    participantId: string,
    type: 'player' | 'npc',
    action: 'resurrect' | 'heal' | 'damage' | 'kill'
  ) => {
    const participant = participants.find(p => p.id === participantId && p.type === type)
    if (!participant) return

    let newHp = participant.currentHp
    let newStatus: 'active' | 'inactive' | 'dead' = participant.status

    switch (action) {
      case 'resurrect':
        newHp = participant.maxHp
        newStatus = 'active'
        break
      case 'heal':
        newHp = Math.min(participant.currentHp + 10, participant.maxHp)
        if (newHp > 0) newStatus = 'active'
        break
      case 'damage':
        newHp = Math.max(0, participant.currentHp - 10)
        if (newHp === 0) {
          newStatus = type === 'player' ? 'inactive' : 'dead'
        }
        break
      case 'kill':
        newHp = 0
        newStatus = type === 'player' ? 'inactive' : 'dead'
        break
    }

    await updateParticipantStatus(participantId, type, newHp, newStatus)
  }

  const startEdit = (participant: ParticipantStatus) => {
    setEditingId(participant.id)
    setEditHp(participant.currentHp)
    setEditStatus(participant.status)
  }

  const saveEdit = async (participantId: string, type: 'player' | 'npc') => {
    await updateParticipantStatus(participantId, type, editHp, editStatus)
  }

  const handleAddXP = async (participantId: string, type: 'player' | 'npc') => {
    if (type !== 'player') {
      alert('Apenas players podem receber XP')
      return
    }

    const xpValue = parseFloat(xpToAdd)
    if (isNaN(xpValue) || xpValue <= 0) {
      alert('Insira um valor de XP válido (maior que 0)')
      return
    }

    setLoading(true)
    try {
      const participant = participants.find(p => p.id === participantId && p.type === type)
      if (!participant?.characterId) {
        alert('Erro: character não encontrado')
        return
      }

      // Buscar nível atual do character
      const { data: character } = await supabase
        .from('rpg_characters')
        .select('level, xp_percentage')
        .eq('id', participant.characterId)
        .single()

      if (!character) {
        alert('Erro: character não encontrado')
        return
      }

      // Adicionar XP manualmente
      const currentXP = character.xp_percentage || 0
      let newXP = currentXP + xpValue
      let newLevel = character.level || 1
      let leveledUp = false

      // Verificar se passou de nível
      if (newXP >= 100.0) {
        newLevel = (character.level || 1) + 1
        newXP = newXP - 100.0
        leveledUp = true
      }

      // Garantir que XP não ultrapasse 100%
      if (newXP > 100.0) {
        newXP = 100.0
      }

      // Atualizar character
      await supabase
        .from('rpg_characters')
        .update({
          xp_percentage: newXP,
          level: newLevel
        })
        .eq('id', participant.characterId)

      // Recarregar dados
      await loadNPCs()
      if (onUpdate) onUpdate()

      // Disparar evento
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('status-updated', {
          detail: { participantId, type, newHp: participant.currentHp, newStatus: participant.status }
        }))
      }

      // Feedback
      if (leveledUp) {
        console.log('🎉 Player subiu de nível via StatusManager! Disparando evento...', {
          characterId: participant.characterId,
          newLevel: newLevel,
          participantName: participant.name
        })
        alert(`⭐ ${participant.name} ganhou ${xpValue}% XP e subiu para o nível ${newLevel}!`)
        
        // Disparar evento de level up
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('character-leveled-up', {
            detail: {
              characterId: participant.characterId,
              newLevel: newLevel
            }
          })
          window.dispatchEvent(event)
          console.log('✅ Evento character-leveled-up disparado via StatusManager')
        }
      } else {
        alert(`✨ ${participant.name} ganhou ${xpValue}% XP! (${newXP.toFixed(1)}% total)`)
      }

      setShowXPInput(null)
      setXpToAdd('')
    } catch (err) {
      console.error('Erro ao adicionar XP:', err)
      alert('Erro ao adicionar XP')
    } finally {
      setLoading(false)
    }
  }

  const handleIncreaseMaxHP = async (participantId: string, type: 'player' | 'npc') => {
    if (type !== 'player') {
      alert('Apenas players podem ter HP máximo aumentado')
      return
    }

    const hpIncreaseValue = parseFloat(hpIncrease)
    if (isNaN(hpIncreaseValue) || hpIncreaseValue <= 0) {
      alert('Insira um valor de HP válido (maior que 0)')
      return
    }

    setLoading(true)
    try {
      const participant = participants.find(p => p.id === participantId && p.type === type)
      if (!participant?.characterId) {
        alert('Erro: character não encontrado')
        return
      }

      // Buscar character atual
      const { data: character } = await supabase
        .from('rpg_characters')
        .select('hp, max_hp')
        .eq('id', participant.characterId)
        .single()

      if (!character) {
        alert('Erro: character não encontrado')
        return
      }

      const currentMaxHp = (character as any).max_hp ?? character.hp
      const newMaxHp = currentMaxHp + hpIncreaseValue
      const newHp = character.hp + hpIncreaseValue // Aumenta HP atual também

      // Atualizar character
      await supabase
        .from('rpg_characters')
        .update({
          max_hp: newMaxHp,
          hp: newHp,
        })
        .eq('id', participant.characterId)

      // Recarregar dados
      await loadNPCs()
      if (onUpdate) onUpdate()

      // Disparar evento
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('status-updated', {
          detail: { participantId, type, newHp: newHp, newStatus: participant.status }
        }))
      }

      alert(`✅ HP máximo de ${participant.name} aumentado! Novo HP máximo: ${newMaxHp} (HP atual: ${newHp})`)

      setShowHPIncreaseInput(null)
      setHpIncrease('5')
    } catch (err) {
      console.error('Erro ao aumentar HP máximo:', err)
      alert('Erro ao aumentar HP máximo')
    } finally {
      setLoading(false)
    }
  }

  // Remover o check de isMaster aqui, pois já é verificado no componente pai
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            loadNPCs()
            if (onUpdate) onUpdate()
          }}
          className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
        >
          🔄 Atualizar
        </button>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {participants.map(participant => (
          <div
            key={`${participant.type}-${participant.id}`}
            className={`p-3 rounded border ${
              participant.status === 'dead' || participant.status === 'inactive'
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-white">
                    {participant.name}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    participant.type === 'player' 
                      ? 'bg-blue-900/50 text-blue-300' 
                      : 'bg-red-900/50 text-red-300'
                  }`}>
                    {participant.type === 'player' ? '👤' : '👹'}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    participant.status === 'active' 
                      ? 'bg-green-900/50 text-green-300'
                      : participant.status === 'inactive'
                      ? 'bg-yellow-900/50 text-yellow-300'
                      : 'bg-red-900/50 text-red-300'
                  }`}>
                    {participant.status === 'active' ? 'Vivo' : participant.status === 'inactive' ? 'Inconsciente' : 'Morto'}
                  </span>
                </div>
                
                {editingId === participant.id ? (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">HP:</label>
                      <input
                        type="number"
                        value={editHp}
                        onChange={(e) => setEditHp(parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-gray-700 text-white text-xs rounded border border-gray-600"
                        min="0"
                        max={participant.maxHp * 2}
                      />
                      <span className="text-xs text-gray-500">/ {participant.maxHp}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">Status:</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive' | 'dead')}
                        className="px-2 py-1 bg-gray-700 text-white text-xs rounded border border-gray-600"
                      >
                        <option value="active">Vivo</option>
                        <option value="inactive">Inconsciente</option>
                        <option value="dead">Morto</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(participant.id, participant.type)}
                        className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                        disabled={loading}
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-gray-400 mb-2">
                      HP: {participant.currentHp} / {participant.maxHp}
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full ${
                          participant.currentHp === 0
                            ? 'bg-red-600'
                            : participant.currentHp < participant.maxHp * 0.3
                            ? 'bg-yellow-600'
                            : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(100, (participant.currentHp / participant.maxHp) * 100)}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => startEdit(participant)}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                      >
                        ✏️ Editar
                      </button>
                      {participant.status !== 'active' && (
                        <button
                          onClick={() => handleQuickAction(participant.id, participant.type, 'resurrect')}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                          disabled={loading}
                        >
                          ⚡ Ressuscitar
                        </button>
                      )}
                      <button
                        onClick={() => handleQuickAction(participant.id, participant.type, 'heal')}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                        disabled={loading}
                      >
                        💚 +10 HP
                      </button>
                      <button
                        onClick={() => handleQuickAction(participant.id, participant.type, 'damage')}
                        className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded"
                        disabled={loading}
                      >
                        ⚔️ -10 HP
                      </button>
                      <button
                        onClick={() => handleQuickAction(participant.id, participant.type, 'kill')}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                        disabled={loading}
                      >
                        💀 Matar
                      </button>
                      {participant.type === 'player' && (
                        <>
                          <button
                            onClick={() => setShowXPInput(showXPInput === participant.id ? null : participant.id)}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
                            disabled={loading}
                          >
                            ⭐ Dar XP
                          </button>
                          <button
                            onClick={() => setShowHPIncreaseInput(showHPIncreaseInput === participant.id ? null : participant.id)}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                            disabled={loading}
                          >
                            💚 Aumentar HP Máx
                          </button>
                        </>
                      )}
                    </div>
                    {showXPInput === participant.id && participant.type === 'player' && (
                      <div className="mt-2 p-2 bg-gray-700 rounded border border-gray-600">
                        <label className="block text-xs text-gray-300 mb-1">
                          Adicionar XP (%)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={xpToAdd}
                            onChange={(e) => setXpToAdd(e.target.value)}
                            className="flex-1 px-2 py-1 bg-gray-800 text-white text-xs rounded border border-gray-600"
                            placeholder="Ex: 5 ou 10"
                            min="0.1"
                            step="0.1"
                          />
                          <button
                            onClick={() => handleAddXP(participant.id, participant.type)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
                            disabled={loading}
                          >
                            Adicionar
                          </button>
                          <button
                            onClick={() => {
                              setShowXPInput(null)
                              setXpToAdd('')
                            }}
                            className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          XP atual: {(participant as any).xp_percentage?.toFixed(1) || '0.0'}%
                        </p>
                      </div>
                    )}
                    {showHPIncreaseInput === participant.id && participant.type === 'player' && (
                      <div className="mt-2 p-2 bg-gray-700 rounded border border-gray-600">
                        <label className="block text-xs text-gray-300 mb-1">
                          Aumentar HP Máximo
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={hpIncrease}
                            onChange={(e) => setHpIncrease(e.target.value)}
                            className="flex-1 px-2 py-1 bg-gray-800 text-white text-xs rounded border border-gray-600"
                            placeholder="Ex: 5 ou 10"
                            min="1"
                            step="1"
                          />
                          <button
                            onClick={() => handleIncreaseMaxHP(participant.id, participant.type)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                            disabled={loading}
                          >
                            Aumentar
                          </button>
                          <button
                            onClick={() => {
                              setShowHPIncreaseInput(null)
                              setHpIncrease('5')
                            }}
                            className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          HP Máximo atual: {participant.maxHp} • HP atual: {participant.currentHp}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {participants.length === 0 && (
          <div className="text-xs text-gray-500 text-center py-4">
            Nenhum participante encontrado
          </div>
        )}
      </div>
    </div>
  )
}
