# Exemplos de Requests da API

Este arquivo contém exemplos de como usar a API do RPG Online.

## Base URL
```
http://localhost:4000
```

## 1. Criar Personagem

```bash
curl -X POST http://localhost:4000/players \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Aragorn",
    "classe": "guerreiro"
  }'
```

## 2. Listar Personagens

```bash
curl -X GET http://localhost:4000/players
```

## 3. Obter Detalhes de um Personagem

```bash
curl -X GET http://localhost:4000/players/1
```

## 4. Adicionar Experiência

```bash
curl -X POST http://localhost:4000/players/1/experience \
  -H "Content-Type: application/json" \
  -d '{
    "xp": 100
  }'
```

## 5. Criar Item

```bash
curl -X POST http://localhost:4000/items \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Espada Longa",
    "tipo": "arma",
    "raridade": "comum",
    "efeito": {
      "dano": "1d8+3",
      "tipo": "corte"
    }
  }'
```

## 6. Listar Itens

```bash
curl -X GET http://localhost:4000/items
```

## 7. Criar Quest

```bash
curl -X POST http://localhost:4000/quests \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "A Jornada Inicial",
    "descricao": "Um aventureiro novato deve provar seu valor enfrentando goblins na floresta próxima.",
    "recompensa_xp": 100,
    "recompensa_item": 1
  }'
```

## 8. Aceitar Quest

```bash
curl -X POST http://localhost:4000/quests/1/accept \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": 1
  }'
```

## 9. Completar Quest

```bash
curl -X POST http://localhost:4000/quests/1/complete \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": 1
  }'
```

## 10. Adicionar Item ao Inventário

```bash
curl -X POST http://localhost:4000/inventory/1/add \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": 1,
    "quantidade": 1
  }'
```

## 11. Ver Inventário

```bash
curl -X GET http://localhost:4000/inventory/1
```

## 12. Usar Item

```bash
curl -X POST http://localhost:4000/inventory/1/1/use
```

## 13. Rolar Dados

```bash
curl -X POST http://localhost:4000/actions/roll \
  -H "Content-Type: application/json" \
  -d '{
    "dice": "2d6+3"
  }'
```

## 14. Teste de Habilidade

```bash
curl -X POST http://localhost:4000/actions/ability-check \
  -H "Content-Type: application/json" \
  -d '{
    "modifier": 2,
    "difficulty": 15
  }'
```

## 15. Ataque

```bash
curl -X POST http://localhost:4000/actions/attack \
  -H "Content-Type: application/json" \
  -d '{
    "attackBonus": 5,
    "armorClass": 14,
    "damageDice": "1d8+3"
  }'
```

## 16. Iniciativa

```bash
curl -X POST http://localhost:4000/actions/initiative \
  -H "Content-Type: application/json" \
  -d '{
    "modifier": 2
  }'
```

## 17. Aplicar Dano

```bash
curl -X POST http://localhost:4000/actions/players/1/damage \
  -H "Content-Type: application/json" \
  -d '{
    "damage": 10
  }'
```

## 18. Aplicar Cura

```bash
curl -X POST http://localhost:4000/actions/players/1/healing \
  -H "Content-Type: application/json" \
  -d '{
    "healing": 15
  }'
```

## 19. Criar Evento (Admin)

```bash
curl -X POST http://localhost:4000/admin/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer troque_por_um_token_secreto" \
  -d '{
    "titulo": "Festival da Lua Cheia",
    "descricao": "Um festival especial acontece durante a lua cheia, com bônus de experiência para todos os aventureiros.",
    "data_inicio": "2024-01-01T00:00:00Z",
    "data_fim": "2024-01-07T23:59:59Z",
    "criado_por": "admin"
  }'
```

## 20. Listar Eventos (Admin)

```bash
curl -X GET http://localhost:4000/admin/events \
  -H "Authorization: Bearer troque_por_um_token_secreto"
```

## 21. Estatísticas do Sistema (Admin)

```bash
curl -X GET http://localhost:4000/admin/stats \
  -H "Authorization: Bearer troque_por_um_token_secreto"
```

## 22. Health Check

```bash
curl -X GET http://localhost:4000/health
```

## 23. Documentação da API

```bash
curl -X GET http://localhost:4000/docs
```

## Exemplos de Respostas

### Resposta de Sucesso
```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso!"
}
```

### Resposta de Erro
```json
{
  "success": false,
  "message": "Erro na operação"
}
```

### Resposta de Rolagem de Dados
```json
{
  "success": true,
  "data": {
    "diceString": "2d6+3",
    "rolls": [4, 5],
    "sum": 9,
    "modifier": 3,
    "total": 12,
    "breakdown": "4 + 5 + 3 = 12"
  },
  "message": "Rolagem: 4 + 5 + 3 = 12"
}
```

### Resposta de Teste de Habilidade
```json
{
  "success": true,
  "data": {
    "roll": 15,
    "modifier": 2,
    "total": 17,
    "difficulty": 15,
    "success": true,
    "criticalSuccess": false,
    "criticalFailure": false,
    "result": "Sucesso"
  },
  "message": "Teste de habilidade: 15 + 2 = 17 (DC 15) - Sucesso"
}
```

## Notas Importantes

1. **Token de Admin**: Para rotas administrativas, use o header `Authorization: Bearer troque_por_um_token_secreto`

2. **Content-Type**: Sempre use `application/json` para requests POST/PUT

3. **IDs**: Os IDs são numéricos e começam em 1

4. **Datas**: Use formato ISO 8601 para datas (ex: `2024-01-01T00:00:00Z`)

5. **Efeitos de Itens**: Use JSON válido para o campo `efeito` dos itens

6. **Dados**: Use o formato `XdY+Z` para rolagem de dados (ex: `2d6+3`)

## Testando com Postman

1. Importe as requests acima no Postman
2. Configure a variável de ambiente `base_url` como `http://localhost:4000`
3. Configure a variável `admin_token` como `troque_por_um_token_secreto`
4. Execute as requests na ordem sugerida
