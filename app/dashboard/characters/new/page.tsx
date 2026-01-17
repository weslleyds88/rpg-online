'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCharacters } from '@/hooks/useCharacters'
import type { CharacterInsertWithoutOwner, CharacterStats } from '@/lib/supabase/types'
import Link from 'next/link'

const CLASSES = ['Guerreiro', 'Mago', 'Ladino', 'Clérigo', 'Ranger', 'Bárbaro', 'Paladino', 'Bruxo']
const RACES = ['Humano', 'Elfo', 'Anão', 'Halfling', 'Orc', 'Tiefling', 'Draconato', 'Gnomo']

export default function NewCharacterPage() {
  const router = useRouter()
  const { addCharacter } = useCharacters()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    class: 'Guerreiro',
    race: 'Humano',
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Criar objeto stats com os atributos
      const stats: CharacterStats = {
        strength: formData.strength,
        dexterity: formData.dexterity,
        constitution: formData.constitution,
        intelligence: formData.intelligence,
        wisdom: formData.wisdom,
        charisma: formData.charisma,
        race: formData.race,
      }

      const characterData: CharacterInsertWithoutOwner = {
        name: formData.name,
        class: formData.class,
        stats: stats,
        sheet: {},
      }

      await addCharacter(characterData)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar personagem')
    } finally {
      setLoading(false)
    }
  }

  const handleAttributeChange = (attr: string, value: number) => {
    const numValue = Math.max(1, Math.min(20, value)) // Limitar entre 1 e 20
    setFormData((prev) => ({ ...prev, [attr]: numValue }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
          >
            ← Voltar para Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Criar Novo Personagem</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Informações Básicas</h2>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Personagem *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-1">
                    Classe *
                  </label>
                  <select
                    id="class"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.class}
                    onChange={(e) => setFormData((prev) => ({ ...prev, class: e.target.value }))}
                  >
                    {CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="race" className="block text-sm font-medium text-gray-700 mb-1">
                    Raça *
                  </label>
                  <select
                    id="race"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.race}
                    onChange={(e) => setFormData((prev) => ({ ...prev, race: e.target.value }))}
                  >
                    {RACES.map((race) => (
                      <option key={race} value={race}>
                        {race}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Atributos */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Atributos (1-20)</h2>
              <p className="text-sm text-gray-600">
                Distribua os pontos de atributo. Valores padrão: 10
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'strength', label: 'Força (STR)' },
                  { key: 'dexterity', label: 'Destreza (DEX)' },
                  { key: 'constitution', label: 'Constituição (CON)' },
                  { key: 'intelligence', label: 'Inteligência (INT)' },
                  { key: 'wisdom', label: 'Sabedoria (WIS)' },
                  { key: 'charisma', label: 'Carisma (CHA)' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
                      {label}
                    </label>
                    <input
                      type="number"
                      id={key}
                      min="1"
                      max="20"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData[key as keyof typeof formData]}
                      onChange={(e) =>
                        handleAttributeChange(key, parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Criando...' : 'Criar Personagem'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

