-- Migration inicial: Criação das tabelas principais do sistema
-- Execute este arquivo no Supabase SQL Editor

-- ============================================
-- TABELA: characters (Personagens)
-- ============================================
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  class VARCHAR(50) NOT NULL,
  race VARCHAR(50) NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  
  -- Atributos base (D&D style)
  strength INTEGER NOT NULL DEFAULT 10,
  dexterity INTEGER NOT NULL DEFAULT 10,
  constitution INTEGER NOT NULL DEFAULT 10,
  intelligence INTEGER NOT NULL DEFAULT 10,
  wisdom INTEGER NOT NULL DEFAULT 10,
  charisma INTEGER NOT NULL DEFAULT 10,
  
  -- Status
  hit_points INTEGER NOT NULL DEFAULT 10,
  max_hit_points INTEGER NOT NULL DEFAULT 10,
  mana_points INTEGER NOT NULL DEFAULT 0,
  max_mana_points INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: campaigns (Campanhas)
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: campaign_players (Jogadores da Campanha)
-- ============================================
CREATE TABLE IF NOT EXISTS campaign_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

-- ============================================
-- TABELA: combat_logs (Logs de Combate)
-- ============================================
CREATE TABLE IF NOT EXISTS combat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'attack', 'defense', 'magic', 'move', etc
  action_description TEXT NOT NULL,
  damage INTEGER,
  target_character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  turn_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES para melhor performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_master_id ON campaigns(master_id);
CREATE INDEX IF NOT EXISTS idx_campaign_players_campaign_id ON campaign_players(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_players_user_id ON campaign_players(user_id);
CREATE INDEX IF NOT EXISTS idx_combat_logs_campaign_id ON combat_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_combat_logs_character_id ON combat_logs(character_id);

-- ============================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Policies
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE combat_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: characters
-- ============================================
-- Usuário pode ver apenas seus próprios personagens
CREATE POLICY "Users can view own characters"
  ON characters FOR SELECT
  USING (auth.uid() = user_id);

-- Usuário pode criar seus próprios personagens
CREATE POLICY "Users can create own characters"
  ON characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuário pode atualizar seus próprios personagens
CREATE POLICY "Users can update own characters"
  ON characters FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usuário pode deletar seus próprios personagens
CREATE POLICY "Users can delete own characters"
  ON characters FOR DELETE
  USING (auth.uid() = user_id);

-- Mestre pode ver personagens da sua campanha
CREATE POLICY "Masters can view campaign characters"
  ON characters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.master_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM campaign_players
        WHERE campaign_players.campaign_id = campaigns.id
        AND campaign_players.character_id = characters.id
      )
    )
  );

-- ============================================
-- POLICIES: campaigns
-- ============================================
-- Qualquer usuário autenticado pode ver campanhas
CREATE POLICY "Users can view campaigns"
  ON campaigns FOR SELECT
  USING (auth.role() = 'authenticated');

-- Usuário pode criar campanhas (será mestre)
CREATE POLICY "Users can create campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (auth.uid() = master_id);

-- Apenas o mestre pode atualizar sua campanha
CREATE POLICY "Masters can update own campaigns"
  ON campaigns FOR UPDATE
  USING (auth.uid() = master_id)
  WITH CHECK (auth.uid() = master_id);

-- Apenas o mestre pode deletar sua campanha
CREATE POLICY "Masters can delete own campaigns"
  ON campaigns FOR DELETE
  USING (auth.uid() = master_id);

-- ============================================
-- POLICIES: campaign_players
-- ============================================
-- Usuário pode ver jogadores das campanhas que participa ou é mestre
CREATE POLICY "Users can view campaign players"
  ON campaign_players FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_players.campaign_id
      AND campaigns.master_id = auth.uid()
    )
  );

-- Usuário pode entrar em campanhas (via invite_code)
CREATE POLICY "Users can join campaigns"
  ON campaign_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Mestre pode adicionar jogadores
CREATE POLICY "Masters can add players"
  ON campaign_players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_players.campaign_id
      AND campaigns.master_id = auth.uid()
    )
  );

-- Usuário pode sair de campanhas ou mestre pode remover
CREATE POLICY "Users can leave campaigns or masters can remove"
  ON campaign_players FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_players.campaign_id
      AND campaigns.master_id = auth.uid()
    )
  );

-- ============================================
-- POLICIES: combat_logs
-- ============================================
-- Usuários podem ver logs das campanhas que participam
CREATE POLICY "Users can view combat logs"
  ON combat_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaign_players
      WHERE campaign_players.campaign_id = combat_logs.campaign_id
      AND campaign_players.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = combat_logs.campaign_id
      AND campaigns.master_id = auth.uid()
    )
  );

-- Mestre pode criar logs de combate
CREATE POLICY "Masters can create combat logs"
  ON combat_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = combat_logs.campaign_id
      AND campaigns.master_id = auth.uid()
    )
  );

-- Mestre pode atualizar logs de combate
CREATE POLICY "Masters can update combat logs"
  ON combat_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = combat_logs.campaign_id
      AND campaigns.master_id = auth.uid()
    )
  );

-- Mestre pode deletar logs de combate
CREATE POLICY "Masters can delete combat logs"
  ON combat_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = combat_logs.campaign_id
      AND campaigns.master_id = auth.uid()
    )
  );

