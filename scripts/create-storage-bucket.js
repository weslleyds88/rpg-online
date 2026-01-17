/**
 * Script para criar o bucket de storage 'rpg-maps' no Supabase
 * 
 * Execute: node scripts/create-storage-bucket.js
 * 
 * Requer: Variáveis de ambiente ou edite o arquivo diretamente
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Tentar ler do .env.local
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      const lines = envContent.split('\n')
      
      lines.forEach(line => {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=')
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
          
          if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
            supabaseUrl = value
          } else if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
            supabaseServiceKey = value
          }
        }
      })
    }
  } catch (err) {
    console.warn('Não foi possível ler .env.local automaticamente')
  }
}

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não encontrado no .env.local')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrado no .env.local')
  console.error('   Você precisa da Service Role Key (não a anon key)')
  console.error('   Encontre em: Supabase Dashboard > Settings > API > service_role key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createBucket() {
  console.log('🪣 Criando bucket rpg-maps...')

  // Verificar se o bucket já existe
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.error('❌ Erro ao listar buckets:', listError)
    return
  }

  const bucketExists = buckets?.some(b => b.id === 'rpg-maps')
  
  if (bucketExists) {
    console.log('✅ Bucket rpg-maps já existe!')
    return
  }

  // Criar o bucket
  const { data, error } = await supabase.storage.createBucket('rpg-maps', {
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
  })

  if (error) {
    console.error('❌ Erro ao criar bucket:', error.message)
    console.error('   Detalhes:', error)
    return
  }

  console.log('✅ Bucket rpg-maps criado com sucesso!')
  console.log('   Configurações:')
  console.log('   - Público: Sim')
  console.log('   - Limite de tamanho: 50MB')
  console.log('   - Tipos permitidos: PNG, JPEG, JPG, GIF, WEBP')
}

createBucket()
  .then(() => {
    console.log('\n✨ Pronto! Agora você pode fazer upload de mapas.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Erro inesperado:', err)
    process.exit(1)
  })
