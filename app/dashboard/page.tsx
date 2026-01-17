'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useCharacters } from '@/hooks/useCharacters'
import { useGames } from '@/hooks/useGames'
import { deleteGame } from '@/services/gameService'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const { user, signOut, loading: authLoading } = useAuth()
  
  const { characters, loading: charactersLoading, error } = useCharacters()
  const { games, loading: gamesLoading, removeGame } = useGames()
  
  const [gameToDelete, setGameToDelete] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showGameMenu, setShowGameMenu] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const handleDeleteGame = async (gameId: string) => {
    try {
      await removeGame(gameId)
      setShowDeleteModal(false)
      setGameToDelete(null)
    } catch (err) {
      console.error('Erro ao deletar sala:', err)
      alert('Erro ao deletar sala')
    }
  }

  const copyInviteCode = (code: string | null) => {
    if (!code) return
    navigator.clipboard.writeText(code)
    alert('Código copiado!')
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white">Carregando...</h1>
        </div>
      </div>
    )
  }

  if (!user && !authLoading) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">🎲 RPG de Mesa Online</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                Olá, <span className="font-medium text-white">{user?.email}</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seção de Personagens */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Meus Personagens</h2>
            <Link
              href="/dashboard/characters/new"
              className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-500/50"
            >
              + Criar Novo Personagem
            </Link>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-4">
              {error.message}
            </div>
          )}

          {charactersLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando personagens...</p>
            </div>
          ) : characters.length === 0 ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
              <div className="text-6xl mb-4">⚔️</div>
              <h3 className="text-xl font-semibold text-white mb-2">Nenhum personagem criado</h3>
              <p className="text-gray-400 mb-6">Crie seu primeiro personagem para começar a jogar!</p>
              <Link
                href="/dashboard/characters/new"
                className="inline-block px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all hover:shadow-lg"
              >
                Criar Primeiro Personagem
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {characters.map((character) => (
                <Link
                  key={character.id}
                  href={`/dashboard/characters/${character.id}`}
                  className="group bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {character.name}
                    </h3>
                    <div className="px-2 py-1 bg-indigo-900/30 text-indigo-300 text-xs rounded">
                      Nv. {character.level}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-400">
                      <span className="font-medium mr-2">Classe:</span>
                      <span className="text-white">{character.class || 'Sem classe'}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <span className="font-medium mr-2">Raça:</span>
                      <span className="text-white">
                        {character.stats && typeof character.stats === 'object' && !Array.isArray(character.stats) && character.stats.race
                          ? String(character.stats.race)
                          : 'Sem raça'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 pt-2 border-t border-gray-800">
                      <div className="flex items-center">
                        <span className="text-red-400 font-bold mr-1">❤️</span>
                        <span className="text-white font-medium">{character.hp}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-blue-400 font-bold mr-1">💙</span>
                        <span className="text-white font-medium">{character.mp}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Seção de Salas (Games) */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Minhas Salas de Jogo</h2>
            <div className="flex space-x-3">
              <Link
                href="/dashboard/games/join"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all hover:shadow-lg hover:shadow-green-500/50"
              >
                Entrar por Código
              </Link>
              <Link
                href="/dashboard/games/new"
                className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-500/50"
              >
                + Nova Sala
              </Link>
            </div>
          </div>

          {gamesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando salas...</p>
            </div>
          ) : games.length === 0 ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold text-white mb-2">Nenhuma sala encontrada</h3>
              <p className="text-gray-400 mb-6">Crie uma nova sala ou entre em uma existente!</p>
              <Link
                href="/dashboard/games/new"
                className="inline-block px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all hover:shadow-lg"
              >
                Criar Primeira Sala
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="group bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {game.name}
                        </h3>
                        {game.userRole === 'master' && (
                          <span className="px-2 py-1 bg-yellow-900/30 text-yellow-300 text-xs font-medium rounded flex items-center gap-1">
                            👑 Mestre
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded ${
                          game.status === 'open' 
                            ? 'bg-green-900/30 text-green-300' 
                            : game.status === 'running'
                            ? 'bg-blue-900/30 text-blue-300'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {game.status === 'open' ? '🟢 Aberta' :
                           game.status === 'running' ? '🔵 Em andamento' :
                           '⚫ Finalizada'}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setShowGameMenu(showGameMenu === game.id ? null : game.id)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        title="Menu"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      {showGameMenu === game.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowGameMenu(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
                            <button
                              onClick={() => {
                                copyInviteCode(game.invite_code)
                                setShowGameMenu(null)
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                              📋 Copiar código
                            </button>
                            {game.userRole === 'master' && (
                              <button
                                onClick={() => {
                                  setGameToDelete(game.id)
                                  setShowDeleteModal(true)
                                  setShowGameMenu(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors flex items-center gap-2"
                              >
                                🗑️ Excluir sala
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-400 mb-4">
                    <p>Criada em {new Date(game.created_at).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}</p>
                  </div>

                  <Link
                    href={`/dashboard/games/${game.id}`}
                    className="block w-full px-4 py-3 text-center text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all"
                  >
                    Entrar na Sala
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && gameToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-400 mb-6">
              Tem certeza que deseja excluir esta sala? Esta ação não pode ser desfeita.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setGameToDelete(null)
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteGame(gameToDelete)}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
