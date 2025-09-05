import api from './api';

export const adminService = {
  // Criar evento
  createEvent: async (eventData) => {
    const response = await api.post('/admin/events', {
      ...eventData,
      password: '159357We*'
    });
    return response.data;
  },

  // Listar eventos
  getEvents: async () => {
    const response = await api.get('/admin/events', {
      data: { password: '159357We*' }
    });
    return response.data;
  },

  // Obter evento por ID
  getEventById: async (id) => {
    const response = await api.get(`/admin/events/${id}`, {
      data: { password: '159357We*' }
    });
    return response.data;
  },

  // Atualizar evento
  updateEvent: async (id, eventData) => {
    const response = await api.put(`/admin/events/${id}`, {
      ...eventData,
      password: '159357We*'
    });
    return response.data;
  },

  // Deletar evento
  deleteEvent: async (id) => {
    const response = await api.delete(`/admin/events/${id}`, {
      data: { password: '159357We*' }
    });
    return response.data;
  },

  // Obter estatísticas do sistema
  getSystemStats: async () => {
    const response = await api.get('/admin/stats', {
      data: { password: '159357We*' }
    });
    return response.data;
  }
};
