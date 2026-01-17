/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export para Cloudflare Pages (similar ao Create React App)
  output: 'export',
  // Desabilitar otimizações de imagem que requerem servidor
  images: {
    unoptimized: true,
  },
  // Desabilitar trailing slash para compatibilidade
  trailingSlash: false,
}

module.exports = nextConfig

