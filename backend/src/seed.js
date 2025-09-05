const { pool, initializeDatabase } = require('./db');

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');
    
    // Inicializar banco se necessário
    await initializeDatabase();
    
    // Limpar dados existentes (opcional - comentar se quiser manter dados)
    console.log('🧹 Limpando dados existentes...');
    await pool.query('DELETE FROM inventory');
    await pool.query('DELETE FROM player_quests');
    await pool.query('DELETE FROM events');
    await pool.query('DELETE FROM quests');
    await pool.query('DELETE FROM items');
    await pool.query('DELETE FROM players');
    
    // Inserir jogadores de exemplo
    console.log('👥 Criando jogadores de exemplo...');
    const players = [
      { nome: 'Aragorn', classe: 'guerreiro' },
      { nome: 'Gandalf', classe: 'mago' },
      { nome: 'Legolas', classe: 'arqueiro' },
      { nome: 'Bilbo', classe: 'ladino' },
      { nome: 'Gimli', classe: 'bárbaro' }
    ];
    
    const playerIds = [];
    for (const player of players) {
      const result = await pool.query(
        'INSERT INTO players (nome, classe, nivel, experiencia, vida, mana) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [player.nome, player.classe, 1, 0, 100, 50]
      );
      playerIds.push(result.rows[0].id);
    }
    
    // Inserir itens de exemplo
    console.log('⚔️ Criando itens de exemplo...');
    const items = [
      {
        nome: 'Espada Longa',
        tipo: 'arma',
        raridade: 'comum',
        efeito: { dano: '1d8+3', tipo: 'corte' }
      },
      {
        nome: 'Cajado do Poder',
        tipo: 'arma',
        raridade: 'raro',
        efeito: { dano: '1d6+2', tipo: 'mágico', bonus_mana: 10 }
      },
      {
        nome: 'Armadura de Couro',
        tipo: 'armadura',
        raridade: 'comum',
        efeito: { ac: 2, tipo: 'leve' }
      },
      {
        nome: 'Poção de Cura Menor',
        tipo: 'poção',
        raridade: 'comum',
        efeito: { tipo: 'cura', valor: 10 }
      },
      {
        nome: 'Poção de Mana',
        tipo: 'poção',
        raridade: 'comum',
        efeito: { tipo: 'mana', valor: 20 }
      },
      {
        nome: 'Anel de Proteção',
        tipo: 'mágico',
        raridade: 'incomum',
        efeito: { ac: 1, resistencias: ['fogo'] }
      },
      {
        nome: 'Pergaminho de Bola de Fogo',
        tipo: 'consumível',
        raridade: 'raro',
        efeito: { dano: '8d6', tipo: 'fogo', area: 'raio 6m' }
      },
      {
        nome: 'Elixir de Força',
        tipo: 'consumível',
        raridade: 'incomum',
        efeito: { bonus_forca: 2, duracao: '1 hora' }
      }
    ];
    
    const itemIds = [];
    for (const item of items) {
      const result = await pool.query(
        'INSERT INTO items (nome, tipo, raridade, efeito) VALUES ($1, $2, $3, $4) RETURNING id',
        [item.nome, item.tipo, item.raridade, JSON.stringify(item.efeito)]
      );
      itemIds.push(result.rows[0].id);
    }
    
    // Inserir quests de exemplo
    console.log('📜 Criando quests de exemplo...');
    const quests = [
      {
        titulo: 'A Jornada Inicial',
        descricao: 'Um aventureiro novato deve provar seu valor enfrentando goblins na floresta próxima.',
        recompensa_xp: 100,
        recompensa_item: itemIds[0] // Espada Longa
      },
      {
        titulo: 'O Mistério da Torre',
        descricao: 'Investigar os estranhos acontecimentos na torre abandonada do mago.',
        recompensa_xp: 250,
        recompensa_item: itemIds[1] // Cajado do Poder
      },
      {
        titulo: 'Proteção da Vila',
        descricao: 'Defender a vila de bandidos que atacam durante a noite.',
        recompensa_xp: 200,
        recompensa_item: itemIds[2] // Armadura de Couro
      },
      {
        titulo: 'A Busca pelo Artefato',
        descricao: 'Encontrar o artefato perdido nas ruínas antigas.',
        recompensa_xp: 500,
        recompensa_item: itemIds[5] // Anel de Proteção
      }
    ];
    
    const questIds = [];
    for (const quest of quests) {
      const result = await pool.query(
        'INSERT INTO quests (titulo, descricao, recompensa_xp, recompensa_item) VALUES ($1, $2, $3, $4) RETURNING id',
        [quest.titulo, quest.descricao, quest.recompensa_xp, quest.recompensa_item]
      );
      questIds.push(result.rows[0].id);
    }
    
    // Adicionar alguns itens ao inventário dos jogadores
    console.log('🎒 Adicionando itens ao inventário...');
    await pool.query(
      'INSERT INTO inventory (player_id, item_id, quantidade) VALUES ($1, $2, $3)',
      [playerIds[0], itemIds[0], 1] // Aragorn com Espada Longa
    );
    await pool.query(
      'INSERT INTO inventory (player_id, item_id, quantidade) VALUES ($1, $2, $3)',
      [playerIds[1], itemIds[1], 1] // Gandalf com Cajado do Poder
    );
    await pool.query(
      'INSERT INTO inventory (player_id, item_id, quantidade) VALUES ($1, $2, $3)',
      [playerIds[0], itemIds[3], 3] // Aragorn com 3 Poções de Cura
    );
    await pool.query(
      'INSERT INTO inventory (player_id, item_id, quantidade) VALUES ($1, $2, $3)',
      [playerIds[1], itemIds[4], 2] // Gandalf com 2 Poções de Mana
    );
    
    // Aceitar algumas quests
    console.log('✅ Aceitando quests...');
    await pool.query(
      'INSERT INTO player_quests (player_id, quest_id, status) VALUES ($1, $2, $3)',
      [playerIds[0], questIds[0], 'ativa'] // Aragorn aceita "A Jornada Inicial"
    );
    await pool.query(
      'INSERT INTO player_quests (player_id, quest_id, status) VALUES ($1, $2, $3)',
      [playerIds[1], questIds[1], 'ativa'] // Gandalf aceita "O Mistério da Torre"
    );
    
    // Inserir eventos de exemplo
    console.log('🎉 Criando eventos de exemplo...');
    const events = [
      {
        titulo: 'Festival da Lua Cheia',
        descricao: 'Um festival especial acontece durante a lua cheia, com bônus de experiência para todos os aventureiros.',
        data_inicio: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
        data_fim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Em uma semana
        criado_por: 'admin'
      },
      {
        titulo: 'Torneio de Gladiadores',
        descricao: 'Um torneio épico onde os melhores aventureiros competem por glória e recompensas.',
        data_inicio: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Em 3 dias
        data_fim: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Em 5 dias
        criado_por: 'admin'
      }
    ];
    
    for (const event of events) {
      await pool.query(
        'INSERT INTO events (titulo, descricao, data_inicio, data_fim, criado_por) VALUES ($1, $2, $3, $4, $5)',
        [event.titulo, event.descricao, event.data_inicio, event.data_fim, event.criado_por]
      );
    }
    
    console.log('✅ Seed concluído com sucesso!');
    console.log(`👥 ${players.length} jogadores criados`);
    console.log(`⚔️ ${items.length} itens criados`);
    console.log(`📜 ${quests.length} quests criadas`);
    console.log(`🎉 ${events.length} eventos criados`);
    
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar seed se chamado diretamente
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seed finalizado!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no seed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
