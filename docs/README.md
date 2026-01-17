# Documentação do Projeto

Esta pasta contém toda a documentação do projeto RPG de Mesa Online, organizada por categoria.

## 📁 Estrutura

### 📘 Setup
Guia de configuração e instalação do projeto:
- `ABLY_SETUP.md` - Configuração do Ably para chat em tempo real
- `SETUP.md` - Guia de configuração inicial do projeto
- `SETUP_STORAGE.md` - Configuração do Supabase Storage para uploads
- `SUPABASE_SELF_HOSTED_SETUP.md` - Configuração do Supabase self-hosted

### 🏗️ Architecture
Documentação de arquitetura e design do sistema:
- `ARCHITECTURE.md` - Visão geral da arquitetura do projeto
- `DATABASE_ISOLATION.md` - Explicação sobre isolamento do schema `rpg`

### ✨ Features
Documentação de funcionalidades implementadas e planejadas:
- `FEATURES_IMPLEMENTED.md` - Lista de funcionalidades já implementadas
- `FUTURE_IMPROVEMENTS.md` - Melhorias e features planejadas para o futuro
- `FIX_INVITE_CODE.md` - Documentação sobre o sistema de códigos de convite

### 🔧 Troubleshooting
Guias para resolver problemas comuns:
- `QUICK_FIX_400_ERROR.md` - Solução rápida para erros 400
- `TROUBLESHOOTING_403.md` - Solução para erros de permissão (403)

## 🚀 Início Rápido

Para começar a usar o projeto, comece pelos guias em `setup/`:
1. Leia `SETUP.md` para configuração básica
2. Se usar Supabase self-hosted, veja `SUPABASE_SELF_HOSTED_SETUP.md`
3. Para configurar o chat em tempo real, veja `ABLY_SETUP.md`

## 📚 Mais Informações

Para detalhes sobre a estrutura do código e banco de dados, consulte:
- `architecture/ARCHITECTURE.md` - Arquitetura geral
- `architecture/DATABASE_ISOLATION.md` - Estrutura do banco de dados
- `../supabase/migrations/README.md` - Guia de migrations
