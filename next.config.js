/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuração para Cloudflare Pages usando @cloudflare/next-on-pages
  // Não usar output: 'export' pois precisamos de rotas dinâmicas
  // Desabilitar otimizações de imagem que requerem servidor
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

