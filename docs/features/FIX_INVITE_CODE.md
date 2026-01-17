# Como Resolver: Código de Convite Não Aparece

## 🔍 Problema

O código de convite não aparece na página da sala.

## ✅ Soluções

### Opção 1: Executar Migration (Recomendado)

Execute a migration `003_add_invite_codes.sql` no SQL Editor do Supabase.

Esta migration:
- ✅ Adiciona coluna `invite_code` na tabela `rpg.games`
- ✅ Cria função para gerar códigos únicos
- ✅ Cria trigger para gerar código automaticamente
- ✅ Atualiza games existentes sem código

### Opção 2: Gerar Código Manualmente (Temporário)

Se não puder executar a migration agora, você pode gerar códigos manualmente:

```sql
-- Para um game específico
UPDATE rpg.games 
SET invite_code = upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6))
WHERE id = 'seu-game-id-aqui' AND (invite_code IS NULL OR invite_code = '');
```

### Opção 3: O Código Será Gerado Automaticamente

O código agora está sendo gerado automaticamente quando:
- ✅ Você cria um novo game
- ✅ Você visualiza um game sem código

## 🎯 Verificar

Para verificar se o código foi gerado:

```sql
SELECT id, name, invite_code 
FROM rpg.games 
WHERE master = auth.uid();
```

Todos os games devem ter um `invite_code` de 6 caracteres.

## 📝 Nota

Se você criou games antes de executar a migration `003`, eles podem não ter código. O sistema agora gera automaticamente quando você visualiza o game.
