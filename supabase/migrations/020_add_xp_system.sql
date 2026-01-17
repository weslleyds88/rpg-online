-- Migration: Adicionar sistema de XP aos characters
-- Adiciona campos de experiência (XP) e porcentagem de XP

-- 1. Adicionar colunas de XP na tabela rpg.characters
ALTER TABLE rpg.characters
ADD COLUMN IF NOT EXISTS xp_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (xp_percentage >= 0 AND xp_percentage <= 100);

-- 2. Atualizar a view para incluir xp_percentage
DROP VIEW IF EXISTS public.rpg_characters;
CREATE OR REPLACE VIEW public.rpg_characters AS
SELECT 
  id,
  game_id,
  owner,
  name,
  class,
  level,
  hp,
  mp,
  stats,
  sheet,
  status,
  xp_percentage,
  created_at
FROM rpg.characters;

-- Garantir permissões na view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rpg_characters TO anon, authenticated;

-- 3. Atualizar trigger de INSERT para incluir xp_percentage
CREATE OR REPLACE FUNCTION public.rpg_insert_character()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, rpg
AS $$
BEGIN
  INSERT INTO rpg.characters (
    id, game_id, owner, name, class, level, hp, mp, stats, sheet, status, xp_percentage, created_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.game_id,
    NEW.owner,
    NEW.name,
    NEW.class,
    COALESCE(NEW.level, 1),
    COALESCE(NEW.hp, 10),
    COALESCE(NEW.mp, 0),
    COALESCE(NEW.stats, '{}'::jsonb),
    COALESCE(NEW.sheet, '{}'::jsonb),
    COALESCE(NEW.status, 'active'),
    COALESCE(NEW.xp_percentage, 0.00),
    COALESCE(NEW.created_at, now())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Atualizar trigger de UPDATE para incluir xp_percentage
CREATE OR REPLACE FUNCTION public.rpg_update_character()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, rpg
AS $$
BEGIN
  UPDATE rpg.characters SET
    game_id = NEW.game_id,
    owner = NEW.owner,
    name = NEW.name,
    class = NEW.class,
    level = COALESCE(NEW.level, level),
    hp = COALESCE(NEW.hp, hp),
    mp = COALESCE(NEW.mp, mp),
    stats = COALESCE(NEW.stats, stats),
    sheet = COALESCE(NEW.sheet, sheet),
    status = COALESCE(NEW.status, status),
    xp_percentage = COALESCE(NEW.xp_percentage, xp_percentage)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Função para adicionar XP e verificar level up
CREATE OR REPLACE FUNCTION rpg.add_character_xp(
  character_id_param uuid,
  xp_gain_param decimal
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public, rpg
AS $$
DECLARE
  current_xp decimal;
  current_level int;
  new_xp decimal;
  new_level int;
  leveled_up boolean := false;
BEGIN
  -- Buscar XP e nível atuais
  SELECT xp_percentage, level INTO current_xp, current_level
  FROM rpg.characters
  WHERE id = character_id_param;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Character not found');
  END IF;

  -- Adicionar XP
  new_xp := current_xp + xp_gain_param;
  new_level := current_level;
  leveled_up := false;

  -- Verificar se passou de nível (>= 100%)
  IF new_xp >= 100.00 THEN
    new_level := current_level + 1;
    new_xp := new_xp - 100.00; -- Resto de XP após level up
    leveled_up := true;
  END IF;

  -- Garantir que XP não ultrapasse 100%
  IF new_xp > 100.00 THEN
    new_xp := 100.00;
  END IF;

  -- Atualizar character
  UPDATE rpg.characters
  SET xp_percentage = new_xp,
      level = new_level
  WHERE id = character_id_param;

  -- Retornar resultado
  RETURN jsonb_build_object(
    'leveled_up', leveled_up,
    'new_level', new_level,
    'new_xp', new_xp,
    'xp_gained', xp_gain_param
  );
END;
$$ LANGUAGE plpgsql;

-- 6. Garantir permissões
GRANT EXECUTE ON FUNCTION rpg.add_character_xp TO authenticated;
