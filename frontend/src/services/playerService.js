import api from './api';

export const playerService = {
  // Criar jogador
  createPlayer: async (playerData) => {
    const response = await api.post('/players', playerData);
    return response.data;
  },

  // Listar jogadores
  getPlayers: async () => {
    const response = await api.get('/players');
    return response.data;
  },

  // Obter jogador por ID
  getPlayerById: async (id) => {
    const response = await api.get(`/players/${id}`);
    return response.data;
  },

  // Atualizar jogador
  updatePlayer: async (id, playerData) => {
    const response = await api.put(`/players/${id}`, playerData);
    return response.data;
  },

  // Deletar jogador
  deletePlayer: async (id) => {
    const response = await api.delete(`/players/${id}`);
    return response.data;
  },

  // Adicionar experiência
  addExperience: async (id, xp) => {
    const response = await api.post(`/players/${id}/experience`, { xp });
    return response.data;
  }
};
