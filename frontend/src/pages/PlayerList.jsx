import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { playerService } from '../services/playerService';

const PlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const response = await playerService.getPlayers();
      if (response.success) {
        setPlayers(response.data);
      }
    } catch (err) {
      setError('Erro ao carregar personagens');
    } finally {
      setLoading(false);
    }
  };

  const getClassIcon = (classe) => {
    const icons = {
      guerreiro: '⚔️',
      mago: '🔮',
      arqueiro: '🏹',
      ladino: '🗡️',
      clérigo: '⛪',
      bárbaro: '🪓'
    };
    return icons[classe] || '👤';
  };

  const getClassColor = (classe) => {
    const colors = {
      guerreiro: 'text-red-400',
      mago: 'text-blue-400',
      arqueiro: 'text-green-400',
      ladino: 'text-purple-400',
      clérigo: 'text-yellow-400',
      bárbaro: 'text-orange-400'
    };
    return colors[classe] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rpg-gold mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando personagens...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6 max-w-md mx-auto">
          {error}
        </div>
        <button onClick={loadPlayers} className="btn-primary">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-fantasy text-rpg-gold">
          Personagens
        </h1>
        <Link to="/create-player" className="btn-primary">
          Criar Personagem
        </Link>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-fantasy text-white mb-2">
            Nenhum Personagem Encontrado
          </h2>
          <p className="text-gray-400 mb-6">
            Crie seu primeiro personagem para começar sua aventura!
          </p>
          <Link to="/create-player" className="btn-primary">
            Criar Primeiro Personagem
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <div key={player.id} className="card hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{getClassIcon(player.classe)}</span>
                  <div>
                    <h3 className="text-xl font-fantasy text-white">
                      {player.nome}
                    </h3>
                    <p className={`text-sm font-medium ${getClassColor(player.classe)}`}>
                      {player.classe.charAt(0).toUpperCase() + player.classe.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-rpg-gold">
                    Nível {player.nivel}
                  </div>
                  <div className="text-sm text-gray-400">
                    {player.experiencia} XP
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Vida:</span>
                  <span className="text-red-400">{player.vida}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Mana:</span>
                  <span className="text-blue-400">{player.mana}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/players/${player.id}`}
                  className="btn-primary flex-1 text-center"
                >
                  Ver Detalhes
                </Link>
                <Link
                  to={`/inventory/${player.id}`}
                  className="btn-secondary"
                >
                  Inventário
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {players.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-fantasy text-rpg-gold mb-4">
            Estatísticas Gerais
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-rpg-blue">
                {players.length}
              </div>
              <div className="text-sm text-gray-400">Total de Personagens</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rpg-green">
                {Math.round(players.reduce((acc, p) => acc + p.nivel, 0) / players.length)}
              </div>
              <div className="text-sm text-gray-400">Nível Médio</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rpg-purple">
                {players.reduce((acc, p) => acc + p.experiencia, 0)}
              </div>
              <div className="text-sm text-gray-400">XP Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rpg-gold">
                {new Set(players.map(p => p.classe)).size}
              </div>
              <div className="text-sm text-gray-400">Classes Únicas</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerList;
