# Configuração do Supabase Self-Hosted

## 🔑 Como Obter as Chaves de API

No Supabase self-hosted, as chaves ficam em locais diferentes dependendo de como você instalou. Aqui estão as formas mais comuns:

### Método 1: Via Dashboard do Supabase (Recomendado)

1. **Acesse o Dashboard do Supabase na sua VM:**
   - Geralmente em: `http://seu-ip-vm:3000` ou `http://localhost:3000`
   - Ou o domínio que você configurou

2. **Navegue até Settings > API:**
   - No menu lateral, clique em **Settings** (⚙️)
   - Depois clique em **API**

3. **Copie as informações:**
   - **Project URL**: `http://seu-ip-vm:8000` (ou a porta do PostgREST)
   - **anon/public key**: A chave pública (anon key)

### Método 2: Via Arquivo de Configuração

Se você instalou via Docker Compose, as chaves estão no arquivo `.env`:

```bash
# Na sua VM, navegue até o diretório do Supabase
cd /caminho/do/supabase

# Procure pelo arquivo .env ou docker-compose.yml
cat .env | grep -i "anon\|jwt\|secret"
```

Procure por variáveis como:
- `ANON_KEY` ou `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `POSTGRES_PASSWORD`

### Método 3: Via Variáveis de Ambiente do Docker

Se está rodando via Docker:

```bash
# Listar containers do Supabase
docker ps | grep supabase

# Ver variáveis de ambiente de um container específico
docker exec -it <container_id> env | grep -i "anon\|jwt\|secret"
```

### Método 4: Via SQL (Consultar no Banco)

Você pode consultar as chaves diretamente no banco:

```sql
-- Conectar ao banco PostgreSQL do Supabase
-- E executar:

SELECT 
  name,
  setting 
FROM pg_settings 
WHERE name LIKE '%jwt%' OR name LIKE '%secret%';
```

## 📝 Configurar o .env.local

Depois de obter as informações, crie o arquivo `.env.local` na raiz do projeto:

```env
# URL do Supabase (PostgREST API)
# Geralmente: http://seu-ip-vm:8000
# Ou: http://localhost:8000 se estiver na mesma máquina
NEXT_PUBLIC_SUPABASE_URL=http://seu-ip-vm:8000

# Anon Key (chave pública)
# Esta é a chave que você encontrou no dashboard ou no .env
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

## 🌐 Exemplos de URLs

Dependendo da sua configuração:

### Se Supabase está na mesma máquina:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
```

### Se Supabase está na VM (acesso local):
```env
NEXT_PUBLIC_SUPABASE_URL=http://192.168.1.100:8000
```

### Se Supabase está na VM (acesso externo):
```env
NEXT_PUBLIC_SUPABASE_URL=http://seu-dominio.com:8000
```

## ⚠️ Importante

1. **Porta do PostgREST**: Geralmente é `8000`, mas pode variar. Verifique no seu `docker-compose.yml` ou configuração.

2. **CORS**: Se estiver acessando de outra máquina, certifique-se de que o CORS está configurado no Supabase para permitir requisições do seu frontend.

3. **HTTPS**: Se possível, use HTTPS em produção. Para desenvolvimento local, HTTP está ok.

## 🔍 Verificar se está Funcionando

Depois de configurar, teste:

```bash
# No terminal do seu projeto
npm run dev
```

Se der erro de conexão, verifique:
- ✅ O Supabase está rodando na VM?
- ✅ A porta está correta?
- ✅ O firewall permite conexões na porta?
- ✅ A URL está acessível do seu computador?

## 🐛 Troubleshooting

### Erro: "Failed to fetch" ou "Network error"
- Verifique se a URL está correta
- Verifique se o Supabase está rodando
- Verifique se a porta está aberta no firewall

### Erro: "Invalid API key"
- Verifique se copiou a chave completa (sem espaços)
- Verifique se está usando a `anon key`, não a `service_role key`

### Erro: "CORS policy"
- Configure o CORS no Supabase para permitir seu domínio
- Ou use um proxy durante desenvolvimento

## 📚 Recursos

- [Documentação Supabase Self-Hosted](https://supabase.com/docs/guides/self-hosting)
- [Configuração de CORS](https://supabase.com/docs/guides/api/api-cors)
