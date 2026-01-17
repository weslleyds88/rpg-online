'use client'

import { useState, useEffect } from 'react'
import { getGameNPCs, createNPC, updateNPC, deleteNPC, updateNPCPosition } from '@/services/npcService'
import type { NPC, NPCInsert } from '@/lib/supabase/types'

interface NPCManagerProps {
  gameId: string
  isMaster: boolean
  onNPCsChange: () => void
  onSelectNPC?: (npc: NPC | null) => void
  selectedNPC?: NPC | null
}

export default function NPCManager({ gameId, isMaster, onNPCsChange, onSelectNPC, selectedNPC: propSelectedNPC }: NPCManagerProps) {
  const [npcs, setNPCs] = useState<NPC[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingNPC, setEditingNPC] = useState<NPC | null>(null)
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(propSelectedNPC || null)

  // Escutar eventos de seleção de NPC
  useEffect(() => {
    const handleNPCSelected = (e: Event) => {
      const customEvent = e as CustomEvent
      setSelectedNPC(customEvent.detail || null)
    }
    
    window.addEventListener('npc-selected', handleNPCSelected)
    return () => {
      window.removeEventListener('npc-selected', handleNPCSelected)
    }
  }, [])
  const [formData, setFormData] = useState({
    name: '',
    type: 'npc' as 'npc' | 'adversary' | 'monster' | 'mob',
    class: '',
    level: 1,
    hp: 10,
    max_hp: 10,
    mp: 0,
    max_mp: 0,
    color: '#ef4444',
  })

  useEffect(() => {
    if (isMaster) {
      loadNPCs()
    }
  }, [gameId, isMaster])

  const loadNPCs = async () => {
    try {
      setLoading(true)
      const data = await getGameNPCs(gameId)
      setNPCs(data)
    } catch (err) {
      console.error('Erro ao carregar NPCs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isMaster) return

    try {
      if (editingNPC) {
        await updateNPC(editingNPC.id, formData)
      } else {
        await createNPC({
          game_id: gameId,
          ...formData,
        })
      }
      await loadNPCs()
      onNPCsChange()
      resetForm()
    } catch (err) {
      console.error('Erro ao salvar NPC:', err)
      alert('Erro ao salvar NPC')
    }
  }

  const handleDelete = async (id: string) => {
    if (!isMaster || !confirm('Tem certeza que deseja deletar este NPC?')) return

    try {
      await deleteNPC(id)
      await loadNPCs()
      onNPCsChange()
    } catch (err) {
      console.error('Erro ao deletar NPC:', err)
      alert('Erro ao deletar NPC')
    }
  }

  const handleEdit = (npc: NPC) => {
    setEditingNPC(npc)
    setFormData({
      name: npc.name,
      type: npc.type as 'npc' | 'adversary' | 'monster' | 'mob',
      class: npc.class || '',
      level: npc.level,
      hp: npc.hp,
      max_hp: npc.max_hp,
      mp: npc.mp,
      max_mp: npc.max_mp,
      color: npc.color,
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'npc',
      class: '',
      level: 1,
      hp: 10,
      max_hp: 10,
      mp: 0,
      max_mp: 0,
      color: '#ef4444',
    })
    setEditingNPC(null)
    setShowForm(false)
  }

  if (!isMaster) return null

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-white">NPCs e Adversários</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Novo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded border border-gray-700 p-3 space-y-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              style={{ color: '#ffffff' }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                style={{ color: '#ffffff' }}
              >
                <option value="npc">NPC</option>
                <option value="adversary">Adversário</option>
                <option value="monster">Monstro</option>
                <option value="mob">Mob</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Cor</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-7 bg-gray-900 border border-gray-700 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Classe</label>
              <input
                type="text"
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                style={{ color: '#ffffff' }}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Nível</label>
              <input
                type="number"
                min="1"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                style={{ color: '#ffffff' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">HP</label>
              <input
                type="number"
                min="1"
                value={formData.hp}
                onChange={(e) => setFormData({ ...formData, hp: parseInt(e.target.value) || 1 })}
                className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                style={{ color: '#ffffff' }}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">HP Máximo</label>
              <input
                type="number"
                min="1"
                value={formData.max_hp}
                onChange={(e) => setFormData({ ...formData, max_hp: parseInt(e.target.value) || 1 })}
                className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                style={{ color: '#ffffff' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">MP</label>
              <input
                type="number"
                min="0"
                value={formData.mp}
                onChange={(e) => setFormData({ ...formData, mp: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                style={{ color: '#ffffff' }}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">MP Máximo</label>
              <input
                type="number"
                min="0"
                value={formData.max_mp}
                onChange={(e) => setFormData({ ...formData, max_mp: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                style={{ color: '#ffffff' }}
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors"
            >
              {editingNPC ? 'Atualizar' : 'Criar'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400 text-xs text-center py-4">Carregando NPCs...</p>
      ) : npcs.length === 0 ? (
        <p className="text-gray-400 text-xs text-center py-4">Nenhum NPC criado ainda</p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {npcs.map((npc) => (
            <div
              key={npc.id}
              className={`p-2.5 rounded border transition-colors cursor-pointer ${
                selectedNPC?.id === npc.id
                  ? 'bg-indigo-900/50 border-indigo-500'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => {
                if (onSelectNPC) {
                  onSelectNPC(selectedNPC?.id === npc.id ? null : npc)
                }
              }}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: npc.color }}
                    />
                    <p className="text-xs font-medium text-white truncate">{npc.name}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {npc.type} • Nível {npc.level} • HP: {npc.hp}/{npc.max_hp}
                  </p>
                </div>
                <div className="flex space-x-1 ml-2">
                  <button
                    onClick={() => handleEdit(npc)}
                    className="text-[10px] px-1.5 py-0.5 bg-indigo-900/50 text-indigo-300 rounded hover:bg-indigo-800 transition-colors"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(npc.id)}
                    className="text-[10px] px-1.5 py-0.5 bg-red-900/50 text-red-300 rounded hover:bg-red-800 transition-colors"
                    title="Deletar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
