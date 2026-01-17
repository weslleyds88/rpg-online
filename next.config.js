/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuração para Cloudflare Pages
  // As variáveis NEXT_PUBLIC_* são automaticamente expostas pelo Next.js
  output: 'export',
  // Desabilitar otimizações de imagem que requerem servidor
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

