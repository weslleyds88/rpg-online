# API de Salas e Mapas - Exemplos de Uso

## 🏰 Salas de Jogo

### Criar Sala
```bash
curl -X POST http://localhost:4000/rooms/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aventura Épica",
    "description": "Uma aventura para iniciantes",
    "maxPlayers": 4,
    "isPrivate": false,
    "playerId": 1
  }'
```

### Listar Salas Públicas
```bash
curl -X GET http://localhost:4000/rooms/list
```

### Entrar em Sala
```bash
curl -X POST http://localhost:4000/rooms/join \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 1,
    "playerId": 2,
    "password": "senha123"
  }'
```

### Obter Detalhes da Sala
```bash
curl -X GET http://localhost:4000/rooms/1
```

### Sair da Sala
```bash
curl -X POST http://localhost:4000/rooms/leave \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 1,
    "playerId": 2
  }'
```

## 🗺️ Sistema de Mapas

### Enviar Mapa
```bash
curl -X POST http://localhost:4000/maps/upload \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 1,
    "name": "Floresta Sombria",
    "description": "Uma floresta perigosa",
    "mapData": {
      "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "width": 800,
      "height": 600,
      "gridSize": 50
    }
  }'
```

### Obter Mapa Ativo
```bash
curl -X GET http://localhost:4000/maps/room/1/active
```

### Listar Mapas da Sala
```bash
curl -X GET http://localhost:4000/maps/room/1/list
```

### Definir Mapa Ativo
```bash
curl -X POST http://localhost:4000/maps/set-active \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 1,
    "mapId": 1
  }'
```

## 🎯 Tokens no Mapa

### Adicionar Token
```bash
curl -X POST http://localhost:4000/maps/tokens/add \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 1,
    "mapId": 1,
    "tokenData": {
      "name": "Guerreiro",
      "x": 100,
      "y": 150,
      "color": "red",
      "size": 30
    }
  }'
```

### Obter Tokens do Mapa
```bash
curl -X GET http://localhost:4000/maps/tokens/1
```

### Atualizar Token
```bash
curl -X PUT http://localhost:4000/maps/tokens/update \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": 1,
    "tokenData": {
      "name": "Guerreiro",
      "x": 200,
      "y": 250,
      "color": "red",
      "size": 30
    }
  }'
```

### Remover Token
```bash
curl -X DELETE http://localhost:4000/maps/tokens/1
```

## 🔐 Autenticação Admin

### Criar Evento (com senha)
```bash
curl -X POST http://localhost:4000/admin/events \
  -H "Content-Type: application/json" \
  -d '{
    "password": "159357We*",
    "titulo": "Evento Especial",
    "descricao": "Um evento épico",
    "data_inicio": "2024-01-01T00:00:00Z",
    "data_fim": "2024-01-31T23:59:59Z",
    "criado_por": "admin"
  }'
```

## 📊 Estrutura de Dados

### Sala
```json
{
  "id": 1,
  "name": "Aventura Épica",
  "description": "Uma aventura para iniciantes",
  "maxPlayers": 4,
  "currentPlayers": 2,
  "isPrivate": false,
  "createdBy": "João",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

### Mapa
```json
{
  "id": 1,
  "name": "Floresta Sombria",
  "description": "Uma floresta perigosa",
  "mapData": {
    "image": "data:image/png;base64,...",
    "width": 800,
    "height": 600,
    "gridSize": 50
  },
  "isActive": true,
  "createdAt": "2024-01-01T10:00:00Z"
}
```

### Token
```json
{
  "id": 1,
  "tokenData": {
    "name": "Guerreiro",
    "x": 100,
    "y": 150,
    "color": "red",
    "size": 30
  },
  "createdAt": "2024-01-01T10:00:00Z"
}
```

## 🚀 Como Jogar Online

1. **Criar Personagem**: Use `/create-player` para criar seu personagem
2. **Criar Sala**: Use `/rooms` para criar uma nova sala de jogo
3. **Convidar Amigos**: Compartilhe o link da sala ou use salas públicas
4. **Enviar Mapa**: O mestre pode enviar mapas para a aventura
5. **Adicionar Tokens**: Coloque tokens dos personagens no mapa
6. **Jogar**: Use o sistema de dados integrado para as ações

## 🔧 Configurações

- **Senha Admin**: `159357We*`
- **Porta Backend**: `4000`
- **Porta Frontend**: `3000`
- **Banco**: PostgreSQL no Supabase
