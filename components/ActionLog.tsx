'use client'

import { useEffect, useRef, memo } from 'react'

interface Message {
  id: string
  message: string
  created_at: string
  metadata?: any
}

interface ActionLogProps {
  messages: Message[]
  loading: boolean
}

function ActionLog({ messages, loading }: ActionLogProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getEventStyle = (type: string) => {
    switch (type) {
      case 'action_created':
        return 'bg-blue-500/10 border-l-2 border-blue-500 text-blue-100'
      case 'action_resolved':
        return 'bg-green-500/10 border-l-2 border-green-500 text-green-100'
      case 'combat_damage':
        return 'bg-red-500/10 border-l-2 border-red-500 text-red-100'
      case 'combat_healing':
        return 'bg-green-500/10 border-l-2 border-green-500 text-green-100'
      case 'player_joined':
        return 'bg-purple-500/10 border-l-2 border-purple-500 text-purple-100'
      case 'player_left':
        return 'bg-orange-500/10 border-l-2 border-orange-500 text-orange-100'
      case 'player_role_changed':
        return 'bg-yellow-500/10 border-l-2 border-yellow-500 text-yellow-100'
      case 'map_uploaded':
        return 'bg-indigo-500/10 border-l-2 border-indigo-500 text-indigo-100'
      case 'map_deleted':
        return 'bg-red-500/10 border-l-2 border-red-500 text-red-100'
      case 'game_status_changed':
        return 'bg-gray-500/10 border-l-2 border-gray-500 text-gray-200'
      default:
        return 'bg-gray-500/10 border-l-2 border-gray-600 text-gray-300'
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Log de Ações
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">Carregando logs...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Nenhuma ação registrada ainda.</p>
          </div>
        ) : (
          messages.map((log) => {
            const metadata = log.metadata as any
            const eventType = metadata?.type || 'unknown'
            const isRecent = new Date(log.created_at).getTime() > Date.now() - 10000 // Últimos 10 segundos

            return (
              <div
                key={log.id}
                className={`p-2.5 rounded text-xs transition-all ${
                  getEventStyle(eventType)
                } ${isRecent ? 'ring-1 ring-white/20' : ''}`}
              >
                <p className="text-white leading-relaxed">{log.message}</p>
                <p className="text-gray-400 mt-1 text-[10px]">
                  {new Date(log.created_at).toLocaleString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

// Memoizar componente para evitar re-renders desnecessários
export default memo(ActionLog)
