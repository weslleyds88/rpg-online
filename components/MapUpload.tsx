'use client'

import { useState } from 'react'
import { uploadMap, deleteMap, getMapUrl } from '@/services/mapService'
import { getAblyChannel } from '@/lib/ably/client'
import type { Map as GameMap } from '@/lib/supabase/types'

interface MapUploadProps {
  gameId: string
  maps: GameMap[]
  onMapsChange: () => void
  isMaster: boolean
}

export default function MapUpload({ gameId, maps, onMapsChange, isMaster }: MapUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens são permitidas')
      return
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo: 10MB')
      return
    }

    try {
      setUploading(true)
      setError(null)
      await uploadMap(gameId, file)
      onMapsChange()
      e.target.value = '' // Reset input
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (mapId: string) => {
    if (!confirm('Deletar este mapa?')) return

    try {
      await deleteMap(mapId)
      onMapsChange()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao deletar mapa')
    }
  }

  return (
    <div className="space-y-4">
      {isMaster && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {uploading ? 'Fazendo upload...' : 'Clique para fazer upload de um mapa'}
              </p>
              <p className="text-xs text-gray-500">PNG, JPG ou GIF até 10MB</p>
            </div>
          </label>
          {error && (
            <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {maps.map((map) => {
          const url = map.filename ? getMapUrl(map.filename) : null
          return (
            <div 
              key={map.id} 
              className="relative border rounded-lg overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors"
              onClick={async () => {
                // Disparar evento local
                console.log('Mapa selecionado:', map)
                if (typeof window !== 'undefined') {
                  const event = new CustomEvent('map-selected', { detail: map })
                  window.dispatchEvent(event)
                  console.log('Evento map-selected disparado')
                }
                
                // Publicar no Ably para sincronizar com todos os jogadores
                try {
                  const channel = getAblyChannel(`game:${gameId}:map`)
                  if (channel) {
                    await channel.publish('map_changed', {
                      mapId: map.id,
                      gameId: gameId,
                    })
                    console.log('Mapa sincronizado via Ably para todos os jogadores')
                  }
                } catch (err) {
                  console.error('Erro ao sincronizar mapa via Ably:', err)
                }
              }}
            >
              {url ? (
                <img
                  src={url}
                  alt={map.filename || 'Mapa'}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                  <p className="text-sm text-gray-500">Sem preview</p>
                </div>
              )}
              {isMaster && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(map.id)
                  }}
                  className="absolute top-2 right-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 z-10"
                >
                  ✕
                </button>
              )}
              <div className="p-2 bg-gray-50">
                <p className="text-xs text-gray-600 truncate font-medium">
                  {map.filename?.split('/').pop() || 'Mapa'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Clique para selecionar</p>
              </div>
            </div>
          )
        })}
      </div>

      {maps.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Nenhum mapa ainda. {isMaster && 'Faça upload do primeiro mapa!'}
        </p>
      )}
    </div>
  )
}
