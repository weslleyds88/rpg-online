#!/bin/bash

# Script para encontrar as chaves do Supabase Self-Hosted
# Execute este script na sua VM onde o Supabase está rodando

echo "🔍 Procurando chaves do Supabase..."
echo ""

# Método 1: Procurar em arquivos .env
echo "📁 Procurando em arquivos .env..."
if [ -f ".env" ]; then
    echo "Encontrado .env:"
    grep -i "anon\|jwt\|secret" .env | grep -v "PASSWORD\|password" || echo "Nenhuma chave encontrada no .env"
fi

# Método 2: Procurar em docker-compose.yml
echo ""
echo "🐳 Procurando em docker-compose.yml..."
if [ -f "docker-compose.yml" ]; then
    echo "Encontrado docker-compose.yml:"
    grep -i "anon\|jwt\|secret" docker-compose.yml | grep -v "PASSWORD\|password" || echo "Nenhuma chave encontrada no docker-compose.yml"
fi

# Método 3: Verificar containers Docker
echo ""
echo "🔎 Verificando containers Docker..."
if command -v docker &> /dev/null; then
    SUPABASE_CONTAINER=$(docker ps | grep -i supabase | head -1 | awk '{print $1}')
    if [ ! -z "$SUPABASE_CONTAINER" ]; then
        echo "Container encontrado: $SUPABASE_CONTAINER"
        echo "Variáveis de ambiente:"
        docker exec $SUPABASE_CONTAINER env | grep -i "anon\|jwt\|secret" | grep -v "PASSWORD\|password" || echo "Nenhuma chave encontrada"
    else
        echo "Nenhum container Supabase encontrado rodando"
    fi
else
    echo "Docker não encontrado"
fi

# Método 4: Verificar porta do PostgREST
echo ""
echo "🌐 Verificando porta do PostgREST..."
if command -v netstat &> /dev/null; then
    netstat -tuln | grep -E ":(8000|3000|5432)" || echo "Portas não encontradas"
elif command -v ss &> /dev/null; then
    ss -tuln | grep -E ":(8000|3000|5432)" || echo "Portas não encontradas"
fi

echo ""
echo "✅ Dica: Acesse o dashboard do Supabase em:"
echo "   http://localhost:3000 ou http://seu-ip:3000"
echo "   E vá em Settings > API para ver as chaves"
