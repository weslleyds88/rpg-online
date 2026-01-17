'use client'

import { useState, useMemo, memo } from 'react'
import CollapsibleSection from './CollapsibleSection'
import ActionLog from './ActionLog'
import CombatActions from './CombatActions'
import MapUpload from './MapUpload'
import NPCManager from './NPCManager'
import PlayerColorPicker from './PlayerColorPicker'
import EncounterManager from './EncounterManager'
import InitiativeTracker from './InitiativeTracker'
import StatusManager from './StatusManager'
import type { Game, Player, Map, Character, Message } from '@/lib/supabase/types'

interface GameSidebarProps {
  gameId: string
  isMaster: boolean
  messages: Message[]
  chatLoading: boolean
  players: Player[]
  maps: Map[]
  myCharacter: Character | null
  playerCharacters: Map<string, Character>
  onMapsChange: () => void
  onSelectCharacter: () => void
  onMakeMaster: (userId: string) => void
  onRemovePlayer: (userId: string) => void
  onViewCharacter?: (characterId: string) => void
  currentUserId?: string
  currentPlayer?: Player
  game: Game
}

function GameSidebar({
  gameId,
  isMaster,
  messages,
  chatLoading,
  players,
  maps,
  myCharacter,
  playerCharacters,
  onMapsChange,
  onSelectCharacter,
  onMakeMaster,
  onRemovePlayer,
  onViewCharacter,
  currentUserId,
  currentPlayer,
  game,
}: GameSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Memoizar lista de jogadores para evitar re-renders desnecessários
  const playersList = useMemo(() => {
    return players.map((player) => {
      const isCurrentUser = player.user_id === currentUserId
      const isPlayerMaster = player.role === 'master' || player.role === 'gm'
      const isThisPlayerMaster = game.master === player.user_id
      const character = playerCharacters.get(player.user_id)
      return { player, isCurrentUser, isPlayerMaster, isThisPlayerMaster, character }
    })
  }, [players, currentUserId, game.master, playerCharacters])

  return (
    <aside
      className={`fixed right-0 top-16 bottom-0 w-80 bg-gray-900 border-l border-gray-800 z-40 transition-transform duration-300 ${
        isCollapsed ? 'translate-x-full' : 'translate-x-0'
      } flex flex-col`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-10 top-1/2 -translate-y-1/2 bg-gray-800 hover:bg-gray-700 text-white px-2 py-6 rounded-l-lg transition-colors border border-r-0 border-gray-700"
        title={isCollapsed ? 'Mostrar painel' : 'Ocultar painel'}
      >
        {isCollapsed ? '◄' : '►'}
      </button>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Log de Ações */}
        <div className="h-[300px]">
          <ActionLog messages={messages} loading={chatLoading} />
        </div>

        {/* Combate */}
        <CollapsibleSection title="Combate" icon="⚔️" defaultOpen={true}>
          <CombatActions 
            gameId={gameId} 
            isMaster={isMaster}
            players={players}
            playerCharacters={playerCharacters}
          />
        </CollapsibleSection>

        {/* Gerenciamento de Mapas (apenas mestre) */}
        {isMaster && (
          <CollapsibleSection title="Gerenciar Mapas" icon="📤" defaultOpen={false}>
            <MapUpload
              gameId={gameId}
              maps={maps}
              onMapsChange={onMapsChange}
              isMaster={isMaster}
            />
          </CollapsibleSection>
        )}

        {/* Sistema de Iniciativa/Combate */}
        <CollapsibleSection title="Iniciativa" icon="⚔️" defaultOpen={false}>
          <InitiativeTracker
            gameId={gameId}
            isMaster={isMaster}
            players={players}
            playerCharacters={playerCharacters}
          />
        </CollapsibleSection>

        {/* Gerenciamento de Combates (apenas mestre) */}
        {isMaster && (
          <CollapsibleSection title="Gerenciar Combate" icon="🎲" defaultOpen={false}>
            <EncounterManager
              gameId={gameId}
              isMaster={isMaster}
              players={players}
              playerCharacters={playerCharacters}
              onEncounterChange={() => {
                // Trigger re-render do tracker
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('encounter-changed'))
                }
              }}
            />
          </CollapsibleSection>
        )}

        {/* Gerenciamento de NPCs (apenas mestre) */}
        {isMaster && (
          <CollapsibleSection title="NPCs e Adversários" icon="👹" defaultOpen={false}>
            <NPCManager
              gameId={gameId}
              isMaster={isMaster}
              onNPCsChange={() => {
                // Trigger re-render do mapa
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('npcs-changed'))
                }
              }}
              onSelectNPC={(npc) => {
                // Passar para o MapContainer via evento
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('npc-selected', { detail: npc }))
                }
              }}
            />
          </CollapsibleSection>
        )}

        {/* Jogadores */}
        <CollapsibleSection title={`Jogadores (${players.length})`} icon="👥" defaultOpen={true}>
          <div className="space-y-3">
            {/* Personagem do Jogador */}
            {myCharacter ? (
              <div 
                className={`bg-gray-800 rounded border border-gray-700 p-3 ${
                  onViewCharacter ? 'cursor-pointer hover:border-indigo-500' : ''
                }`}
                onClick={() => {
                  if (onViewCharacter) {
                    onViewCharacter(myCharacter.id)
                  }
                }}
                title={onViewCharacter ? 'Clique para ver a ficha completa' : ''}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold text-white">
                    {myCharacter.name}
                    {onViewCharacter && ' 👁️'}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectCharacter()
                    }}
                    className="text-xs px-2 py-1 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30 rounded transition-colors"
                    title="Trocar personagem"
                  >
                    Trocar
                  </button>
                </div>
                <div className="mb-3 space-y-2">
                  <div className="bg-purple-900/30 p-2 rounded border border-purple-800 text-center">
                    <p className="text-gray-400 mb-0.5 text-xs">Nível</p>
                    <p className="text-purple-400 font-bold text-base">{myCharacter.level}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-red-900/30 p-2 rounded border border-red-800">
                      <p className="text-gray-400 mb-0.5">HP</p>
                      <p className="text-red-400 font-bold text-base">{myCharacter.hp}</p>
                    </div>
                    <div className="bg-blue-900/30 p-2 rounded border border-blue-800">
                      <p className="text-gray-400 mb-0.5">MP</p>
                      <p className="text-blue-400 font-bold text-base">{myCharacter.mp}</p>
                    </div>
                  </div>
                </div>
                <PlayerColorPicker gameId={gameId} currentPlayer={currentPlayer} />
              </div>
            ) : !isMaster && (
              <button
                onClick={onSelectCharacter}
                className="w-full px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
              >
                Selecionar Personagem
              </button>
            )}

            {/* Lista de Jogadores */}
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {players.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-4">Nenhum jogador ainda</p>
              ) : (
                playersList.map(({ player, isCurrentUser, isPlayerMaster, isThisPlayerMaster, character }) => {
                  return (
                    <div
                      key={player.id}
                      className={`p-2.5 bg-gray-800 rounded border border-gray-700 transition-colors ${
                        character && onViewCharacter ? 'cursor-pointer hover:border-indigo-500 hover:bg-gray-700' : 'hover:border-gray-600'
                      }`}
                      onClick={() => {
                        if (character && onViewCharacter) {
                          onViewCharacter(character.id)
                        }
                      }}
                      title={character ? 'Clique para ver a ficha completa' : ''}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">
                            {character ? character.name : (isCurrentUser ? 'Você' : 'Jogador')}
                            {isThisPlayerMaster && ' 👑'}
                            {character && onViewCharacter && ' 👁️'}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{player.role}</p>
                        </div>
                        {isMaster && !isCurrentUser && (
                          <div className="flex space-x-1 ml-2">
                            {!isPlayerMaster && (
                              <button
                                onClick={() => onMakeMaster(player.user_id)}
                                className="text-[10px] px-1.5 py-0.5 bg-indigo-900/50 text-indigo-300 rounded hover:bg-indigo-800 transition-colors"
                                title="Tornar mestre"
                              >
                                👑
                              </button>
                            )}
                            <button
                              onClick={() => onRemovePlayer(player.user_id)}
                              className="text-[10px] px-1.5 py-0.5 bg-red-900/50 text-red-300 rounded hover:bg-red-800 transition-colors"
                              title="Remover"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                      {isMaster && character && (
                        <div className="mt-1.5 pt-1.5 border-t border-gray-700 space-y-1.5">
                          <div className="text-[10px] text-center">
                            <span className="text-gray-400">Nível:</span>{' '}
                            <span className="text-purple-400 font-semibold">{character.level}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                            <div>
                              <span className="text-gray-400">HP:</span>{' '}
                              <span className="text-red-400 font-medium">{character.hp}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">MP:</span>{' '}
                              <span className="text-blue-400 font-medium">{character.mp}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </aside>
  )
}

// Memoizar componente para evitar re-renders desnecessários
export default memo(GameSidebar)
