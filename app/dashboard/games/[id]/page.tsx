'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getGameById } from '@/services/gameService'
import { getGamePlayers, addPlayerToGame, removePlayerFromGame, updatePlayerRole } from '@/services/playerService'
import { getGameMaps } from '@/services/mapService'
import { getCharacterById } from '@/services/characterService'
import { useChat } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'
import type { Game, Player, Map as GameMap, Character } from '@/lib/supabase/types'
import Link from 'next/link'
import Notifications from '@/components/Notifications'
import CharacterSelector from '@/components/CharacterSelector'
import CharacterSheet from '@/components/CharacterSheet'
import LevelUpModal from '@/components/LevelUpModal'
import GameHeader from '@/components/GameHeader'
import GameSidebar from '@/components/GameSidebar'
import MapContainer from '@/components/MapContainer'
import MasterCombatConfirmation from '@/components/MasterCombatConfirmation'
import MasterStatusPanel from '@/components/MasterStatusPanel'
import { updatePlayerCharacter } from '@/services/playerService'
import { deleteGame } from '@/services/gameService'

// Necessário para static export com rotas dinâmicas
export function generateStaticParams() {
  // Retorna array vazio - as páginas serão geradas dinamicamente no cliente
  return []
}

export const dynamicParams = true

export default function GamePage() {
  const router = useRouter()
  const params = useParams()
  const gameId = params.id as string
  const { user } = useAuth()
  const { messages, loading: chatLoading, error: chatError } = useChat(gameId)

  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [maps, setMaps] = useState<GameMap[]>([])
  const [myCharacter, setMyCharacter] = useState<Character | null>(null)
  const [playerCharacters, setPlayerCharacters] = useState<Map<string, Character>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMaster, setIsMaster] = useState(false)
  const [showCharacterSelector, setShowCharacterSelector] = useState(false)
  const [viewingCharacterId, setViewingCharacterId] = useState<string | null>(null)
  const [levelUpCharacter, setLevelUpCharacter] = useState<{ character: Character; newLevel: number } | null>(null)

  useEffect(() => {
    loadGame()
    loadPlayers()
    loadMaps()
  }, [gameId])

  // Memoizar verificação do player atual para evitar re-renders
  const currentPlayer = useMemo(() => {
    return players.find(p => p.user_id === user?.id)
  }, [players, user?.id])

  useEffect(() => {
    if (currentPlayer && !currentPlayer.character_id && !isMaster && !showCharacterSelector) {
      setShowCharacterSelector(true)
    }
  }, [currentPlayer?.character_id, isMaster, showCharacterSelector])

  useEffect(() => {
    if (game && user) {
      setIsMaster(game.master === user.id)
    }
  }, [game, user])

  // Listener para level up
  useEffect(() => {
    const handleLevelUp = async (e: Event) => {
      const customEvent = e as CustomEvent<{ characterId: string; newLevel: number }>
      const { characterId, newLevel } = customEvent.detail

      console.log('🎉 Evento de level up recebido:', { characterId, newLevel })
      console.log('🎉 myCharacter atual:', myCharacter?.id)
      console.log('🎉 currentPlayer character_id:', currentPlayer?.character_id)
      console.log('🎉 user?.id:', user?.id)

      if (!user?.id) {
        console.log('⚠️ Usuário não autenticado, ignorando')
        return
      }

      // Verificar se é o character do jogador atual
      // Primeiro tenta pelo myCharacter, depois pelo currentPlayer, depois busca na lista de players
      let isMyCharacter = false
      
      if (myCharacter?.id === characterId) {
        isMyCharacter = true
        console.log('✅ Match por myCharacter')
      } else if (currentPlayer?.character_id === characterId) {
        isMyCharacter = true
        console.log('✅ Match por currentPlayer.character_id')
      } else {
        // Buscar o player atual na lista de players
        const player = players.find(p => p.user_id === user.id)
        console.log('🔍 Player encontrado na lista:', player)
        if (player?.character_id === characterId) {
          isMyCharacter = true
          console.log('✅ Match por busca direta do player na lista')
        } else {
          // Última tentativa: recarregar players e verificar novamente
          console.log('🔍 Recarregando players para verificar...')
          try {
            const { supabase } = await import('@/lib/supabase/client')
            const { data: updatedPlayers } = await supabase
              .from('rpg_players')
              .select('*')
              .eq('game_id', gameId)
            
            if (updatedPlayers) {
              const player = updatedPlayers.find(p => p.user_id === user.id)
              console.log('🔍 Player após recarregar:', player)
              if (player?.character_id === characterId) {
                isMyCharacter = true
                console.log('✅ Match após recarregar players')
              }
            }
          } catch (err) {
            console.error('❌ Erro ao recarregar players:', err)
          }
        }
      }

      // Verificação final: verificar se o character pertence ao usuário atual
      if (!isMyCharacter) {
        try {
          const { supabase } = await import('@/lib/supabase/client')
          const { data: character } = await supabase
            .from('rpg_characters')
            .select('owner')
            .eq('id', characterId)
            .single()
          
          if (character && character.owner === user.id) {
            isMyCharacter = true
            console.log('✅ Match por verificação de owner do character')
          }
        } catch (err) {
          console.error('❌ Erro ao verificar owner do character:', err)
        }
      }

      if (isMyCharacter) {
        console.log('✅ É o character do jogador atual! Abrindo modal...')
        // Recarregar character para ter dados atualizados
        try {
          const updatedCharacter = await getCharacterById(characterId)
          console.log('✅ Character recarregado:', updatedCharacter)
          setLevelUpCharacter({ character: updatedCharacter, newLevel })
        } catch (err) {
          console.error('❌ Erro ao carregar character para level up:', err)
        }
      } else {
        console.log('⚠️ Não é o character do jogador atual, ignorando')
        console.log('⚠️ Detalhes:', {
          characterId,
          myCharacterId: myCharacter?.id,
          currentPlayerCharacterId: currentPlayer?.character_id,
          players: players.map(p => ({ userId: p.user_id, characterId: p.character_id }))
        })
      }
    }

    window.addEventListener('character-leveled-up', handleLevelUp)
    return () => {
      window.removeEventListener('character-leveled-up', handleLevelUp)
    }
  }, [myCharacter, currentPlayer, user?.id, players, gameId])

  const loadGame = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getGameById(gameId)
      setGame(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar game')
    } finally {
      setLoading(false)
    }
  }

  const loadPlayers = async () => {
    try {
      const data = await getGamePlayers(gameId)
      setPlayers(data)
    } catch (err) {
      console.error('Erro ao carregar players:', err)
    }
  }

  const loadMaps = async () => {
    try {
      const data = await getGameMaps(gameId)
      setMaps(data)
    } catch (err) {
      console.error('Erro ao carregar mapas:', err)
    }
  }

  const loadPlayerCharacters = useCallback(async () => {
    if (!user || !game) return

    const charactersMap = new Map<string, Character>()
    
    // Buscar personagem do jogador atual (usar o memoizado se disponível)
    const player = currentPlayer || players.find(p => p.user_id === user.id)
    if (player?.character_id) {
      try {
        const char = await getCharacterById(player.character_id)
        setMyCharacter(char)
        charactersMap.set(user.id, char) // Adicionar também no map para o mestre ver
      } catch (err) {
        console.error('Erro ao carregar personagem:', err)
      }
    } else {
      setMyCharacter(null) // Limpar se não tiver personagem
    }

    // Se for mestre, buscar personagens de todos os jogadores
    if (game.master === user.id) {
      for (const p of players) {
        if (p.character_id && !charactersMap.has(p.user_id)) {
          try {
            const char = await getCharacterById(p.character_id)
            charactersMap.set(p.user_id, char)
          } catch (err) {
            console.error(`Erro ao carregar personagem do jogador ${p.user_id}:`, err)
          }
        }
      }
    }

    setPlayerCharacters(charactersMap)
  }, [players, user, game, currentPlayer])

  // Memoizar IDs dos players para evitar recarregar personagens desnecessariamente
  const playersIdsRef = useRef<string>('')
  
  useEffect(() => {
    if (players.length > 0 && user && game) {
      // Só recarregar se os IDs dos players mudaram
      const currentIds = players.map(p => `${p.id}-${p.character_id}`).join(',')
      if (currentIds !== playersIdsRef.current) {
        playersIdsRef.current = currentIds
        loadPlayerCharacters()
      }
    }
  }, [players, user, game, loadPlayerCharacters])

  // Listener para atualizações de status
  useEffect(() => {
    const handleStatusUpdate = () => {
      // Recarregar personagens quando status for atualizado
      loadPlayerCharacters()
      loadPlayers()
    }

    window.addEventListener('status-updated', handleStatusUpdate)
    return () => {
      window.removeEventListener('status-updated', handleStatusUpdate)
    }
  }, [loadPlayerCharacters])


  const handleMakeMaster = async (userId: string) => {
    if (!confirm('Tornar este jogador mestre? Você perderá o cargo de mestre.')) return

    try {
      await updatePlayerRole(gameId, userId, 'master')
      // Atualizar o game também
      if (game) {
        setGame({ ...game, master: userId })
      }
      await loadPlayers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao tornar mestre')
    }
  }

  const handleRemovePlayer = async (userId: string) => {
    if (!confirm('Remover este jogador da sala?')) return

    try {
      await removePlayerFromGame(gameId, userId)
      await loadPlayers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover jogador')
    }
  }

  const handleSelectCharacter = async (characterId: string) => {
    if (!user) return

    try {
      await updatePlayerCharacter(gameId, user.id, characterId)
      setShowCharacterSelector(false)
      await loadPlayers() // Recarregar para atualizar character_id
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao selecionar personagem')
    }
  }

  const handleDeleteGame = async () => {
    if (!isMaster) return
    
    if (!confirm('Tem certeza que deseja excluir esta sala? Todos os dados (logs, mapas, ações) serão perdidos permanentemente.')) {
      return
    }

    try {
      await deleteGame(gameId)
      router.push('/dashboard')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir sala')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-white">Carregando...</h1>
        </div>
      </div>
    )
  }

  if (error && !game) {
    return (
      <div className="min-h-screen bg-gray-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300">
            ← Voltar para Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!game) return null

  if (showCharacterSelector && user) {
    return (
      <CharacterSelector
        gameId={gameId}
        onSelect={handleSelectCharacter}
        onCancel={() => {
          // Se não tiver personagem, não pode cancelar (precisa selecionar)
          if (currentPlayer?.character_id) {
            setShowCharacterSelector(false)
          }
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header Fixo */}
      <GameHeader 
        game={game} 
        isMaster={isMaster} 
        onDeleteGame={isMaster ? handleDeleteGame : undefined}
        onGameUpdate={setGame}
      />

      {/* Notificações */}
      <Notifications gameId={gameId} />

      {/* Layout Principal: Grid com Mapa e Sidebar */}
      <div className="flex-1 relative pt-16">
        {/* Painel de Confirmação do Mestre (lado esquerdo) */}
        <MasterCombatConfirmation
          gameId={gameId}
          isMaster={isMaster}
          players={players}
          playerCharacters={playerCharacters}
        />

        {/* Painel de Gerenciamento de Status (lado esquerdo, abaixo do painel de confirmação) */}
        <MasterStatusPanel
          gameId={gameId}
          isMaster={isMaster}
          players={players}
          playerCharacters={playerCharacters}
          onUpdate={() => {
            // Recarregar dados quando status for atualizado
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('status-updated'))
            }
          }}
        />

        {/* Mapa Central */}
        <MapContainer
          gameId={gameId}
          isMaster={isMaster}
          myCharacter={myCharacter}
          sidebarWidth={320}
          leftPanelWidth={isMaster ? 320 : 0} // Um painel de 320px (dois painéis empilhados verticalmente)
        />

        {/* Sidebar Direita */}
        <GameSidebar
          gameId={gameId}
          isMaster={isMaster}
          messages={messages}
          chatLoading={chatLoading}
          players={players}
          maps={maps}
          myCharacter={myCharacter}
          playerCharacters={playerCharacters}
          onMapsChange={loadMaps}
          onSelectCharacter={() => setShowCharacterSelector(true)}
          onMakeMaster={handleMakeMaster}
          onRemovePlayer={handleRemovePlayer}
          onViewCharacter={(characterId) => setViewingCharacterId(characterId)}
          currentUserId={user?.id}
          currentPlayer={currentPlayer}
          game={game}
        />
      </div>

      {/* Modal de Ficha do Personagem */}
      <CharacterSheet
        characterId={viewingCharacterId}
        onClose={() => setViewingCharacterId(null)}
      />

      {/* Modal de Level Up */}
      {levelUpCharacter && (
        <LevelUpModal
          character={levelUpCharacter.character}
          newLevel={levelUpCharacter.newLevel}
          onClose={() => setLevelUpCharacter(null)}
          onComplete={async () => {
            // Recarregar character após level up
            if (myCharacter) {
              const updated = await getCharacterById(myCharacter.id)
              setMyCharacter(updated)
            }
            // Recarregar players para atualizar dados
            await loadPlayers()
            setLevelUpCharacter(null)
          }}
        />
      )}
    </div>
  )
}
