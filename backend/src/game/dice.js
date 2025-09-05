/**
 * Sistema de rolagem de dados para RPG
 */

/**
 * Rola um dado específico
 * @param {number} sides - Número de lados do dado
 * @returns {number} - Resultado da rolagem
 */
function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Rola múltiplos dados do mesmo tipo
 * @param {number} count - Quantidade de dados
 * @param {number} sides - Número de lados
 * @returns {number[]} - Array com os resultados
 */
function rollDice(count, sides) {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(rollDie(sides));
  }
  return results;
}

/**
 * Parse de string de dados (ex: "2d6+3", "1d20", "3d4-1")
 * @param {string} diceString - String no formato "XdY+Z" ou "XdY-Z"
 * @returns {object} - { count, sides, modifier, operator }
 */
function parseDiceString(diceString) {
  const regex = /^(\d+)d(\d+)([+-]?\d+)?$/i;
  const match = diceString.match(regex);
  
  if (!match) {
    throw new Error(`Formato de dados inválido: ${diceString}. Use o formato "XdY+Z" (ex: "2d6+3")`);
  }
  
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const modifierStr = match[3] || '0';
  const modifier = parseInt(modifierStr);
  
  if (count < 1 || count > 100) {
    throw new Error('Quantidade de dados deve estar entre 1 e 100');
  }
  
  if (sides < 2 || sides > 1000) {
    throw new Error('Número de lados deve estar entre 2 e 1000');
  }
  
  return {
    count,
    sides,
    modifier,
    operator: modifierStr.startsWith('-') ? '-' : '+'
  };
}

/**
 * Rola dados baseado em uma string
 * @param {string} diceString - String no formato "XdY+Z"
 * @returns {object} - Resultado detalhado da rolagem
 */
function rollDiceString(diceString) {
  try {
    const { count, sides, modifier, operator } = parseDiceString(diceString);
    
    const rolls = rollDice(count, sides);
    const sum = rolls.reduce((total, roll) => total + roll, 0);
    
    let total;
    if (operator === '-') {
      total = sum - Math.abs(modifier);
    } else {
      total = sum + modifier;
    }
    
    return {
      diceString,
      rolls,
      sum,
      modifier: operator === '-' ? -Math.abs(modifier) : modifier,
      total,
      breakdown: `${rolls.join(' + ')} ${operator} ${Math.abs(modifier)} = ${total}`
    };
  } catch (error) {
    throw new Error(`Erro ao rolar dados: ${error.message}`);
  }
}

/**
 * Rola dados para teste de habilidade (d20)
 * @param {number} modifier - Modificador do teste
 * @param {number} difficulty - Dificuldade (DC)
 * @returns {object} - Resultado do teste
 */
function rollAbilityCheck(modifier = 0, difficulty = 10) {
  const roll = rollDie(20);
  const total = roll + modifier;
  const success = total >= difficulty;
  const criticalSuccess = roll === 20;
  const criticalFailure = roll === 1;
  
  return {
    roll,
    modifier,
    total,
    difficulty,
    success,
    criticalSuccess,
    criticalFailure,
    result: criticalSuccess ? 'Sucesso Crítico!' : 
            criticalFailure ? 'Falha Crítica!' :
            success ? 'Sucesso' : 'Falha'
  };
}

/**
 * Rola dados para ataque
 * @param {number} attackBonus - Bônus de ataque
 * @param {number} armorClass - Classe de armadura do alvo
 * @param {number} damageDice - String de dados de dano (ex: "1d8+3")
 * @returns {object} - Resultado do ataque
 */
function rollAttack(attackBonus = 0, armorClass = 10, damageDice = '1d4') {
  const attackRoll = rollAbilityCheck(attackBonus, armorClass);
  let damage = null;
  
  if (attackRoll.success) {
    const damageResult = rollDiceString(damageDice);
    damage = damageResult.total;
    
    // Dano dobrado em acerto crítico
    if (attackRoll.criticalSuccess) {
      damage *= 2;
    }
  }
  
  return {
    attack: attackRoll,
    damage,
    hit: attackRoll.success,
    critical: attackRoll.criticalSuccess
  };
}

/**
 * Rola dados para iniciativa
 * @param {number} modifier - Modificador de iniciativa
 * @returns {object} - Resultado da iniciativa
 */
function rollInitiative(modifier = 0) {
  const roll = rollDie(20);
  const total = roll + modifier;
  
  return {
    roll,
    modifier,
    total
  };
}

/**
 * Rola dados para dano de área
 * @param {string} damageDice - String de dados de dano
 * @param {number} saveDC - Dificuldade do teste de resistência
 * @param {number} saveModifier - Modificador do teste de resistência
 * @returns {object} - Resultado do dano de área
 */
function rollAreaDamage(damageDice, saveDC = 15, saveModifier = 0) {
  const damageResult = rollDiceString(damageDice);
  const saveRoll = rollAbilityCheck(saveModifier, saveDC);
  
  let finalDamage = damageResult.total;
  if (saveRoll.success) {
    finalDamage = Math.floor(finalDamage / 2); // Metade do dano se passar no teste
  }
  
  return {
    damage: damageResult,
    save: saveRoll,
    finalDamage,
    saved: saveRoll.success
  };
}

module.exports = {
  rollDie,
  rollDice,
  parseDiceString,
  rollDiceString,
  rollAbilityCheck,
  rollAttack,
  rollInitiative,
  rollAreaDamage
};
