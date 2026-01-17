/**
 * Serviço para gerenciar sistema de experiência (XP)
 */

import { supabase } from '@/lib/supabase/client'

/**
 * Adicionar XP a um character baseado no nível do monstro derrotado
 * @param characterId ID do character que ganhará XP
 * @param monsterLevel Nível do monstro derrotado
 * @param characterLevel Nível atual do character
 * @returns Resultado com informações sobre level up
 */
export async function addXPFromMonster(
  characterId: string,
  monsterLevel: number,
  characterLevel: number
): Promise<{ leveledUp: boolean; newLevel: number; newXP: number; xpGained: number }> {
  // Calcular XP ganho baseado na diferença de nível
  let xpGained = 0
  
  if (monsterLevel === characterLevel) {
    // Monstro com nível igual: +5% XP
    xpGained = 5.0
  } else if (monsterLevel > characterLevel) {
    // Monstro com nível maior: +10% XP
    xpGained = 10.0
  } else {
    // Monstro com nível menor: não ganha XP (ou ganha menos)
    // Por enquanto, não ganha XP de monstros mais fracos
    return {
      leveledUp: false,
      newLevel: characterLevel,
      newXP: 0,
      xpGained: 0
    }
  }

  // Buscar XP atual do character
  const { data: character, error: fetchError } = await supabase
    .from('rpg_characters')
    .select('xp_percentage, level')
    .eq('id', characterId)
    .single()

  if (fetchError || !character) {
    throw new Error('Character não encontrado')
  }

  const currentXP = character.xp_percentage || 0
  const currentLevel = character.level || 1
  let newXP = currentXP + xpGained
  let newLevel = currentLevel
  let leveledUp = false

  // Verificar se passou de nível (>= 100%)
  if (newXP >= 100.0) {
    newLevel = currentLevel + 1
    newXP = newXP - 100.0 // Resto de XP após level up
    leveledUp = true
  }

  // Garantir que XP não ultrapasse 100%
  if (newXP > 100.0) {
    newXP = 100.0
  }

  // Atualizar character
  const { error: updateError } = await supabase
    .from('rpg_characters')
    .update({
      xp_percentage: newXP,
      level: newLevel
    })
    .eq('id', characterId)

  if (updateError) {
    throw updateError
  }

  return {
    leveledUp,
    newLevel,
    newXP,
    xpGained
  }
}
