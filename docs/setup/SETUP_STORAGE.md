# Configuração do Storage para Mapas

## 📦 Criar Bucket no Supabase

Para que o upload de mapas funcione, você precisa criar um bucket no Supabase Storage:

### Via Dashboard do Supabase:

1. Acesse o **Storage** no menu lateral
2. Clique em **New bucket**
3. Configure:
   - **Name**: `rpg-maps`
   - **Public bucket**: ✅ Marque como público (para que os mapas sejam acessíveis)
4. Clique em **Create bucket**

### Via SQL (Alternativa):

```sql
-- Criar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('rpg-maps', 'rpg-maps', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload (apenas jogadores do game)
CREATE POLICY "Players can upload maps to their games"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'rpg-maps' AND
  EXISTS (
    SELECT 1 FROM rpg.players p
    WHERE p.game_id::text = (storage.foldername(name))[1]
      AND p.user_id = auth.uid()
  )
);

-- Política para permitir leitura (público)
CREATE POLICY "Public can read maps"
ON storage.objects FOR SELECT
USING (bucket_id = 'rpg-maps');

-- Política para permitir delete (apenas mestre)
CREATE POLICY "Masters can delete maps"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'rpg-maps' AND
  EXISTS (
    SELECT 1 FROM rpg.games g
    WHERE g.id::text = (storage.foldername(name))[1]
      AND g.master = auth.uid()
  )
);
```

## ✅ Verificar

Após criar o bucket, teste fazendo upload de um mapa em uma sala de jogo.
