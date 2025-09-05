import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { playerService } from '../services/playerService';
import { questService } from '../services/questService';

const PlayerDetails = () => {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [xpToAdd, setXpToAdd] = useState('');

  useEffect(() => {
    loadPlayer();
  }, [id]);

  const loadPlayer = async () => {
    try {
      setLoading(true);
      const response = await playerService.getPlayerById(id);
      if (response.success) {
        setPlayer(response.data);
      }
    } catch (err) {
      setError('Erro ao carregar personagem');
    } finally {
      setLoading(false);
    }
  };

  const handleAddXP = async () => {
    if (!xpToAdd || xpToAdd <= 0) return;

    try {
      const response = await playerService.addExperience(id, parseInt(xpToAdd));
      if (response.success) {
        setPlayer(response.data);
        setXpToAdd('');
        if (response.leveledUp) {
          alert(`🎉 ${player.nome} subiu ${response.levelsGained} nível(is)!`);
        }
      }
    } catch (err) {
      setError('Erro ao adicionar experiência');
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
          <p className="text-gray-400">Carregando personagem...</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="text-center">
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6 max-w-md mx-auto">
          {error || 'Personagem não encontrado'}
        </div>
        <Link to="/players" className="btn-primary">
          Voltar para Lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/players" className="btn-secondary">
          ← Voltar
        </Link>
        <div className="flex space-x-4">
          <Link to={`/inventory/${player.id}`} className="btn-primary">
            Inventário
          </Link>
        </div>
      </div>

      {/* Player Info */}
      <div className="card">
        <div className="flex items-center space-x-6 mb-6">
          <div className="text-6xl">{getClassIcon(player.classe)}</div>
          <div className="flex-1">
            <h1 className="text-3xl font-fantasy text-rpg-gold mb-2">
              {player.nome}
            </h1>
            <p className={`text-xl font-medium ${getClassColor(player.classe)}`}>
              {player.classe.charAt(0).toUpperCase() + player.classe.slice(1)}
            </p>
            <p className="text-gray-400">
              Criado em {new Date(player.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-rpg-gold">
              Nível {player.nivel}
            </div>
            <div className="text-lg text-gray-400">
              {player.experiencia} XP
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-fantasy text-white">Estatísticas</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Vida:</span>
                <span className="text-red-400 font-semibold">{player.vida}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mana:</span>
                <span className="text-blue-400 font-semibold">{player.mana}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Experiência:</span>
                <span className="text-rpg-gold font-semibold">{player.experiencia}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-fantasy text-white">Adicionar Experiência</h3>
            <div className="flex space-x-2">
              <input
                type="number"
                value={xpToAdd}
                onChange={(e) => setXpToAdd(e.target.value)}
                placeholder="XP"
                className="input-field flex-1"
                min="1"
              />
              <button
                onClick={handleAddXP}
                disabled={!xpToAdd || xpToAdd <= 0}
                className="btn-success"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Summary */}
      {player.inventory && player.inventory.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-fantasy text-rpg-gold">
              Inventário ({player.inventory.length} itens)
            </h2>
            <Link to={`/inventory/${player.id}`} className="btn-primary">
              Ver Inventário Completo
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {player.inventory.slice(0, 6).map((item) => (
              <div key={item.inventory_id} className="bg-gray-800 border border-gray-600 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white">{item.nome}</h4>
                  <span className="text-sm text-gray-400">x{item.quantidade}</span>
                </div>
                <p className="text-sm text-gray-400 capitalize">{item.tipo}</p>
                <p className={`text-sm ${getRarityColor(item.raridade)}`}>
                  {item.raridade}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Quests */}
      {player.quests && player.quests.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-fantasy text-rpg-gold mb-4">
            Quests Ativas ({player.quests.length})
          </h2>
          <div className="space-y-4">
            {player.quests.map((quest) => (
              <div key={quest.id} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{quest.titulo}</h3>
                    <p className="text-gray-400 text-sm">{quest.descricao}</p>
                    <div className="flex space-x-4 mt-2 text-sm">
                      <span className="text-rpg-gold">+{quest.recompensa_xp} XP</span>
                      {quest.recompensa_item && (
                        <span className="text-rpg-blue">+Item</span>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    quest.status === 'ativa' ? 'bg-green-900 text-green-200' : 'bg-gray-600 text-gray-300'
                  }`}>
                    {quest.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const getRarityColor = (rarity) => {
  const colors = {
    comum: 'text-gray-300',
    incomum: 'text-green-400',
    raro: 'text-blue-400',
    épico: 'text-purple-400',
    lendário: 'text-rpg-gold'
  };
  return colors[rarity] || 'text-gray-300';
};

export default PlayerDetails;
