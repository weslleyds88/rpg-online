import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { playerService } from '../services/playerService';

const CreatePlayer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    classe: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const classes = [
    { value: 'guerreiro', label: 'Guerreiro', description: 'Especialista em combate corpo a corpo' },
    { value: 'mago', label: 'Mago', description: 'Mestre das artes arcanas' },
    { value: 'arqueiro', label: 'Arqueiro', description: 'Especialista em combate à distância' },
    { value: 'ladino', label: 'Ladino', description: 'Mestre da furtividade e agilidade' },
    { value: 'clérigo', label: 'Clérigo', description: 'Canalizador de poder divino' },
    { value: 'bárbaro', label: 'Bárbaro', description: 'Guerreiro selvagem e feroz' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await playerService.createPlayer(formData);
      if (response.success) {
        navigate(`/players/${response.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar personagem');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-fantasy text-rpg-gold mb-6 text-center">
          Criar Novo Personagem
        </h1>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Personagem
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              className="input-field w-full"
              placeholder="Digite o nome do seu personagem"
            />
          </div>

          <div>
            <label htmlFor="classe" className="block text-sm font-medium text-gray-300 mb-2">
              Classe
            </label>
            <select
              id="classe"
              name="classe"
              value={formData.classe}
              onChange={handleChange}
              required
              className="select-field w-full"
            >
              <option value="">Selecione uma classe</option>
              {classes.map((classe) => (
                <option key={classe.value} value={classe.value}>
                  {classe.label}
                </option>
              ))}
            </select>
          </div>

          {formData.classe && (
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                {classes.find(c => c.value === formData.classe)?.label}
              </h3>
              <p className="text-gray-400">
                {classes.find(c => c.value === formData.classe)?.description}
              </p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Criando...' : 'Criar Personagem'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/players')}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* Class Information */}
      <div className="mt-8">
        <h2 className="text-2xl font-fantasy text-rpg-gold mb-4">
          Classes Disponíveis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((classe) => (
            <div key={classe.value} className="card">
              <h3 className="text-lg font-fantasy text-white mb-2">
                {classe.label}
              </h3>
              <p className="text-gray-400 text-sm">
                {classe.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreatePlayer;
