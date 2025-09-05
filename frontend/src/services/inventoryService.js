import api from './api';

export const inventoryService = {
  // Adicionar item ao inventário
  addItem: async (playerId, itemId, quantidade = 1) => {
    const response = await api.post(`/inventory/${playerId}/add`, { itemId, quantidade });
    return response.data;
  },

  // Obter inventário do jogador
  getPlayerInventory: async (playerId) => {
    const response = await api.get(`/inventory/${playerId}`);
    return response.data;
  },

  // Remover item do inventário
  removeItem: async (playerId, itemId, quantidade = 1) => {
    const response = await api.delete(`/inventory/${playerId}/${itemId}`, { 
      data: { quantidade } 
    });
    return response.data;
  },

  // Usar item
  useItem: async (playerId, itemId) => {
    const response = await api.post(`/inventory/${playerId}/${itemId}/use`);
    return response.data;
  }
};
