# Como Criar o Bucket de Storage para Mapas

O bucket `rpg-maps` precisa ser criado no Supabase Storage para que o upload de mapas funcione.

**⚠️ Para Supabase Self-Hosted**: Use a **Opção 1 (SQL)** que é a mais direta.

## Opção 1: Via SQL (Recomendado para Self-Hosted)

Execute a migration SQL fornecida:

```bash
# Execute o arquivo no seu banco de dados PostgreSQL
psql -U postgres -d seu_banco < supabase/migrations/011_create_storage_bucket.sql
```

Ou copie e cole o conteúdo do arquivo `supabase/migrations/011_create_storage_bucket.sql` no SQL Editor do seu Supabase.

Esta migration vai:
- ✅ Criar o bucket `rpg-maps`
- ✅ Configurar como público
- ✅ Definir limite de 50MB
- ✅ Permitir apenas imagens (PNG, JPEG, JPG, GIF, WEBP)
- ✅ Criar políticas RLS para controle de acesso

## Opção 2: Via Interface do Supabase (Se disponível)

Se você tiver acesso à interface do Supabase:

1. Acesse o painel do Supabase (Dashboard)
2. Vá em **Storage** no menu lateral
3. Clique em **New bucket**
4. Configure:
   - **Name**: `rpg-maps`
   - **Public bucket**: ✅ Marque como público (para que todos possam ver os mapas)
   - **File size limit**: 50MB (52428800 bytes)
   - **Allowed MIME types**: `image/png,image/jpeg,image/jpg,image/gif,image/webp`
5. Clique em **Create bucket**

## Opção 3: Via SQL Manual (Alternativa)

```sql
-- Criar bucket via SQL (requer permissões de superuser)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rpg-maps',
  'rpg-maps',
  true,
  52428800, -- 50MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
);
```

## Opção 4: Via Script Automático (API)

Se você tiver a Service Role Key configurada, pode usar o script:

```bash
node scripts/create-storage-bucket.js
```

**Requisitos:**
- Ter `NEXT_PUBLIC_SUPABASE_URL` no `.env.local`
- Ter `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` (não é a anon key!)

**Onde encontrar a Service Role Key (Self-Hosted):**
- Geralmente está no arquivo de configuração do Supabase (`.env` ou `config.toml`)
- Procure por `SERVICE_ROLE_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ NÃO compartilhe esta chave!

O script vai:
- Verificar se o bucket já existe
- Criar o bucket com as configurações corretas
- Configurar como público
- Definir limite de 50MB
- Permitir apenas imagens (PNG, JPEG, JPG, GIF, WEBP)

## ✅ Verificar se Funcionou

Após executar a migration ou criar o bucket, teste fazendo upload de um mapa em uma sala de jogo.

Se ainda der erro, verifique:
1. Se o bucket foi criado: `SELECT * FROM storage.buckets WHERE id = 'rpg-maps';`
2. Se as políticas foram criadas: `SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';`
3. Se o Storage está habilitado no seu Supabase self-hosted

## 📝 Notas Importantes

- **Self-Hosted**: A migration SQL (`011_create_storage_bucket.sql`) é a forma mais confiável
- **Políticas RLS**: A migration já cria todas as políticas necessárias automaticamente
- **Bucket Público**: O bucket é configurado como público para facilitar o acesso aos mapas
- **Limite de Tamanho**: 50MB por arquivo (pode ser ajustado na migration se necessário)
