/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Desabilitar otimizações de imagem que requerem servidor
  images: {
    unoptimized: true,
  },
  // Desabilitar trailing slash para compatibilidade
  trailingSlash: false,
  // Desabilitar cache do webpack durante o build para evitar arquivos grandes no Cloudflare Pages
  webpack: (config, { isServer }) => {
    if (process.env.NODE_ENV === 'production') {
      // Desabilitar cache do webpack em produção para evitar arquivos grandes
      config.cache = false
    }
    return config
  },
}

module.exports = nextConfig

