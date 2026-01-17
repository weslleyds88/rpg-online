/**
 * Serviço para gerenciar convites por código
 */

import { supabase } from '@/lib/supabase/client'
import { joinGame } from './playerService'
import type { Game } from '@/lib/supabase/types'

/**
 * Buscar game por código de convite
 */
export async function getGameByInviteCode(code: string) {
  const { data, error } = await supabase
    .from('rpg_games')
    .select('*')
    .eq('invite_code', code.toUpperCase())
    .single()

  if (error) throw error
  return data as Game
}

/**
 * Entrar em um game usando código de convite
 */
export async function joinGameByCode(code: string) {
  const game = await getGameByInviteCode(code)
  
  if (game.status === 'finished') {
    throw new Error('Esta sala já foi finalizada')
  }

  // Adicionar o usuário como player
  await joinGame(game.id)
  
  return game
}

/**
 * Gerar novo código de convite para um game
 */
export async function regenerateInviteCode(gameId: string) {
  // Gerar código único (6 caracteres alfanuméricos)
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // Tentar gerar um código único
  let attempts = 0
  let newCode = generateCode()
  
  while (attempts < 10) {
    // Verificar se o código já existe
    const { data: existing } = await supabase
      .from('rpg_games')
      .select('id')
      .eq('invite_code', newCode)
      .single()

    if (!existing) {
      // Código único encontrado
      break
    }
    
    newCode = generateCode()
    attempts++
  }

  // Atualizar o game com o novo código
  const { data: updatedGame, error: updateError } = await supabase
    .from('rpg_games')
    .update({ invite_code: newCode })
    .eq('id', gameId)
    .select()
    .single()

  if (updateError) throw updateError
  return updatedGame as Game
}
