import React, { useState, useEffect } from 'react';
import { roomService } from '../services/roomService';
import { playerService } from '../services/playerService';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    maxPlayers: 6,
    isPrivate: false,
    password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [roomsResponse, playersResponse] = await Promise.all([
        roomService.listRooms(),
        playerService.getPlayers()
      ]);
      
      setRooms(roomsResponse.data.rooms);
      setPlayers(playersResponse.data.players);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    if (!selectedPlayer) {
      alert('Selecione um jogador para criar a sala');
      return;
    }

    try {
      await roomService.createRoom({
        ...newRoom,
        playerId: selectedPlayer
      });
      
      setShowCreateRoom(false);
      setNewRoom({
        name: '',
        description: '',
        maxPlayers: 6,
        isPrivate: false,
        password: ''
      });
      loadData();
      alert('Sala criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      alert('Erro ao criar sala');
    }
  };

  const handleJoinRoom = async (roomId) => {
    if (!selectedPlayer) {
      alert('Selecione um jogador para entrar na sala');
      return;
    }

    try {
      await roomService.joinRoom(roomId, selectedPlayer);
      alert('Entrou na sala com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
      alert('Erro ao entrar na sala');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Salas de Jogo</h1>
        <button
          onClick={() => setShowCreateRoom(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Criar Sala
        </button>
      </div>

      {/* Player Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecione seu personagem:
        </label>
        <select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione um personagem</option>
          {players.map(player => (
            <option key={player.id} value={player.id}>
              {player.nome} (Nível {player.nivel} - {player.classe})
            </option>
          ))}
        </select>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Criar Nova Sala</h2>
            <form onSubmit={handleCreateRoom}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Sala
                </label>
                <input
                  type="text"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo de Jogadores
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={newRoom.maxPlayers}
                  onChange={(e) => setNewRoom({...newRoom, maxPlayers: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newRoom.isPrivate}
                    onChange={(e) => setNewRoom({...newRoom, isPrivate: e.target.checked})}
                    className="mr-2"
                  />
                  Sala Privada
                </label>
              </div>
              
              {newRoom.isPrivate && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={newRoom.password}
                    onChange={(e) => setNewRoom({...newRoom, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Criar Sala
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateRoom(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rooms List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map(room => (
          <div key={room.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{room.name}</h3>
            <p className="text-gray-600 mb-4">{room.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Jogadores:</span>
                <span>{room.currentPlayers}/{room.maxPlayers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Criado por:</span>
                <span>{room.createdBy}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tipo:</span>
                <span className={room.isPrivate ? 'text-red-600' : 'text-green-600'}>
                  {room.isPrivate ? 'Privada' : 'Pública'}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => handleJoinRoom(room.id)}
              disabled={room.currentPlayers >= room.maxPlayers || !selectedPlayer}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {room.currentPlayers >= room.maxPlayers ? 'Sala Cheia' : 'Entrar na Sala'}
            </button>
          </div>
        ))}
      </div>
      
      {rooms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhuma sala disponível</p>
          <p className="text-gray-400">Crie uma nova sala para começar a jogar!</p>
        </div>
      )}
    </div>
  );
};

export default RoomList;
