import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { itemService } from '../services/itemService';
import { questService } from '../services/questService';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Events
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    titulo: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    criado_por: 'admin'
  });

  // Items
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    nome: '',
    tipo: '',
    raridade: 'comum',
    efeito: ''
  });

  // Quests
  const [quests, setQuests] = useState([]);
  const [newQuest, setNewQuest] = useState({
    titulo: '',
    descricao: '',
    recompensa_xp: 0,
    recompensa_item: ''
  });

  // Stats
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const savedPassword = localStorage.getItem('adminPassword');
    if (savedPassword === '159357We*') {
      setAdminPassword(savedPassword);
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const handleLogin = () => {
    if (adminPassword === '159357We*') {
      localStorage.setItem('adminPassword', adminPassword);
      setIsAuthenticated(true);
      loadData();
    } else {
      alert('Senha de administrador incorreta');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminPassword');
    setIsAuthenticated(false);
    setAdminPassword('');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsResponse, itemsResponse, questsResponse, statsResponse] = await Promise.all([
        adminService.getEvents(),
        itemService.getItems(),
        questService.getQuests(),
        adminService.getSystemStats()
      ]);

      if (eventsResponse.success) setEvents(eventsResponse.data);
      if (itemsResponse.success) setItems(itemsResponse.data);
      if (questsResponse.success) setQuests(questsResponse.data);
      if (statsResponse.success) setStats(statsResponse.data);
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await adminService.createEvent(newEvent);
      if (response.success) {
        setEvents(prev => [response.data, ...prev]);
        setNewEvent({
          titulo: '',
          descricao: '',
          data_inicio: '',
          data_fim: '',
          criado_por: 'admin'
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao criar evento');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const itemData = {
        ...newItem,
        efeito: newItem.efeito ? JSON.parse(newItem.efeito) : null
      };
      const response = await itemService.createItem(itemData);
      if (response.success) {
        setItems(prev => [response.data, ...prev]);
        setNewItem({
          nome: '',
          tipo: '',
          raridade: 'comum',
          efeito: ''
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao criar item');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const questData = {
        ...newQuest,
        recompensa_item: newQuest.recompensa_item || null
      };
      const response = await questService.createQuest(questData);
      if (response.success) {
        setQuests(prev => [response.data, ...prev]);
        setNewQuest({
          titulo: '',
          descricao: '',
          recompensa_xp: 0,
          recompensa_item: ''
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao criar quest');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
          <h1 className="text-2xl font-fantasy text-rpg-gold mb-6 text-center">
            Painel Administrativo
          </h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha de Administrador
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="input-field w-full"
                placeholder="Digite a senha de admin"
              />
            </div>
            
            <button
              onClick={handleLogin}
              disabled={!adminPassword.trim()}
              className="btn-primary w-full"
            >
              Entrar
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-gray-800 border border-gray-600 rounded-lg">
            <p className="text-sm text-gray-400">
              <strong>Senha:</strong> 159357We*
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Senha fixa configurada no sistema
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-fantasy text-rpg-gold">
          Painel Administrativo
        </h1>
        <button onClick={handleLogout} className="btn-danger">
          Sair
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="card">
          <h2 className="text-xl font-fantasy text-rpg-gold mb-4">
            Estatísticas do Sistema
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-rpg-blue">
                {stats.totalPlayers}
              </div>
              <div className="text-sm text-gray-400">Jogadores</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rpg-green">
                {stats.totalItems}
              </div>
              <div className="text-sm text-gray-400">Itens</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rpg-purple">
                {stats.totalQuests}
              </div>
              <div className="text-sm text-gray-400">Quests</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rpg-gold">
                {stats.totalEvents}
              </div>
              <div className="text-sm text-gray-400">Eventos</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'events', label: 'Eventos', icon: '🎉' },
          { id: 'items', label: 'Itens', icon: '⚔️' },
          { id: 'quests', label: 'Quests', icon: '📜' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-rpg-blue text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-fantasy text-white mb-4">
              Criar Novo Evento
            </h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={newEvent.titulo}
                  onChange={(e) => setNewEvent({...newEvent, titulo: e.target.value})}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={newEvent.descricao}
                  onChange={(e) => setNewEvent({...newEvent, descricao: e.target.value})}
                  className="input-field w-full h-20"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data de Início
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.data_inicio}
                    onChange={(e) => setNewEvent({...newEvent, data_inicio: e.target.value})}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data de Fim
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.data_fim}
                    onChange={(e) => setNewEvent({...newEvent, data_fim: e.target.value})}
                    className="input-field w-full"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Criando...' : 'Criar Evento'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="text-xl font-fantasy text-white mb-4">
              Eventos ({events.length})
            </h2>
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                  <h3 className="font-semibold text-white">{event.titulo}</h3>
                  <p className="text-gray-400 text-sm mt-1">{event.descricao}</p>
                  <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
                    <span>Criado por: {event.criado_por}</span>
                    <span>{new Date(event.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-fantasy text-white mb-4">
              Criar Novo Item
            </h2>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={newItem.nome}
                  onChange={(e) => setNewItem({...newItem, nome: e.target.value})}
                  className="input-field w-full"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo
                  </label>
                  <select
                    value={newItem.tipo}
                    onChange={(e) => setNewItem({...newItem, tipo: e.target.value})}
                    className="select-field w-full"
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="arma">Arma</option>
                    <option value="armadura">Armadura</option>
                    <option value="poção">Poção</option>
                    <option value="consumível">Consumível</option>
                    <option value="mágico">Mágico</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Raridade
                  </label>
                  <select
                    value={newItem.raridade}
                    onChange={(e) => setNewItem({...newItem, raridade: e.target.value})}
                    className="select-field w-full"
                  >
                    <option value="comum">Comum</option>
                    <option value="incomum">Incomum</option>
                    <option value="raro">Raro</option>
                    <option value="épico">Épico</option>
                    <option value="lendário">Lendário</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Efeito (JSON)
                </label>
                <textarea
                  value={newItem.efeito}
                  onChange={(e) => setNewItem({...newItem, efeito: e.target.value})}
                  className="input-field w-full h-20"
                  placeholder='{"tipo": "cura", "valor": 10}'
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Criando...' : 'Criar Item'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="text-xl font-fantasy text-white mb-4">
              Itens ({items.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item.id} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                  <h3 className="font-semibold text-white">{item.nome}</h3>
                  <p className="text-gray-400 text-sm capitalize">{item.tipo}</p>
                  <p className={`text-sm ${getRarityColor(item.raridade)}`}>
                    {item.raridade}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quests Tab */}
      {activeTab === 'quests' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-fantasy text-white mb-4">
              Criar Nova Quest
            </h2>
            <form onSubmit={handleCreateQuest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={newQuest.titulo}
                  onChange={(e) => setNewQuest({...newQuest, titulo: e.target.value})}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={newQuest.descricao}
                  onChange={(e) => setNewQuest({...newQuest, descricao: e.target.value})}
                  className="input-field w-full h-20"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recompensa XP
                  </label>
                  <input
                    type="number"
                    value={newQuest.recompensa_xp}
                    onChange={(e) => setNewQuest({...newQuest, recompensa_xp: parseInt(e.target.value) || 0})}
                    className="input-field w-full"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recompensa Item (ID)
                  </label>
                  <input
                    type="number"
                    value={newQuest.recompensa_item}
                    onChange={(e) => setNewQuest({...newQuest, recompensa_item: e.target.value})}
                    className="input-field w-full"
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Criando...' : 'Criar Quest'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="text-xl font-fantasy text-white mb-4">
              Quests ({quests.length})
            </h2>
            <div className="space-y-4">
              {quests.map((quest) => (
                <div key={quest.id} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                  <h3 className="font-semibold text-white">{quest.titulo}</h3>
                  <p className="text-gray-400 text-sm mt-1">{quest.descricao}</p>
                  <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
                    <span>+{quest.recompensa_xp} XP</span>
                    <span>{new Date(quest.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
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

export default AdminPanel;
