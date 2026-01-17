import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RPG de Mesa Online',
  description: 'Sistema de RPG de mesa online multiplayer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}

