import CharacterPageClient from './CharacterPageClient'

// Necessário para output: 'export' - rotas serão geradas dinamicamente no cliente
export async function generateStaticParams() {
  return []
}

export const dynamicParams = true

export default function CharacterPage() {
  return <CharacterPageClient />
}
