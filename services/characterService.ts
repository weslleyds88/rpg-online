/**
 * Serviço para gerenciar personagens
 * Todas as operações CRUD de personagens
 */

import { supabase } from '@/lib/supabase/client'
import type { Character, CharacterInsert, CharacterUpdate, CharacterStats } from '@/lib/supabase/types'

/**
 * Buscar todos os personagens do usuário logado
 */
export async function getUserCharacters() {
  // Obter o usuário atual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('rpg_characters')
    .select('*')
    .eq('owner', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Character[]
}

/**
 * Buscar um personagem específico por ID
 */
export async function getCharacterById(id: string) {
  const { data, error } = await supabase
    .from('rpg_characters')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Character
}

/**
 * Criar um novo personagem
 */
export async function createCharacter(character: CharacterInsert) {
  // Obter o usuário atual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Extrair stats do character se for um objeto com atributos
  let stats: CharacterStats = {}
  if (character.stats && typeof character.stats === 'object' && !Array.isArray(character.stats)) {
    stats = character.stats as CharacterStats
  }

  // Calcular HP inicial baseado em Constituição se disponível
  // Fórmula simples: 10 + (CON - 10) / 2 (arredondado para baixo)
  let baseHP = 10
  if (stats.constitution) {
    const conModifier = Math.floor((stats.constitution - 10) / 2)
    baseHP = 10 + conModifier
  }

  const initialHP = character.hp ?? baseHP
  const characterData: CharacterInsert = {
    ...character,
    owner: user.id,
    level: character.level || 1,
    hp: initialHP,
    max_hp: character.max_hp ?? initialHP,
    mp: character.mp ?? 0,
    stats: character.stats || stats,
    sheet: character.sheet || {},
    status: character.status || 'active',
  }

  const { data, error } = await supabase
    .from('rpg_characters')
    .insert(characterData)
    .select()
    .single()

  if (error) throw error
  return data as Character
}

/**
 * Atualizar um personagem existente
 */
export async function updateCharacter(id: string, updates: CharacterUpdate) {
  const { data, error } = await supabase
    .from('rpg_characters')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Character
}

/**
 * Deletar um personagem
 */
export async function deleteCharacter(id: string) {
  const { error } = await supabase
    .from('rpg_characters')
    .delete()
    .eq('id', id)

  if (error) throw error
}

