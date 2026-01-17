import GamePageClient from './GamePageClient'

// Necessário para output: 'export' - rotas serão geradas dinamicamente no cliente
export function generateStaticParams() {
  return []
}

export const dynamicParams = true

export default function GamePage() {
  return <GamePageClient />
}
