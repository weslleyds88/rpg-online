-- Migration: Adicionar campo color à view rpg_players e atualizar triggers
-- Corrige erro 400 ao criar players sem o campo color

-- 1. Adicionar coluna color na tabela rpg.players se não existir
ALTER TABLE rpg.players
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3b82f6' NOT NULL;

-- 2. Atualizar registros existentes sem color
UPDATE rpg.players
SET color = '#3b82f6'
WHERE color IS NULL;

-- 3. Recriar a view para incluir color
DROP VIEW IF EXISTS public.rpg_players CASCADE;

CREATE OR REPLACE VIEW public.rpg_players AS
SELECT 
  id,
  game_id,
  user_id,
  role,
  character_id,
  position_x,
  position_y,
  color,
  joined_at
FROM rpg.players;

-- Garantir permissões na view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rpg_players TO anon, authenticated;

-- 4. Recriar função de INSERT para incluir color
CREATE OR REPLACE FUNCTION public.rpg_insert_player()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, rpg
AS $$
BEGIN
  INSERT INTO rpg.players (
    id, game_id, user_id, role, character_id, position_x, position_y, color, joined_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.game_id,
    NEW.user_id,
    COALESCE(NEW.role, 'player'),
    NEW.character_id,
    NEW.position_x,
    NEW.position_y,
    COALESCE(NEW.color, '#3b82f6'),
    COALESCE(NEW.joined_at, now())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Recriar trigger de INSERT
DROP TRIGGER IF EXISTS rpg_insert_player_trigger ON public.rpg_players;
CREATE TRIGGER rpg_insert_player_trigger
INSTEAD OF INSERT ON public.rpg_players
FOR EACH ROW EXECUTE FUNCTION public.rpg_insert_player();

-- 6. Recriar função de UPDATE para incluir color
CREATE OR REPLACE FUNCTION public.rpg_update_player()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, rpg
AS $$
BEGIN
  UPDATE rpg.players SET
    game_id = NEW.game_id,
    user_id = NEW.user_id,
    role = NEW.role,
    character_id = NEW.character_id,
    position_x = NEW.position_x,
    position_y = NEW.position_y,
    color = NEW.color,
    joined_at = NEW.joined_at
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Recriar trigger de UPDATE
DROP TRIGGER IF EXISTS rpg_update_player_trigger ON public.rpg_players;
CREATE TRIGGER rpg_update_player_trigger
INSTEAD OF UPDATE ON public.rpg_players
FOR EACH ROW EXECUTE FUNCTION public.rpg_update_player();

-- 8. Recriar função de DELETE
CREATE OR REPLACE FUNCTION public.rpg_delete_player()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, rpg
AS $$
BEGIN
  DELETE FROM rpg.players WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 9. Recriar trigger de DELETE
DROP TRIGGER IF EXISTS rpg_delete_player_trigger ON public.rpg_players;
CREATE TRIGGER rpg_delete_player_trigger
INSTEAD OF DELETE ON public.rpg_players
FOR EACH ROW EXECUTE FUNCTION public.rpg_delete_player();
