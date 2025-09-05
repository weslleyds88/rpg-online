import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService';
import { itemService } from '../services/itemService';
import { playerService } from '../services/playerService';

const Inventory = () => {
  const { playerId } = useParams();
  const [inventory, setInventory] = useState([]);
  const [player, setPlayer] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadData();
  }, [playerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inventoryResponse, playerResponse, itemsResponse] = await Promise.all([
        inventoryService.getPlayerInventory(playerId),
        playerService.getPlayerById(playerId),
        itemService.getItems()
      ]);

      if (inventoryResponse.success) {
        setInventory(inventoryResponse.data);
      }
      if (playerResponse.success) {
        setPlayer(playerResponse.data);
      }
      if (itemsResponse.success) {
        setItems(itemsResponse.data);
      }
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedItem || quantity < 1) return;

    try {
      const response = await inventoryService.addItem(playerId, selectedItem, quantity);
      if (response.success) {
        setShowAddItem(false);
        setSelectedItem('');
        setQuantity(1);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao adicionar item');
    }
  };

  const handleUseItem = async (itemId) => {
    try {
      const response = await inventoryService.useItem(playerId, itemId);
      if (response.success) {
        alert(response.message);
        if (response.effectApplied) {
          alert(`Efeito aplicado: ${response.effectMessage}`);
        }
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao usar item');
    }
  };

  const handleRemoveItem = async (itemId, currentQuantity) => {
    const removeQuantity = prompt(`Quantos itens deseja remover? (máximo: ${currentQuantity})`);
    if (!removeQuantity || removeQuantity < 1 || removeQuantity > currentQuantity) return;

    try {
      const response = await inventoryService.removeItem(playerId, itemId, parseInt(removeQuantity));
      if (response.success) {
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao remover item');
    }
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

  const getRarityBg = (rarity) => {
    const colors = {
      comum: 'border-gray-600',
      incomum: 'border-green-600',
      raro: 'border-blue-600',
      épico: 'border-purple-600',
      lendário: 'border-rpg-gold'
    };
    return colors[rarity] || 'border-gray-600';
  };

  const getTypeIcon = (tipo) => {
    const icons = {
      arma: '⚔️',
      armadura: '🛡️',
      poção: '🧪',
      consumível: '🍯',
      mágico: '✨',
      outro: '📦'
    };
    return icons[tipo] || '📦';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rpg-gold mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando inventário...</p>
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
        <Link to={`/players/${playerId}`} className="btn-secondary">
          ← Voltar
        </Link>
        <button
          onClick={() => setShowAddItem(true)}
          className="btn-primary"
        >
          Adicionar Item
        </button>
      </div>

      {/* Player Info */}
      <div className="card">
        <h1 className="text-2xl font-fantasy text-rpg-gold mb-2">
          Inventário de {player.nome}
        </h1>
        <p className="text-gray-400">
          {player.classe.charAt(0).toUpperCase() + player.classe.slice(1)} - Nível {player.nivel}
        </p>
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-rpg-dark border border-gray-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-fantasy text-rpg-gold mb-4">
              Adicionar Item
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Item
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="select-field w-full"
                >
                  <option value="">Selecione um item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome} ({item.tipo} - {item.raridade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantidade
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  min="1"
                  className="input-field w-full"
                />
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <button
                onClick={handleAddItem}
                disabled={!selectedItem || quantity < 1}
                className="btn-success flex-1"
              >
                Adicionar
              </button>
              <button
                onClick={() => setShowAddItem(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Grid */}
      {inventory.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎒</div>
          <h2 className="text-2xl font-fantasy text-white mb-2">
            Inventário Vazio
          </h2>
          <p className="text-gray-400 mb-6">
            Adicione itens ao inventário do personagem!
          </p>
          <button
            onClick={() => setShowAddItem(true)}
            className="btn-primary"
          >
            Adicionar Primeiro Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.map((item) => (
            <div
              key={item.inventory_id}
              className={`bg-rpg-dark border-2 ${getRarityBg(item.raridade)} rounded-lg p-4`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getTypeIcon(item.tipo)}</span>
                  <div>
                    <h3 className="font-semibold text-white">{item.nome}</h3>
                    <p className="text-sm text-gray-400 capitalize">{item.tipo}</p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${getRarityColor(item.raridade)}`}>
                  {item.raridade}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Quantidade:</span>
                  <span className="text-white font-semibold">{item.quantidade}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Adquirido:</span>
                  <span className="text-gray-300">
                    {new Date(item.acquired_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {item.efeito && (
                  <div className="text-sm text-gray-400">
                    <span className="text-gray-400">Efeito:</span>
                    <div className="text-rpg-blue text-xs mt-1">
                      {JSON.stringify(item.efeito, null, 2)}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                {(item.tipo === 'poção' || item.tipo === 'consumível') && (
                  <button
                    onClick={() => handleUseItem(item.item_id)}
                    className="btn-success flex-1 text-sm"
                  >
                    Usar
                  </button>
                )}
                <button
                  onClick={() => handleRemoveItem(item.item_id, item.quantidade)}
                  className="btn-danger text-sm"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inventory Stats */}
      {inventory.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-fantasy text-rpg-gold mb-4">
            Estatísticas do Inventário
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-rpg-blue">
                {inventory.length}
              </div>
              <div className="text-sm text-gray-400">Tipos de Itens</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rpg-green">
                {inventory.reduce((acc, item) => acc + item.quantidade, 0)}
              </div>
              <div className="text-sm text-gray-400">Total de Itens</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rpg-purple">
                {new Set(inventory.map(item => item.tipo)).size}
              </div>
              <div className="text-sm text-gray-400">Tipos Únicos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rpg-gold">
                {new Set(inventory.map(item => item.raridade)).size}
              </div>
              <div className="text-sm text-gray-400">Raridades</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
