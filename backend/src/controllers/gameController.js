const { rollDiceString, rollAbilityCheck, rollAttack, rollInitiative } = require('../game/dice');
const { applyDamage, applyHealing, applyManaCost } = require('../game/rules');
const { pool } = require('../db');

// Rolar dados
async function rollDice(req, res) {
  try {
    const { dice } = req.body;
    
    if (!dice) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetro "dice" é obrigatório (ex: "2d6+3")'
      });
    }
    
    const result = rollDiceString(dice);
    
    res.json({
      success: true,
      data: result,
      message: `Rolagem: ${result.breakdown}`
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

// Teste de habilidade
async function abilityCheck(req, res) {
  try {
    const { modifier = 0, difficulty = 10 } = req.body;
    
    const result = rollAbilityCheck(modifier, difficulty);
    
    res.json({
      success: true,
      data: result,
      message: `Teste de habilidade: ${result.roll} + ${modifier} = ${result.total} (DC ${difficulty}) - ${result.result}`
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

// Ataque
async function attack(req, res) {
  try {
    const { attackBonus = 0, armorClass = 10, damageDice = '1d4' } = req.body;
    
    const result = rollAttack(attackBonus, armorClass, damageDice);
    
    let message = `Ataque: ${result.attack.roll} + ${attackBonus} = ${result.attack.total} (AC ${armorClass}) - `;
    message += result.hit ? 'Acerto!' : 'Erro!';
    
    if (result.critical) {
      message += ' (Crítico!)';
    }
    
    if (result.damage !== null) {
      message += ` Dano: ${result.damage}`;
    }
    
    res.json({
      success: true,
      data: result,
      message
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

// Iniciativa
async function initiative(req, res) {
  try {
    const { modifier = 0 } = req.body;
    
    const result = rollInitiative(modifier);
    
    res.json({
      success: true,
      data: result,
      message: `Iniciativa: ${result.roll} + ${modifier} = ${result.total}`
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

// Aplicar dano a um jogador
async function applyDamageToPlayer(req, res) {
  try {
    const { playerId } = req.params;
    const { damage } = req.body;
    
    if (!damage || damage < 0) {
      return res.status(400).json({
        success: false,
        message: 'Dano deve ser um número positivo'
      });
    }
    
    const playerResult = await pool.query('SELECT * FROM players WHERE id = $1', [playerId]);
    
    if (playerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jogador não encontrado'
      });
    }
    
    const player = playerResult.rows[0];
    const damageResult = applyDamage(player.vida, damage);
    
    const result = await pool.query(
      'UPDATE players SET vida = $1 WHERE id = $2 RETURNING *',
      [damageResult.newHealth, playerId]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      damageApplied: damage,
      isDead: damageResult.isDead,
      message: damageResult.isDead ? 
        'Jogador foi derrotado!' : 
        `Dano aplicado! Vida restante: ${damageResult.newHealth}`
    });
    
  } catch (error) {
    console.error('Erro ao aplicar dano:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Aplicar cura a um jogador
async function applyHealingToPlayer(req, res) {
  try {
    const { playerId } = req.params;
    const { healing } = req.body;
    
    if (!healing || healing < 0) {
      return res.status(400).json({
        success: false,
        message: 'Cura deve ser um número positivo'
      });
    }
    
    const playerResult = await pool.query('SELECT * FROM players WHERE id = $1', [playerId]);
    
    if (playerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jogador não encontrado'
      });
    }
    
    const player = playerResult.rows[0];
    const newHealth = applyHealing(player.vida, healing, player.vida); // Assumindo que vida já é a máxima
    
    const result = await pool.query(
      'UPDATE players SET vida = $1 WHERE id = $2 RETURNING *',
      [newHealth, playerId]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      healingApplied: healing,
      message: `Cura aplicada! Vida atual: ${newHealth}`
    });
    
  } catch (error) {
    console.error('Erro ao aplicar cura:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Aplicar custo de mana
async function applyManaCostToPlayer(req, res) {
  try {
    const { playerId } = req.params;
    const { cost } = req.body;
    
    if (!cost || cost < 0) {
      return res.status(400).json({
        success: false,
        message: 'Custo de mana deve ser um número positivo'
      });
    }
    
    const playerResult = await pool.query('SELECT * FROM players WHERE id = $1', [playerId]);
    
    if (playerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jogador não encontrado'
      });
    }
    
    const player = playerResult.rows[0];
    const manaResult = applyManaCost(player.mana, cost);
    
    if (!manaResult.canCast) {
      return res.status(400).json({
        success: false,
        message: 'Mana insuficiente para usar esta habilidade'
      });
    }
    
    const result = await pool.query(
      'UPDATE players SET mana = $1 WHERE id = $2 RETURNING *',
      [manaResult.newMana, playerId]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      manaCost: cost,
      message: `Mana gasta! Mana restante: ${manaResult.newMana}`
    });
    
  } catch (error) {
    console.error('Erro ao aplicar custo de mana:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Iniciar encontro simples
async function startEncounter(req, res) {
  try {
    const { players, monsters } = req.body;
    
    if (!players || !Array.isArray(players) || players.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de jogadores é obrigatória'
      });
    }
    
    if (!monsters || !Array.isArray(monsters) || monsters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de monstros é obrigatória'
      });
    }
    
    // Rolar iniciativa para todos
    const initiatives = [];
    
    // Iniciativa dos jogadores
    for (const player of players) {
      const initiative = rollInitiative(player.initiativeModifier || 0);
      initiatives.push({
        name: player.name,
        type: 'player',
        initiative: initiative.total,
        roll: initiative.roll,
        modifier: player.initiativeModifier || 0
      });
    }
    
    // Iniciativa dos monstros
    for (const monster of monsters) {
      const initiative = rollInitiative(monster.initiativeModifier || 0);
      initiatives.push({
        name: monster.name,
        type: 'monster',
        initiative: initiative.total,
        roll: initiative.roll,
        modifier: monster.initiativeModifier || 0
      });
    }
    
    // Ordenar por iniciativa (maior primeiro)
    initiatives.sort((a, b) => b.initiative - a.initiative);
    
    res.json({
      success: true,
      data: {
        encounter: {
          players,
          monsters
        },
        initiative: initiatives,
        turnOrder: initiatives.map(item => item.name)
      },
      message: 'Encontro iniciado! Ordem de iniciativa definida.'
    });
    
  } catch (error) {
    console.error('Erro ao iniciar encontro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

module.exports = {
  rollDice,
  abilityCheck,
  attack,
  initiative,
  applyDamageToPlayer,
  applyHealingToPlayer,
  applyManaCostToPlayer,
  startEncounter
};
