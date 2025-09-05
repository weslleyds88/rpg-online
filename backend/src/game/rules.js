// Regras básicas do RPG

/**
 * Calcula o nível baseado na experiência
 * @param {number} xp - Experiência atual
 * @returns {number} - Nível calculado
 */
function calculateLevel(xp) {
  // Fórmula: nível = floor(sqrt(xp / 100)) + 1
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Calcula a experiência necessária para o próximo nível
 * @param {number} currentLevel - Nível atual
 * @returns {number} - XP necessário para o próximo nível
 */
function getXPForNextLevel(currentLevel) {
  return Math.pow(currentLevel, 2) * 100;
}

/**
 * Calcula a experiência necessária para um nível específico
 * @param {number} level - Nível desejado
 * @returns {number} - XP total necessário
 */
function getXPForLevel(level) {
  return Math.pow(level - 1, 2) * 100;
}

/**
 * Calcula vida máxima baseada no nível e classe
 * @param {number} level - Nível do personagem
 * @param {string} classe - Classe do personagem
 * @returns {number} - Vida máxima
 */
function getMaxHealth(level, classe) {
  const baseHealth = {
    'guerreiro': 120,
    'mago': 80,
    'arqueiro': 100,
    'ladino': 90,
    'clérigo': 110,
    'bárbaro': 140
  };
  
  const base = baseHealth[classe.toLowerCase()] || 100;
  return base + (level - 1) * 10;
}

/**
 * Calcula mana máxima baseada no nível e classe
 * @param {number} level - Nível do personagem
 * @param {string} classe - Classe do personagem
 * @returns {number} - Mana máxima
 */
function getMaxMana(level, classe) {
  const baseMana = {
    'guerreiro': 30,
    'mago': 120,
    'arqueiro': 60,
    'ladino': 50,
    'clérigo': 100,
    'bárbaro': 20
  };
  
  const base = baseMana[classe.toLowerCase()] || 50;
  return base + (level - 1) * 5;
}

/**
 * Adiciona experiência e verifica se subiu de nível
 * @param {number} currentXP - Experiência atual
 * @param {number} xpToAdd - Experiência a adicionar
 * @returns {object} - { newXP, newLevel, leveledUp, levelsGained }
 */
function addExperience(currentXP, xpToAdd) {
  const oldLevel = calculateLevel(currentXP);
  const newXP = currentXP + xpToAdd;
  const newLevel = calculateLevel(newXP);
  const leveledUp = newLevel > oldLevel;
  const levelsGained = newLevel - oldLevel;
  
  return {
    newXP,
    newLevel,
    leveledUp,
    levelsGained
  };
}

/**
 * Aplica dano a um personagem
 * @param {number} currentHealth - Vida atual
 * @param {number} damage - Dano a aplicar
 * @returns {object} - { newHealth, isDead }
 */
function applyDamage(currentHealth, damage) {
  const newHealth = Math.max(0, currentHealth - damage);
  const isDead = newHealth === 0;
  
  return {
    newHealth,
    isDead
  };
}

/**
 * Aplica cura a um personagem
 * @param {number} currentHealth - Vida atual
 * @param {number} healing - Cura a aplicar
 * @param {number} maxHealth - Vida máxima
 * @returns {number} - Nova vida
 */
function applyHealing(currentHealth, healing, maxHealth) {
  return Math.min(maxHealth, currentHealth + healing);
}

/**
 * Aplica custo de mana
 * @param {number} currentMana - Mana atual
 * @param {number} cost - Custo de mana
 * @returns {object} - { newMana, canCast }
 */
function applyManaCost(currentMana, cost) {
  const canCast = currentMana >= cost;
  const newMana = canCast ? currentMana - cost : currentMana;
  
  return {
    newMana,
    canCast
  };
}

/**
 * Calcula modificador de atributo baseado no valor
 * @param {number} value - Valor do atributo
 * @returns {number} - Modificador
 */
function getAttributeModifier(value) {
  return Math.floor((value - 10) / 2);
}

/**
 * Calcula AC (Armor Class) base
 * @param {number} level - Nível do personagem
 * @param {string} classe - Classe do personagem
 * @returns {number} - AC base
 */
function getBaseAC(level, classe) {
  const baseAC = {
    'guerreiro': 16,
    'mago': 12,
    'arqueiro': 14,
    'ladino': 13,
    'clérigo': 15,
    'bárbaro': 14
  };
  
  const base = baseAC[classe.toLowerCase()] || 13;
  return base + Math.floor(level / 4); // +1 AC a cada 4 níveis
}

module.exports = {
  calculateLevel,
  getXPForNextLevel,
  getXPForLevel,
  getMaxHealth,
  getMaxMana,
  addExperience,
  applyDamage,
  applyHealing,
  applyManaCost,
  getAttributeModifier,
  getBaseAC
};
