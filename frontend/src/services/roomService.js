import api from './api';

export const roomService = {
  // Create a new room
  createRoom: async (roomData) => {
    const response = await api.post('/rooms/create', roomData);
    return response.data;
  },

  // List all public rooms
  listRooms: async () => {
    const response = await api.get('/rooms/list');
    return response.data;
  },

  // Join a room
  joinRoom: async (roomId, playerId, password = null) => {
    const response = await api.post('/rooms/join', {
      roomId,
      playerId,
      password
    });
    return response.data;
  },

  // Get room details
  getRoomDetails: async (roomId) => {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
  },

  // Leave a room
  leaveRoom: async (roomId, playerId) => {
    const response = await api.post('/rooms/leave', {
      roomId,
      playerId
    });
    return response.data;
  }
};
