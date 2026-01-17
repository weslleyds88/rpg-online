-- Migration: Corrigir permissões da view rpg_characters
-- Esta migration restaura as permissões que foram perdidas ao recriar a view

-- Garantir permissões na view rpg_characters
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rpg_characters TO anon, authenticated;

-- Verificar se os triggers ainda existem e têm as permissões corretas
-- (Os triggers já devem estar criados pela migration 020)
