'use client'

import { useState } from 'react'
import { useActions } from '@/hooks/useActions'
import { useAuth } from '@/hooks/useAuth'
import type { ActionInsert } from '@/lib/supabase/types'

interface ActionsPanelProps {
  gameId: string
  isMaster: boolean
}

export default function ActionsPanel({ gameId, isMaster }: ActionsPanelProps) {
  const { actions, loading, addAction, resolveActionById, removeAction } = useActions(gameId)
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [actionType, setActionType] = useState('attack')
  const [actionDescription, setActionDescription] = useState('')
  const [target, setTarget] = useState('')
  const [damage, setDamage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const actionData: Omit<ActionInsert, 'game_id' | 'actor'> = {
        action: {
          type: actionType,
          description: actionDescription,
          target: target || null,
          damage: damage ? parseInt(damage) : null,
        },
        resolved: false,
      }
      await addAction(actionData)
      setShowForm(false)
      setActionDescription('')
      setTarget('')
      setDamage('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao criar ação')
    }
  }

  const pendingActions = actions.filter(a => !a.resolved)
  const resolvedActions = actions.filter(a => a.resolved)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Ações e Turnos</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
        >
          {showForm ? 'Cancelar' : '+ Nova Ação'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="attack">Ataque</option>
              <option value="defense">Defesa</option>
              <option value="magic">Magia</option>
              <option value="move">Movimento</option>
              <option value="skill">Habilidade</option>
              <option value="other">Outro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
            <input
              type="text"
              value={actionDescription}
              onChange={(e) => setActionDescription(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ex: Ataque com espada"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alvo</label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dano</label>
              <input
                type="number"
                value={damage}
                onChange={(e) => setDamage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Opcional"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Criar Ação
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 text-center py-4">Carregando ações...</p>
      ) : (
        <>
          {pendingActions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Pendentes</h4>
              <div className="space-y-2">
                {pendingActions.map((action) => {
                  const actionData = action.action as any
                  return (
                    <div key={action.id} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {actionData.type?.toUpperCase()}: {actionData.description}
                          </p>
                          {actionData.target && (
                            <p className="text-xs text-gray-600">Alvo: {actionData.target}</p>
                          )}
                          {actionData.damage && (
                            <p className="text-xs text-gray-600">Dano: {actionData.damage}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(action.created_at).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                        {isMaster && (
                          <button
                            onClick={() => resolveActionById(action.id)}
                            className="ml-2 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Resolver
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {resolvedActions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Resolvidas</h4>
              <div className="space-y-2">
                {resolvedActions.slice(0, 5).map((action) => {
                  const actionData = action.action as any
                  return (
                    <div key={action.id} className="bg-gray-50 border border-gray-200 rounded p-3 opacity-75">
                      <p className="text-sm text-gray-700 line-through">
                        {actionData.type?.toUpperCase()}: {actionData.description}
                      </p>
                      {isMaster && (
                        <button
                          onClick={() => removeAction(action.id)}
                          className="mt-2 text-xs text-red-600 hover:text-red-700"
                        >
                          Deletar
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {actions.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">Nenhuma ação ainda</p>
          )}
        </>
      )}
    </div>
  )
}
