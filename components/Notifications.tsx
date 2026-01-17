'use client'

import { useEffect, useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import type { Notification } from '@/hooks/useNotifications'

interface NotificationsProps {
  gameId: string | null
}

export default function Notifications({ gameId }: NotificationsProps) {
  const { notifications, clearNotifications } = useNotifications(gameId)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (notifications.length > 0) {
      setVisible(true)
      // Auto-hide após 5 segundos
      const timer = setTimeout(() => {
        setVisible(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notifications])

  if (!visible || notifications.length === 0) return null

  const latestNotification = notifications[0]

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{latestNotification.message}</p>
            <p className="text-xs text-gray-500 mt-1">
              {latestNotification.timestamp.toLocaleTimeString('pt-BR')}
            </p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        {notifications.length > 1 && (
          <button
            onClick={clearNotifications}
            className="mt-2 text-xs text-indigo-600 hover:text-indigo-700"
          >
            Limpar todas ({notifications.length})
          </button>
        )}
      </div>
    </div>
  )
}
