'use client'

import { useEffect, useState } from 'react'
import { getCharacterById } from '@/services/characterService'
import type { Character, CharacterStats } from '@/lib/supabase/types'

interface CharacterSheetProps {
  characterId: string | null
  onClose: () => void
}

export default function CharacterSheet({ characterId, onClose }: CharacterSheetProps) {
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (characterId) {
      loadCharacter()
    } else {
      setCharacter(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId])

  const loadCharacter = async () => {
    if (!characterId) return

    try {
      setLoading(true)
      const data = await getCharacterById(characterId)
      setCharacter(data)
    } catch (err) {
      console.error('Erro ao carregar personagem:', err)
      alert('Erro ao carregar ficha do personagem')
    } finally {
      setLoading(false)
    }
  }

  if (!characterId) return null

  const stats = (character?.stats as CharacterStats) || {}
  const sheet = (character?.sheet as Record<string, any>) || {}

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Ficha do Personagem</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
            title="Fechar"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando ficha...</p>
            </div>
          ) : character ? (
            <>
              {/* Informações Básicas */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Informações Básicas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Nome</p>
                    <p className="text-white font-medium">{character.name}</p>
                  </div>
                  {character.class && (
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Classe</p>
                      <p className="text-white font-medium">{character.class}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Nível</p>
                    <p className="text-white font-medium">{character.level}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Status</p>
                    <p className={`font-medium ${
                      character.status === 'active' ? 'text-green-400' :
                      character.status === 'dead' ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {character.status === 'active' ? 'Ativo' :
                       character.status === 'dead' ? 'Morto' :
                       'Inativo'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Barra de Experiência */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Experiência (XP)</h3>
                  <span className="text-sm text-gray-400">
                    {character.xp_percentage?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${Math.min(100, character.xp_percentage || 0)}%` }}
                  >
                    {character.xp_percentage && character.xp_percentage > 10 && (
                      <span className="text-xs font-bold text-gray-900">
                        {character.xp_percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Nível {character.level} • Próximo nível em {100 - (character.xp_percentage || 0)}% XP
                </p>
              </div>

              {/* HP e MP */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Pontos de Vida (HP)</p>
                  <p className="text-red-400 font-bold text-3xl">
                    {character.hp}
                    {(character as any).max_hp && (character as any).max_hp !== character.hp && (
                      <span className="text-red-500 text-lg">/{(character as any).max_hp}</span>
                    )}
                  </p>
                </div>
                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Pontos de Mana (MP)</p>
                  <p className="text-blue-400 font-bold text-3xl">{character.mp}</p>
                </div>
              </div>

              {/* Atributos */}
              {(stats.strength || stats.dexterity || stats.constitution || 
                stats.intelligence || stats.wisdom || stats.charisma || stats.race) && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Atributos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {stats.strength !== undefined && (
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Força (STR)</p>
                        <p className="text-white font-medium text-lg">{stats.strength}</p>
                      </div>
                    )}
                    {stats.dexterity !== undefined && (
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Destreza (DEX)</p>
                        <p className="text-white font-medium text-lg">{stats.dexterity}</p>
                      </div>
                    )}
                    {stats.constitution !== undefined && (
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Constituição (CON)</p>
                        <p className="text-white font-medium text-lg">{stats.constitution}</p>
                      </div>
                    )}
                    {stats.intelligence !== undefined && (
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Inteligência (INT)</p>
                        <p className="text-white font-medium text-lg">{stats.intelligence}</p>
                      </div>
                    )}
                    {stats.wisdom !== undefined && (
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Sabedoria (WIS)</p>
                        <p className="text-white font-medium text-lg">{stats.wisdom}</p>
                      </div>
                    )}
                    {stats.charisma !== undefined && (
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Carisma (CHA)</p>
                        <p className="text-white font-medium text-lg">{stats.charisma}</p>
                      </div>
                    )}
                    {stats.race && (
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Raça</p>
                        <p className="text-white font-medium text-lg">{stats.race}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ficha Adicional (Sheet) */}
              {Object.keys(sheet).length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Informações Adicionais</h3>
                  <div className="space-y-3">
                    {Object.entries(sheet).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-700 pb-2 last:border-0">
                        <p className="text-gray-400 text-sm mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-white">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data de Criação */}
              <div className="text-center text-gray-500 text-xs">
                Criado em {new Date(character.created_at).toLocaleString('pt-BR')}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">Personagem não encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
