-- Migration: Adicionar campo max_hp aos characters
-- Permite rastrear HP máximo separadamente do HP atual

-- 1. Adicionar coluna max_hp na tabela rpg.characters
ALTER TABLE rpg.characters
ADD COLUMN IF NOT EXISTS max_hp INTEGER DEFAULT 10 CHECK (max_hp > 0);

-- 2. Atualizar registros existentes: max_hp = hp (se max_hp for NULL)
UPDATE rpg.characters
SET max_hp = hp
WHERE max_hp IS NULL OR max_hp < hp;

-- 3. Atualizar a view para incluir max_hp
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
  max_hp,
  mp,
  stats,
  sheet,
  status,
  xp_percentage,
  created_at
FROM rpg.characters;

-- Garantir permissões na view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rpg_characters TO anon, authenticated;

-- 4. Atualizar trigger de INSERT para incluir max_hp
CREATE OR REPLACE FUNCTION public.rpg_insert_character()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, rpg
AS $$
BEGIN
  INSERT INTO rpg.characters (
    id, game_id, owner, name, class, level, hp, max_hp, mp, stats, sheet, status, xp_percentage, created_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.game_id,
    NEW.owner,
    NEW.name,
    NEW.class,
    COALESCE(NEW.level, 1),
    COALESCE(NEW.hp, 10),
    COALESCE(NEW.max_hp, COALESCE(NEW.hp, 10)),
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

-- 5. Atualizar trigger de UPDATE para incluir max_hp
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
    max_hp = COALESCE(NEW.max_hp, max_hp),
    mp = COALESCE(NEW.mp, mp),
    stats = COALESCE(NEW.stats, stats),
    sheet = COALESCE(NEW.sheet, sheet),
    status = COALESCE(NEW.status, status),
    xp_percentage = COALESCE(NEW.xp_percentage, xp_percentage)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
