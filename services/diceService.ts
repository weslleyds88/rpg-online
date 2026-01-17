/**
 * Serviço para rolagem de dados
 * Suporta d4, d6, d8, d12, d20
 */

export type DiceType = 4 | 6 | 8 | 12 | 20

export interface DiceRoll {
  diceType: DiceType
  value: number
  isCritical?: boolean
  isFumble?: boolean
}

export interface DiceRollResult {
  rolls: DiceRoll[]
  total: number
  modifier: number
  finalTotal: number
  hasCritical: boolean
  hasFumble: boolean
}

/**
 * Rolar um único dado
 */
export function rollSingleDice(diceType: DiceType): DiceRoll {
  const maxValue = diceType
  const value = Math.floor(Math.random() * maxValue) + 1
  
  const roll: DiceRoll = {
    diceType,
    value,
  }

  // Verificar crítico e falha crítica apenas para d20
  if (diceType === 20) {
    if (value === 20) {
      roll.isCritical = true
    } else if (value === 1) {
      roll.isFumble = true
    }
  }

  return roll
}

/**
 * Rolar múltiplos dados do mesmo tipo
 */
export function rollDice(diceType: DiceType, amount: number): DiceRoll[] {
  const rolls: DiceRoll[] = []
  for (let i = 0; i < amount; i++) {
    rolls.push(rollSingleDice(diceType))
  }
  return rolls
}

/**
 * Calcular resultado total de uma rolagem
 */
export function calculateDiceResult(
  rolls: DiceRoll[],
  modifier: number = 0
): DiceRollResult {
  const total = rolls.reduce((sum, roll) => sum + roll.value, 0)
  const finalTotal = total + modifier
  
  const hasCritical = rolls.some(roll => roll.isCritical)
  const hasFumble = rolls.some(roll => roll.isFumble)

  return {
    rolls,
    total,
    modifier,
    finalTotal,
    hasCritical,
    hasFumble,
  }
}

/**
 * Rolar dados e calcular resultado completo
 */
export function rollDiceWithModifier(
  diceType: DiceType,
  amount: number,
  modifier: number = 0
): DiceRollResult {
  const rolls = rollDice(diceType, amount)
  return calculateDiceResult(rolls, modifier)
}

/**
 * Aplicar regra de crítico (dobrar dano)
 */
export function applyCriticalDamage(baseDamage: number): number {
  return baseDamage * 2
}

/**
 * Formatar resultado de dados para exibição
 */
export function formatDiceResult(result: DiceRollResult): string {
  const diceType = result.rolls[0]?.diceType || 20
  const amount = result.rolls.length
  const modifierStr = result.modifier !== 0 
    ? (result.modifier > 0 ? ` + ${result.modifier}` : ` ${result.modifier}`)
    : ''
  
  let output = `${amount}d${diceType}${modifierStr} = ${result.finalTotal}`
  
  if (result.hasCritical) {
    output += ' 🎯 CRÍTICO!'
  }
  
  if (result.hasFumble) {
    output += ' 💥 FALHA CRÍTICA!'
  }
  
  return output
}

/**
 * Formatar rolagem individual para exibição
 */
export function formatDiceRoll(roll: DiceRoll): string {
  let output = `d${roll.diceType}: ${roll.value}`
  
  if (roll.isCritical) {
    output += ' 🎯'
  }
  
  if (roll.isFumble) {
    output += ' 💥'
  }
  
  return output
}
