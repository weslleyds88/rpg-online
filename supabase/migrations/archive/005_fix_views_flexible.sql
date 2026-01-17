-- Migration: Tornar views flexíveis (funcionam com ou sem invite_code)
-- Execute este arquivo se tiver erros 400 ao acessar rpg_games

-- Recriar view de games de forma mais flexível
CREATE OR REPLACE VIEW public.rpg_games AS
SELECT 
  id,
  name,
  master,
  status,
  COALESCE(invite_code, NULL) as invite_code,
  created_at
FROM rpg.games;

-- Se a coluna invite_code não existir, criar view sem ela
DO $$
BEGIN
  -- Verificar se a coluna existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'rpg' 
    AND table_name = 'games' 
    AND column_name = 'invite_code'
  ) THEN
    -- Recriar view sem invite_code
    DROP VIEW IF EXISTS public.rpg_games CASCADE;
    
    CREATE VIEW public.rpg_games AS
    SELECT 
      id,
      name,
      master,
      status,
      created_at
    FROM rpg.games;
    
    -- Recriar triggers sem invite_code
    CREATE OR REPLACE FUNCTION public.rpg_insert_game()
    RETURNS TRIGGER 
    SECURITY DEFINER
    SET search_path = public, rpg
    AS $$
    BEGIN
      INSERT INTO rpg.games (
        id, name, master, status, created_at
      ) VALUES (
        NEW.id, NEW.name, NEW.master, NEW.status, COALESCE(NEW.created_at, now())
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER rpg_insert_game_trigger
    INSTEAD OF INSERT ON public.rpg_games
    FOR EACH ROW EXECUTE FUNCTION public.rpg_insert_game();

    CREATE OR REPLACE FUNCTION public.rpg_update_game()
    RETURNS TRIGGER 
    SECURITY DEFINER
    SET search_path = public, rpg
    AS $$
    BEGIN
      UPDATE rpg.games SET
        name = NEW.name,
        master = NEW.master,
        status = NEW.status
      WHERE id = NEW.id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER rpg_update_game_trigger
    INSTEAD OF UPDATE ON public.rpg_games
    FOR EACH ROW EXECUTE FUNCTION public.rpg_update_game();
  END IF;
END $$;
