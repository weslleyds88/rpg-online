/**
 * Serviço para gerenciar games (salas de jogo)
 */

import { supabase } from '@/lib/supabase/client'
import type { Game, GameInsert, GameUpdate } from '@/lib/supabase/types'

/**
 * Buscar todos os games do usuário (como mestre ou player)
 */
export async function getUserGames() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Buscar games onde o usuário é mestre
  const { data: masterGames, error: masterError } = await supabase
    .from('rpg_games')
    .select('*')
    .eq('master', user.id)
    .order('created_at', { ascending: false })

  if (masterError) throw masterError

  // Buscar games onde o usuário é player
  const { data: playerGames, error: playerError } = await supabase
    .from('rpg_players')
    .select('game_id, role')
    .eq('user_id', user.id)

  if (playerError) throw playerError

  // Buscar os games dos players
  const playerGameIds = (playerGames || [])
    .filter(p => !(masterGames || []).find(mg => mg.id === p.game_id))
    .map(p => p.game_id)

  let playerGamesData: Game[] = []
  if (playerGameIds.length > 0) {
    const { data, error } = await supabase
      .from('rpg_games')
      .select('*')
      .in('id', playerGameIds)

    if (error) throw error
    playerGamesData = data || []
  }

  // Combinar e formatar
  const playerGamesMap = new Map((playerGames || []).map(p => [p.game_id, p.role]))
  const allGames = [
    ...(masterGames || []).map(g => ({ ...g, userRole: 'master' as const })),
    ...playerGamesData.map(g => ({ ...g, userRole: (playerGamesMap.get(g.id) || 'player') as 'player' | 'master' | 'gm' }))
  ]

  return allGames
}

/**
 * Buscar um game específico por ID
 */
export async function getGameById(id: string) {
  const { data, error } = await supabase
    .from('rpg_games')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    // Se for erro 400, pode ser problema com a view ou coluna
    if (error.code === 'PGRST116' || error.message?.includes('400')) {
      throw new Error(`Erro ao buscar game. Verifique se as migrations foram executadas corretamente. Erro: ${error.message}`)
    }
    throw error
  }
  
  // Se não tiver código e a coluna existir, tentar gerar um
  if (data && !data.invite_code && 'invite_code' in data) {
    try {
      const inviteCode = generateInviteCode()
      const { data: updated, error: updateError } = await supabase
        .from('rpg_games')
        .update({ invite_code: inviteCode })
        .eq('id', id)
        .select()
        .single()
      
      if (!updateError && updated) {
        return updated as Game
      }
    } catch (err) {
      // Ignorar se não conseguir atualizar (coluna pode não existir)
      console.warn('Não foi possível gerar código de convite:', err)
    }
  }
  
  return data as Game
}

/**
 * Gerar código de convite único
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Criar um novo game (o criador vira mestre automaticamente)
 */
export async function createGame(game: Omit<GameInsert, 'master'>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Criar game (o trigger vai lidar com invite_code se a coluna existir)
  const gameDataBase: any = {
    name: game.name,
    master: user.id,
    status: game.status || 'open',
  }

  // Tentar adicionar invite_code apenas se não der erro
  // O trigger vai gerar automaticamente se a coluna existir
  try {
    gameDataBase.invite_code = generateInviteCode()
  } catch (err) {
    // Ignorar se não conseguir
  }

  const { data: newGame, error: gameError } = await supabase
    .from('rpg_games')
    .insert(gameDataBase)
    .select()
    .single()

  if (gameError) {
    // Se for erro relacionado a invite_code, tentar sem ele
    if (gameError.message?.includes('invite_code') || gameError.message?.includes('column')) {
      const { data: retryGame, error: retryError } = await supabase
        .from('rpg_games')
        .insert({
          name: game.name,
          master: user.id,
          status: game.status || 'open',
        })
        .select()
        .single()

      if (retryError) {
        throw new Error(`Erro ao criar game: ${retryError.message}. Execute as migrations 001, 002 e 004 no Supabase.`)
      }

      // Adicionar o criador como mestre na tabela players
      const { error: playerError } = await supabase
        .from('rpg_players')
        .insert({
          game_id: retryGame.id,
          user_id: user.id,
          role: 'master',
        })

      if (playerError) throw playerError

      // Criar log automático de criação do jogo
      try {
        const { logGameEvent } = await import('./chatService')
        await logGameEvent(retryGame.id, 'game_created', `🎮 Sala "${retryGame.name}" foi criada`, {
          actor: user.id,
        })
      } catch (err) {
        console.warn('Erro ao criar log de criação de jogo:', err)
      }

      return retryGame as Game
    }
    
    // Se for erro 400, pode ser problema com a view ou permissões
    if (gameError.code === 'PGRST116' || gameError.message?.includes('400')) {
      throw new Error(`Erro ao criar game. Verifique se as migrations foram executadas (001, 002, 004). Erro: ${gameError.message}`)
    }
    
    throw new Error(`Erro ao criar game: ${gameError.message || JSON.stringify(gameError)}`)
  }

  // Adicionar o criador como mestre na tabela players
  const { error: playerError } = await supabase
    .from('rpg_players')
    .insert({
      game_id: newGame.id,
      user_id: user.id,
      role: 'master',
    })

  if (playerError) throw playerError

  // Criar log automático de criação do jogo
  try {
    const { logGameEvent } = await import('./chatService')
    await logGameEvent(newGame.id, 'game_created', `🎮 Sala "${newGame.name}" foi criada`, {
      actor: user.id,
    })
  } catch (err) {
    console.warn('Erro ao criar log de criação de jogo:', err)
  }

  return newGame as Game
}

/**
 * Atualizar um game
 */
export async function updateGame(id: string, updates: GameUpdate) {
  // Buscar o game atual para comparar mudanças
  const { data: oldGame } = await supabase
    .from('rpg_games')
    .select('status, master')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('rpg_games')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Criar log automático se o status mudou
  if (updates.status && oldGame && oldGame.status !== updates.status) {
    try {
      const { logGameEvent } = await import('./chatService')
      const statusText = {
        'open': 'Aberta',
        'running': 'Em andamento',
        'finished': 'Finalizada',
      }[updates.status] || updates.status
      await logGameEvent(id, 'game_status_changed', `🔄 Status da sala mudou para: ${statusText}`, {
        actor: oldGame.master,
        details: { oldStatus: oldGame.status, newStatus: updates.status },
      })
    } catch (err) {
      console.warn('Erro ao criar log de mudança de status:', err)
    }
  }

  // Criar log se o mestre mudou
  if (updates.master && oldGame && oldGame.master !== updates.master) {
    try {
      const { logGameEvent } = await import('./chatService')
      await logGameEvent(id, 'master_changed', `👑 Novo mestre foi definido`, {
        actor: updates.master,
        details: { oldMaster: oldGame.master, newMaster: updates.master },
      })
    } catch (err) {
      console.warn('Erro ao criar log de mudança de mestre:', err)
    }
  }

  return data as Game
}

/**
 * Deletar um game (apenas o mestre pode deletar)
 */
export async function deleteGame(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Verificar se o usuário é o mestre
  const { data: game } = await supabase
    .from('rpg_games')
    .select('master')
    .eq('id', id)
    .single()

  if (!game) throw new Error('Sala não encontrada')
  if (game.master !== user.id) throw new Error('Apenas o mestre pode deletar a sala')

  const { error } = await supabase
    .from('rpg_games')
    .delete()
    .eq('id', id)

  if (error) throw error
}
