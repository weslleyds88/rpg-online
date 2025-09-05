import api from './api';

export const gameService = {
  // Rolar dados
  rollDice: async (diceString) => {
    const response = await api.post('/actions/roll', { dice: diceString });
    return response.data;
  },

  // Teste de habilidade
  abilityCheck: async (modifier = 0, difficulty = 10) => {
    const response = await api.post('/actions/ability-check', { modifier, difficulty });
    return response.data;
  },

  // Ataque
  attack: async (attackBonus = 0, armorClass = 10, damageDice = '1d4') => {
    const response = await api.post('/actions/attack', { attackBonus, armorClass, damageDice });
    return response.data;
  },

  // Iniciativa
  initiative: async (modifier = 0) => {
    const response = await api.post('/actions/initiative', { modifier });
    return response.data;
  },

  // Aplicar dano
  applyDamage: async (playerId, damage) => {
    const response = await api.post(`/actions/players/${playerId}/damage`, { damage });
    return response.data;
  },

  // Aplicar cura
  applyHealing: async (playerId, healing) => {
    const response = await api.post(`/actions/players/${playerId}/healing`, { healing });
    return response.data;
  },

  // Aplicar custo de mana
  applyManaCost: async (playerId, cost) => {
    const response = await api.post(`/actions/players/${playerId}/mana-cost`, { cost });
    return response.data;
  },

  // Iniciar encontro
  startEncounter: async (players, monsters) => {
    const response = await api.post('/actions/encounters/start', { players, monsters });
    return response.data;
  }
};
