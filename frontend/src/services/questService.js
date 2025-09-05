import api from './api';

export const questService = {
  // Criar quest
  createQuest: async (questData) => {
    const response = await api.post('/quests', questData);
    return response.data;
  },

  // Listar quests
  getQuests: async () => {
    const response = await api.get('/quests');
    return response.data;
  },

  // Obter quest por ID
  getQuestById: async (id) => {
    const response = await api.get(`/quests/${id}`);
    return response.data;
  },

  // Aceitar quest
  acceptQuest: async (questId, playerId) => {
    const response = await api.post(`/quests/${questId}/accept`, { playerId });
    return response.data;
  },

  // Completar quest
  completeQuest: async (questId, playerId) => {
    const response = await api.post(`/quests/${questId}/complete`, { playerId });
    return response.data;
  },

  // Atualizar quest
  updateQuest: async (id, questData) => {
    const response = await api.put(`/quests/${id}`, questData);
    return response.data;
  },

  // Deletar quest
  deleteQuest: async (id) => {
    const response = await api.delete(`/quests/${id}`);
    return response.data;
  }
};
