# Script de Deploy Automatizado - RPG Online
# Execute este script no PowerShell para fazer deploy automático

Write-Host "🚀 Iniciando Deploy do RPG Online..." -ForegroundColor Green

# Verificar se o Git está instalado
try {
    git --version | Out-Null
    Write-Host "✅ Git encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Git não encontrado. Instale o Git primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se o Node.js está instalado
try {
    node --version | Out-Null
    Write-Host "✅ Node.js encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Perguntar se é a primeira vez
$firstTime = Read-Host "É a primeira vez fazendo deploy? (s/n)"
if ($firstTime -eq "s" -or $firstTime -eq "S") {
    Write-Host "📝 Configuração inicial..." -ForegroundColor Yellow
    
    # Inicializar Git
    if (-not (Test-Path ".git")) {
        git init
        Write-Host "✅ Repositório Git inicializado" -ForegroundColor Green
    }
    
    # Perguntar URL do repositório
    $repoUrl = Read-Host "Digite a URL do seu repositório GitHub (ex: https://github.com/usuario/rpg-online.git)"
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "✅ Remote origin configurado" -ForegroundColor Green
    }
}

# Instalar dependências do backend
Write-Host "📦 Instalando dependências do backend..." -ForegroundColor Yellow
Set-Location "backend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências do backend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependências do backend instaladas" -ForegroundColor Green

# Instalar dependências do frontend
Write-Hocation "frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências do frontend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependências do frontend instaladas" -ForegroundColor Green

# Build do frontend
Write-Host "🔨 Fazendo build do frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build do frontend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build do frontend concluído" -ForegroundColor Green

# Voltar para o diretório raiz
Set-Location ".."

# Commit e push
Write-Host "📤 Fazendo commit e push..." -ForegroundColor Yellow
git add .
git commit -m "Deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no push para o GitHub" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Código enviado para o GitHub" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Acesse https://vercel.com e conecte seu repositório"
Write-Host "2. Configure as variáveis de ambiente (veja DEPLOY_GUIDE.md)"
Write-Host "3. Faça deploy do backend primeiro"
Write-Host "4. Depois faça deploy do frontend"
Write-Host "5. Atualize a URL da API no frontend"
Write-Host ""
Write-Host "📖 Consulte o arquivo DEPLOY_GUIDE.md para instruções detalhadas" -ForegroundColor Cyan
