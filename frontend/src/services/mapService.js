import api from './api';

export const mapService = {
  // Upload a map
  uploadMap: async (mapData) => {
    const response = await api.post('/maps/upload', mapData);
    return response.data;
  },

  // Get active map for a room
  getActiveMap: async (roomId) => {
    const response = await api.get(`/maps/room/${roomId}/active`);
    return response.data;
  },

  // List all maps for a room
  listMaps: async (roomId) => {
    const response = await api.get(`/maps/room/${roomId}/list`);
    return response.data;
  },

  // Set active map
  setActiveMap: async (roomId, mapId) => {
    const response = await api.post('/maps/set-active', {
      roomId,
      mapId
    });
    return response.data;
  },

  // Add token to map
  addToken: async (roomId, mapId, tokenData) => {
    const response = await api.post('/maps/tokens/add', {
      roomId,
      mapId,
      tokenData
    });
    return response.data;
  },

  // Get tokens for a map
  getTokens: async (mapId) => {
    const response = await api.get(`/maps/tokens/${mapId}`);
    return response.data;
  },

  // Update token
  updateToken: async (tokenId, tokenData) => {
    const response = await api.put('/maps/tokens/update', {
      tokenId,
      tokenData
    });
    return response.data;
  },

  // Remove token
  removeToken: async (tokenId) => {
    const response = await api.delete(`/maps/tokens/${tokenId}`);
    return response.data;
  }
};
