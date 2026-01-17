/**
 * Cliente Ably para comunicação em tempo real
 */

import * as Ably from 'ably'

let ablyClient: Ably.Realtime | null = null

/**
 * Inicializa o cliente Ably (apenas no browser)
 */
export function getAblyClient(): Ably.Realtime | null {
  // Ably só funciona no browser
  if (typeof window === 'undefined') {
    return null
  }

  if (ablyClient) {
    return ablyClient
  }

  const apiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY

  if (!apiKey) {
    console.warn('NEXT_PUBLIC_ABLY_API_KEY não configurada no .env.local')
    return null
  }

  try {
    ablyClient = new Ably.Realtime({
      key: apiKey,
      clientId: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    })
    return ablyClient
  } catch (err) {
    console.error('Erro ao inicializar cliente Ably:', err)
    return null
  }
}

/**
 * Obtém um canal do Ably
 */
export function getAblyChannel(channelName: string): Ably.RealtimeChannel | null {
  const client = getAblyClient()
  if (!client) {
    return null
  }
  return client.channels.get(channelName)
}
