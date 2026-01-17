# Configuração do Ably

O Ably foi integrado ao projeto para fornecer comunicação em tempo real para o chat, substituindo o Realtime do Supabase que não estava funcionando no ambiente self-hosted.

## Como obter a API Key do Ably

1. Acesse [https://ably.com](https://ably.com) e faça login na sua conta
2. Vá para o **Dashboard** da sua conta
3. Clique em **"Create New App"** ou selecione um app existente
4. Na página do app, vá para a aba **"API Keys"**
5. Você verá uma lista de API Keys. Se não houver nenhuma, clique em **"Create API Key"**
6. Copie a **API Key** (ela começa com algo como `xxxxx.xxxxx:xxxxxxxxxxxxx`)

## Configuração no Projeto

1. Abra o arquivo `.env.local` na raiz do projeto
2. Adicione a seguinte linha:

```env
NEXT_PUBLIC_ABLY_API_KEY=sua-api-key-aqui
```

**Exemplo:**
```env
NEXT_PUBLIC_ABLY_API_KEY=abc123.def456:ghijklmnopqrstuvwxyz
```

3. Salve o arquivo
4. Reinicie o servidor de desenvolvimento (`npm run dev`)

## Como Funciona

- **Envio de Mensagens**: Quando uma mensagem é enviada, ela é salva no Supabase (banco de dados) e também publicada no Ably
- **Recebimento em Tempo Real**: Outros clientes conectados recebem a notificação via Ably instantaneamente
- **Fallback**: Se o Ably não estiver configurado ou falhar, o sistema usa polling (verificação periódica) como fallback

## Limites do Plano Gratuito

O plano gratuito do Ably oferece:
- **3 milhões de mensagens por mês**
- **200 conexões simultâneas**
- **100 canais simultâneos**

Isso é mais que suficiente para a maioria dos projetos RPG!

## Troubleshooting

### Mensagens não aparecem em tempo real

1. Verifique se a `NEXT_PUBLIC_ABLY_API_KEY` está configurada corretamente no `.env.local`
2. Verifique se reiniciou o servidor após adicionar a variável
3. Abra o console do navegador e verifique se há erros relacionados ao Ably
4. Verifique se a API Key está ativa no dashboard do Ably

### Erro: "NEXT_PUBLIC_ABLY_API_KEY não configurada"

- Certifique-se de que a variável está no arquivo `.env.local` (não `.env`)
- Certifique-se de que o nome da variável está correto: `NEXT_PUBLIC_ABLY_API_KEY`
- Reinicie o servidor após adicionar a variável

### O chat ainda usa polling

- Isso é normal! O sistema usa Ably como principal, mas mantém polling como fallback
- Se o Ably estiver funcionando, você verá mensagens instantaneamente
- O polling só será usado se o Ably falhar

## Estrutura Técnica

- **`lib/ably/client.ts`**: Cliente Ably singleton
- **`services/chatService.ts`**: Integração do Ably com o chat
- **`hooks/useChat.ts`**: Hook React que usa o Ably para atualizações em tempo real

## Próximos Passos

Após configurar o Ably, o chat deve funcionar em tempo real sem necessidade de atualizar a página. Teste enviando mensagens de diferentes navegadores/abas para verificar a sincronização em tempo real.
