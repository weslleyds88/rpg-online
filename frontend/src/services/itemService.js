import api from './api';

export const itemService = {
  // Criar item
  createItem: async (itemData) => {
    const response = await api.post('/items', itemData);
    return response.data;
  },

  // Listar itens
  getItems: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.raridade) params.append('raridade', filters.raridade);
    
    const response = await api.get(`/items?${params.toString()}`);
    return response.data;
  },

  // Obter item por ID
  getItemById: async (id) => {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  // Atualizar item
  updateItem: async (id, itemData) => {
    const response = await api.put(`/items/${id}`, itemData);
    return response.data;
  },

  // Deletar item
  deleteItem: async (id) => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  }
};
