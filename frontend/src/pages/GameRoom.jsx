import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomService } from '../services/roomService';
import { mapService } from '../services/mapService';

const GameRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [activeMap, setActiveMap] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [showMapUpload, setShowMapUpload] = useState(false);
  const [newMap, setNewMap] = useState({
    name: '',
    description: '',
    mapData: null
  });

  useEffect(() => {
    if (roomId) {
      loadRoomData();
    }
  }, [roomId]);

  const loadRoomData = async () => {
    try {
      const roomResponse = await roomService.getRoomDetails(roomId);
      setRoom(roomResponse.data.room);
      setPlayers(roomResponse.data.players);
      
      // Load active map
      try {
        const mapResponse = await mapService.getActiveMap(roomId);
        setActiveMap(mapResponse.data.map);
        
        // Load tokens for active map
        if (mapResponse.data.map) {
          const tokensResponse = await mapService.getTokens(mapResponse.data.map.id);
          setTokens(tokensResponse.data.tokens);
        }
      } catch (error) {
        console.log('Nenhum mapa ativo encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar dados da sala:', error);
      alert('Erro ao carregar dados da sala');
    } finally {
      setLoading(false);
    }
  };

  const handleMapUpload = (e) => {
    e.preventDefault();
    
    if (!newMap.mapData) {
      alert('Selecione um arquivo de mapa');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const mapData = {
          image: event.target.result,
          width: 800,
          height: 600,
          gridSize: 50
        };

        await mapService.uploadMap({
          roomId: parseInt(roomId),
          name: newMap.name,
          description: newMap.description,
          mapData
        });

        setShowMapUpload(false);
        setNewMap({ name: '', description: '', mapData: null });
        loadRoomData();
        alert('Mapa enviado com sucesso!');
      } catch (error) {
        console.error('Erro ao enviar mapa:', error);
        alert('Erro ao enviar mapa');
      }
    };
    reader.readAsDataURL(newMap.mapData);
  };

  const handleLeaveRoom = async () => {
    if (!selectedPlayer) {
      alert('Selecione um jogador para sair da sala');
      return;
    }

    try {
      await roomService.leaveRoom(roomId, selectedPlayer);
      navigate('/rooms');
    } catch (error) {
      console.error('Erro ao sair da sala:', error);
      alert('Erro ao sair da sala');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Carregando sala...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-red-600">Sala não encontrada</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{room.name}</h1>
          <p className="text-gray-300">{room.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="px-3 py-1 bg-gray-700 text-white rounded"
          >
            <option value="">Selecione seu personagem</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} ({player.class})
              </option>
            ))}
          </select>
          <button
            onClick={handleLeaveRoom}
            className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Sair da Sala
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-100 p-4 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Jogadores na Sala</h3>
            <div className="space-y-2">
              {players.map(player => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-white rounded">
                  <div>
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-gray-600">
                      {player.class} - Nível {player.level}
                    </div>
                  </div>
                  {player.isMaster && (
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                      Mestre
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Mapas</h3>
            {activeMap ? (
              <div className="p-3 bg-white rounded">
                <div className="font-medium">{activeMap.name}</div>
                <div className="text-sm text-gray-600">{activeMap.description}</div>
                <div className="text-xs text-green-600 mt-1">Ativo</div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Nenhum mapa ativo</div>
            )}
            
            <button
              onClick={() => setShowMapUpload(true)}
              className="w-full mt-3 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Enviar Mapa
            </button>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 bg-gray-200 p-4">
          {activeMap ? (
            <div className="bg-white rounded-lg shadow-lg h-full relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={activeMap.mapData.image}
                  alt={activeMap.name}
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Tokens */}
                {tokens.map(token => (
                  <div
                    key={token.id}
                    className="absolute w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg cursor-move"
                    style={{
                      left: `${token.tokenData.x}px`,
                      top: `${token.tokenData.y}px`
                    }}
                    title={token.tokenData.name || 'Token'}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Nenhum mapa ativo
                </h3>
                <p className="text-gray-500 mb-4">
                  Envie um mapa para começar a jogar
                </p>
                <button
                  onClick={() => setShowMapUpload(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Enviar Primeiro Mapa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Upload Modal */}
      {showMapUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Enviar Mapa</h2>
            <form onSubmit={handleMapUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Mapa
                </label>
                <input
                  type="text"
                  value={newMap.name}
                  onChange={(e) => setNewMap({...newMap, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={newMap.description}
                  onChange={(e) => setNewMap({...newMap, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arquivo do Mapa
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewMap({...newMap, mapData: e.target.files[0]})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Enviar Mapa
                </button>
                <button
                  type="button"
                  onClick={() => setShowMapUpload(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameRoom;
