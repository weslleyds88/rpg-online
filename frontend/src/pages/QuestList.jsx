import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questService } from '../services/questService';
import { playerService } from '../services/playerService';

const QuestList = () => {
  const [quests, setQuests] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [questsResponse, playersResponse] = await Promise.all([
        questService.getQuests(),
        playerService.getPlayers()
      ]);

      if (questsResponse.success) {
        setQuests(questsResponse.data);
      }
      if (playersResponse.success) {
        setPlayers(playersResponse.data);
      }
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuest = async (questId) => {
    if (!selectedPlayer) {
      alert('Selecione um personagem primeiro');
      return;
    }

    try {
      const response = await questService.acceptQuest(questId, selectedPlayer);
      if (response.success) {
        alert('Quest aceita com sucesso!');
        loadData(); // Recarregar dados
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao aceitar quest');
    }
  };

  const handleCompleteQuest = async (questId) => {
    if (!selectedPlayer) {
      alert('Selecione um personagem primeiro');
      return;
    }

    try {
      const response = await questService.completeQuest(questId, selectedPlayer);
      if (response.success) {
        alert('Quest completada com sucesso!');
        loadData(); // Recarregar dados
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao completar quest');
    }
  };

  const getDifficultyColor = (xp) => {
    if (xp <= 100) return 'text-green-400';
    if (xp <= 250) return 'text-yellow-400';
    if (xp <= 500) return 'text-orange-400';
    return 'text-red-400';
  };

  const getDifficultyLabel = (xp) => {
    if (xp <= 100) return 'Fácil';
    if (xp <= 250) return 'Médio';
    if (xp <= 500) return 'Difícil';
    return 'Épico';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rpg-gold mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando quests...</p>
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
        <button onClick={loadData} className="btn-primary">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-fantasy text-rpg-gold">
          Quests Disponíveis
        </h1>
        <Link to="/admin" className="btn-primary">
          Criar Nova Quest
        </Link>
      </div>

      {/* Player Selection */}
      {players.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-fantasy text-white mb-4">
            Selecionar Personagem
          </h2>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="select-field"
            >
              <option value="">Escolha um personagem</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.nome} (Nível {player.nivel} - {player.classe})
                </option>
              ))}
            </select>
            {selectedPlayer && (
              <Link
                to={`/players/${selectedPlayer}`}
                className="btn-secondary"
              >
                Ver Personagem
              </Link>
            )}
          </div>
        </div>
      )}

      {quests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📜</div>
          <h2 className="text-2xl font-fantasy text-white mb-2">
            Nenhuma Quest Disponível
          </h2>
          <p className="text-gray-400 mb-6">
            Crie novas quests no painel administrativo!
          </p>
          <Link to="/admin" className="btn-primary">
            Painel Admin
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quests.map((quest) => (
            <div key={quest.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-fantasy text-white mb-2">
                    {quest.titulo}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {quest.descricao}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className={`text-lg font-bold ${getDifficultyColor(quest.recompensa_xp)}`}>
                    {getDifficultyLabel(quest.recompensa_xp)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {quest.recompensa_xp} XP
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Recompensa de XP:</span>
                  <span className="text-rpg-gold font-semibold">
                    +{quest.recompensa_xp}
                  </span>
                </div>
                {quest.recompensa_item && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Recompensa de Item:</span>
                    <span className="text-rpg-blue font-semibold">
                      Item Especial
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Criada em:</span>
                  <span className="text-gray-300">
                    {new Date(quest.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {selectedPlayer && (
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => handleAcceptQuest(quest.id)}
                    className="btn-success flex-1"
                  >
                    Aceitar Quest
                  </button>
                  <button
                    onClick={() => handleCompleteQuest(quest.id)}
                    className="btn-warning flex-1"
                  >
                    Completar
                  </button>
                </div>
              )}

              {!selectedPlayer && (
                <div className="mt-4 p-3 bg-gray-800 border border-gray-600 rounded-lg">
                  <p className="text-gray-400 text-sm text-center">
                    Selecione um personagem para aceitar esta quest
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quest Stats */}
      {quests.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-fantasy text-rpg-gold mb-4">
            Estatísticas das Quests
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-rpg-blue">
                {quests.length}
              </div>
              <div className="text-sm text-gray-400">Total de Quests</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rpg-green">
                {quests.filter(q => q.recompensa_xp <= 100).length}
              </div>
              <div className="text-sm text-gray-400">Fáceis</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rpg-gold">
                {quests.filter(q => q.recompensa_xp > 100 && q.recompensa_xp <= 250).length}
              </div>
              <div className="text-sm text-gray-400">Médias</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rpg-red">
                {quests.filter(q => q.recompensa_xp > 250).length}
              </div>
              <div className="text-sm text-gray-400">Difíceis</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestList;
