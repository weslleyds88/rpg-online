-- ============================================================
-- LIMPAR DADOS DO SCHEMA RPG (somente tabelas do RPG)
-- ============================================================
-- Execute este script no SQL Editor do Supabase quando quiser
-- apagar todos os dados de teste (jogos, personagens, mapas,
-- chat, NPCs, encontros, combate, etc.) e começar do zero.
--
-- NÃO altera: auth.users, storage, ou outras tabelas fora do rpg.
--
-- Se alguma tabela não existir (ex.: encounters), comente a linha
-- correspondente e rode o resto.
-- ============================================================

-- Ordem: filhos primeiro (tabelas que referenciam outras), depois pais.
-- 1. Encounters e suas dependências (initiative_entries, combat_logs)
TRUNCATE rpg.encounters CASCADE;

-- 2. Games e suas dependências (players, actions, chat, npcs, maps, combat_actions)
TRUNCATE rpg.games CASCADE;

-- 3. Characters (CASCADE para incluir players, que referencia characters)
TRUNCATE rpg.characters CASCADE;

-- ============================================================
-- OPCIONAL: limpar arquivos de mapas no Storage
-- ============================================================
-- Os mapas em rpg.maps foram apagados, mas os arquivos de imagem
-- podem continuar no bucket. Para remover também:
--
-- 1. No Supabase: Storage > escolha o bucket dos mapas
-- 2. Apague os arquivos manualmente
-- ============================================================
