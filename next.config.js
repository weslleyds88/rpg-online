/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Desabilitar otimizações de imagem que requerem servidor
  images: {
    unoptimized: true,
  },
  // Desabilitar trailing slash para compatibilidade
  trailingSlash: false,
}

module.exports = nextConfig

