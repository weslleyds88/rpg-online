import { useState } from 'react';
import { gameService } from '../services/gameService';

const DiceRoller = () => {
  const [diceString, setDiceString] = useState('1d20');
  const [modifier, setModifier] = useState(0);
  const [difficulty, setDifficulty] = useState(10);
  const [attackBonus, setAttackBonus] = useState(0);
  const [armorClass, setArmorClass] = useState(10);
  const [damageDice, setDamageDice] = useState('1d8');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const commonDice = [
    '1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100',
    '2d6', '3d6', '4d6', '2d8', '3d8', '2d10', '3d10'
  ];

  const rollDice = async () => {
    if (!diceString.trim()) return;

    setLoading(true);
    try {
      const response = await gameService.rollDice(diceString);
      if (response.success) {
        setResults(prev => [response.data, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao rolar dados');
    } finally {
      setLoading(false);
    }
  };

  const abilityCheck = async () => {
    setLoading(true);
    try {
      const response = await gameService.abilityCheck(modifier, difficulty);
      if (response.success) {
        setResults(prev => [response.data, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erro no teste de habilidade');
    } finally {
      setLoading(false);
    }
  };

  const attack = async () => {
    setLoading(true);
    try {
      const response = await gameService.attack(attackBonus, armorClass, damageDice);
      if (response.success) {
        setResults(prev => [response.data, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erro no ataque');
    } finally {
      setLoading(false);
    }
  };

  const initiative = async () => {
    setLoading(true);
    try {
      const response = await gameService.initiative(modifier);
      if (response.success) {
        setResults(prev => [response.data, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erro na iniciativa');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-fantasy text-rpg-gold text-center">
        🎲 Rolagem de Dados
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dice Roller */}
        <div className="card">
          <h2 className="text-xl font-fantasy text-white mb-4">
            Rolagem de Dados
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Dados (ex: 2d6+3, 1d20, 3d8-1)
              </label>
              <input
                type="text"
                value={diceString}
                onChange={(e) => setDiceString(e.target.value)}
                className="input-field w-full"
                placeholder="1d20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Dados Comuns
              </label>
              <div className="flex flex-wrap gap-2">
                {commonDice.map((dice) => (
                  <button
                    key={dice}
                    onClick={() => setDiceString(dice)}
                    className="btn-secondary text-sm"
                  >
                    {dice}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={rollDice}
              disabled={loading || !diceString.trim()}
              className="btn-primary w-full"
            >
              {loading ? 'Rolando...' : 'Rolar Dados'}
            </button>
          </div>
        </div>

        {/* Ability Check */}
        <div className="card">
          <h2 className="text-xl font-fantasy text-white mb-4">
            Teste de Habilidade
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Modificador
              </label>
              <input
                type="number"
                value={modifier}
                onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Dificuldade (DC)
              </label>
              <input
                type="number"
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value) || 10)}
                className="input-field w-full"
              />
            </div>

            <button
              onClick={abilityCheck}
              disabled={loading}
              className="btn-success w-full"
            >
              {loading ? 'Testando...' : 'Teste de Habilidade'}
            </button>
          </div>
        </div>

        {/* Attack */}
        <div className="card">
          <h2 className="text-xl font-fantasy text-white mb-4">
            Ataque
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bônus de Ataque
              </label>
              <input
                type="number"
                value={attackBonus}
                onChange={(e) => setAttackBonus(parseInt(e.target.value) || 0)}
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Classe de Armadura (AC)
              </label>
              <input
                type="number"
                value={armorClass}
                onChange={(e) => setArmorClass(parseInt(e.target.value) || 10)}
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Dados de Dano
              </label>
              <input
                type="text"
                value={damageDice}
                onChange={(e) => setDamageDice(e.target.value)}
                className="input-field w-full"
                placeholder="1d8+3"
              />
            </div>

            <button
              onClick={attack}
              disabled={loading}
              className="btn-danger w-full"
            >
              {loading ? 'Atacando...' : 'Atacar'}
            </button>
          </div>
        </div>

        {/* Initiative */}
        <div className="card">
          <h2 className="text-xl font-fantasy text-white mb-4">
            Iniciativa
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Modificador de Iniciativa
              </label>
              <input
                type="number"
                value={modifier}
                onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                className="input-field w-full"
              />
            </div>

            <button
              onClick={initiative}
              disabled={loading}
              className="btn-warning w-full"
            >
              {loading ? 'Rolando...' : 'Rolar Iniciativa'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-fantasy text-rpg-gold">
              Resultados Recentes
            </h2>
            <button onClick={clearResults} className="btn-secondary text-sm">
              Limpar
            </button>
          </div>

          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className="bg-gray-800 border border-gray-600 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">
                    {result.diceString || 'Teste de Habilidade' || 'Ataque' || 'Iniciativa'}
                  </h3>
                  <span className="text-sm text-gray-400">
                    {new Date().toLocaleTimeString('pt-BR')}
                  </span>
                </div>

                {result.rolls && (
                  <div className="text-sm text-gray-300 mb-2">
                    <span className="text-gray-400">Rolagens:</span> {result.rolls.join(', ')}
                  </div>
                )}

                {result.breakdown && (
                  <div className="text-sm text-gray-300 mb-2">
                    <span className="text-gray-400">Cálculo:</span> {result.breakdown}
                  </div>
                )}

                <div className="text-lg font-bold text-rpg-gold">
                  Total: {result.total}
                </div>

                {result.success !== undefined && (
                  <div className={`text-sm font-medium ${
                    result.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result.result}
                  </div>
                )}

                {result.damage !== null && (
                  <div className="text-sm text-red-400">
                    Dano: {result.damage}
                  </div>
                )}

                {result.critical && (
                  <div className="text-sm text-rpg-gold font-bold">
                    ACERTO CRÍTICO!
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help */}
      <div className="card">
        <h2 className="text-xl font-fantasy text-rpg-gold mb-4">
          Como Usar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-white mb-2">Formato de Dados</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• <code className="text-rpg-blue">1d20</code> - Um dado de 20 lados</li>
              <li>• <code className="text-rpg-blue">2d6+3</code> - Dois dados de 6 lados + 3</li>
              <li>• <code className="text-rpg-blue">3d8-1</code> - Três dados de 8 lados - 1</li>
              <li>• <code className="text-rpg-blue">1d100</code> - Dado de 100 lados</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Testes de Habilidade</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• <strong>Fácil:</strong> DC 10</li>
              <li>• <strong>Médio:</strong> DC 15</li>
              <li>• <strong>Difícil:</strong> DC 20</li>
              <li>• <strong>Muito Difícil:</strong> DC 25</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiceRoller;
