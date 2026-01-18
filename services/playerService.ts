/**
 * Serviço para gerenciar players (jogadores nos games)
 */

import { supabase } from '@/lib/supabase/client'
import type { Player, PlayerInsert } from '@/lib/supabase/types'

/**
 * Buscar todos os players de um game
 */
export async function getGamePlayers(gameId: string) {
  const { data, error } = await supabase
    .from('rpg_players')
    .select('*')
    .eq('game_id', gameId)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return data as Player[]
}

/**
 * Adicionar um player a um game
 */
export async function addPlayerToGame(
  gameId: string, 
  userId: string, 
  role: 'player' | 'master' | 'gm' = 'player',
  characterId?: string | null
) {
  const { data, error } = await supabase
    .from('rpg_players')
    .insert({
      game_id: gameId,
      user_id: userId,
      role,
      character_id: characterId || null,
      color: '#3b82f6', // Cor padrão (azul)
    })
    .select()
    .single()

  if (error) throw error

  // Criar log automático
  try {
    const { logGameEvent } = await import('./chatService')
    const roleText = role === 'master' || role === 'gm' ? 'Mestre' : 'Jogador'
    
    // Buscar nome do personagem se tiver
    let characterName = ''
    if (characterId) {
      const { data: char } = await supabase
        .from('rpg_characters')
        .select('name')
        .eq('id', characterId)
        .single()
      if (char) characterName = ` com ${char.name}`
    }
    
    await logGameEvent(gameId, 'player_joined', `👤 ${roleText} entrou na sala${characterName}`, {
      actor: userId,
    })
  } catch (err) {
    console.warn('Erro ao criar log de entrada:', err)
  }

  return data as Player
}

/**
 * Remover um player de um game
 */
export async function removePlayerFromGame(gameId: string, userId: string) {
  // Buscar info do player antes de remover
  const { data: playerData } = await supabase
    .from('rpg_players')
    .select('role')
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .single()

  const { error } = await supabase
    .from('rpg_players')
    .delete()
    .eq('game_id', gameId)
    .eq('user_id', userId)

  if (error) throw error

  // Criar log automático
  try {
    const { logGameEvent } = await import('./chatService')
    const roleText = playerData?.role === 'master' || playerData?.role === 'gm' ? 'Mestre' : 'Jogador'
    await logGameEvent(gameId, 'player_left', `👋 ${roleText} saiu da sala`, {
      actor: userId,
    })
  } catch (err) {
    console.warn('Erro ao criar log de saída:', err)
  }
}

/**
 * Atualizar role de um player (ex: tornar mestre)
 */
export async function updatePlayerRole(gameId: string, userId: string, role: 'player' | 'master' | 'gm') {
  const { data, error } = await supabase
    .from('rpg_players')
    .update({ role })
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  // Criar log automático
  try {
    const { logGameEvent } = await import('./chatService')
    const roleText = role === 'master' || role === 'gm' ? 'Mestre' : 'Jogador'
    await logGameEvent(gameId, 'player_role_changed', `👑 Jogador foi promovido a ${roleText}`, {
      actor: userId,
    })
  } catch (err) {
    console.warn('Erro ao criar log de mudança de role:', err)
  }

  return data as Player
}

/**
 * Entrar em um game (adicionar o próprio usuário)
 */
export async function joinGame(gameId: string, characterId?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  return addPlayerToGame(gameId, user.id, 'player', characterId)
}

/**
 * Atualizar personagem de um player na sala
 */
export async function updatePlayerCharacter(gameId: string, userId: string, characterId: string | null) {
  const { data, error } = await supabase
    .from('rpg_players')
    .update({ character_id: characterId })
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as Player
}

/**
 * Atualizar posição de um player no mapa
 */
export async function updatePlayerPosition(gameId: string, userId: string, x: number, y: number) {
  const { data, error } = await supabase
    .from('rpg_players')
    .update({ position_x: x, position_y: y })
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as Player
}

/**
 * Atualizar cor do player no mapa
 */
export async function updatePlayerColor(gameId: string, userId: string, color: string) {
  const { data, error } = await supabase
    .from('rpg_players')
    .update({ color })
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as Player
}
