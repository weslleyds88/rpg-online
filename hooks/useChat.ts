/**
 * Hook para gerenciar logs de um game (chat transformado em log automático)
 */

import { useState, useEffect, useRef } from 'react'
import { getGameLogs, subscribeToLogs } from '@/services/chatService'
import type { Chat } from '@/lib/supabase/types'

export function useChat(gameId: string | null) {
  const [messages, setMessages] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [sending, setSending] = useState(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!gameId) return

    loadMessages()

    // Inscrever-se em novos logs via Ably (tempo real)
    unsubscribeRef.current = subscribeToLogs(gameId, (newLog) => {
      setMessages((prev) => {
        // Evitar duplicatas
        if (prev.find(m => m.id === newLog.id)) return prev
        return [...prev, newLog]
      })
      lastMessageIdRef.current = newLog.id
    })

    // Polling como fallback caso Ably não funcione (verifica a cada 15 segundos)
    // Intervalo maior para evitar piscadas na UI - Ably cobre tempo real
    pollingIntervalRef.current = setInterval(() => {
      checkForNewMessages()
    }, 15000)

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [gameId])

  const checkForNewMessages = async () => {
    if (!gameId) return

    try {
      const data = await getGameLogs(gameId, 100)
      
      // Verificar se há novos logs
      if (data.length > 0) {
        const latestLog = data[data.length - 1]
        
        // Se o último log é diferente, atualizar silenciosamente (sem loading)
        if (latestLog.id !== lastMessageIdRef.current) {
          setMessages(data)
          lastMessageIdRef.current = latestLog.id
        }
      }
    } catch (err) {
      // Ignorar erros silenciosamente no polling
    }
  }

  const loadMessages = async () => {
    if (!gameId) return

    try {
      setLoading(true)
      setError(null)
      const data = await getGameLogs(gameId)
      setMessages(data)
      
      // Atualizar referência do último log
      if (data.length > 0) {
        lastMessageIdRef.current = data[data.length - 1].id
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar logs'))
    } finally {
      setLoading(false)
    }
  }

  return {
    messages, // Agora são logs, não mensagens
    loading,
    error,
    sending: false, // Não há mais envio manual
    sendMessage: undefined, // Removido - logs são automáticos
    reloadMessages: loadMessages,
  }
}
