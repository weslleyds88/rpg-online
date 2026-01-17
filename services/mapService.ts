/**
 * Serviço para gerenciar mapas
 */

import { supabase } from '@/lib/supabase/client'
import type { Map, MapInsert } from '@/lib/supabase/types'

const STORAGE_BUCKET = 'rpg-maps'

/**
 * Buscar mapas de um game
 */
export async function getGameMaps(gameId: string) {
  const { data, error } = await supabase
    .from('rpg_maps')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Map[]
}

/**
 * Upload de mapa (arquivo + metadata)
 */
export async function uploadMap(
  gameId: string,
  file: File,
  metadata?: { width?: number; height?: number; [key: string]: any }
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Gerar nome único para o arquivo
  const fileExt = file.name.split('.').pop()
  const fileName = `${gameId}/${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  // Upload do arquivo para o Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    // Se o erro for "Bucket not found", dar mensagem mais clara
    if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
      throw new Error(
        `Bucket '${STORAGE_BUCKET}' não encontrado. ` +
        `Por favor, crie o bucket no Supabase Storage. ` +
        `Veja as instruções em: docs/setup/CREATE_STORAGE_BUCKET.md`
      )
    }
    throw uploadError
  }

  // Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath)

  // Criar registro no banco
  const mapData: MapInsert = {
    game_id: gameId,
    filename: fileName,
    width: metadata?.width || null,
    height: metadata?.height || null,
    metadata: {
      ...metadata,
      url: publicUrl,
      originalName: file.name,
      size: file.size,
      type: file.type,
    },
    uploaded_by: user.id,
  }

  const { data: mapRecord, error: dbError } = await supabase
    .from('rpg_maps')
    .insert(mapData)
    .select()
    .single()

  if (dbError) {
    // Se falhar, tentar deletar o arquivo
    await supabase.storage.from(STORAGE_BUCKET).remove([filePath])
    throw dbError
  }

  // Criar log automático
  try {
    const { logGameEvent } = await import('./chatService')
    await logGameEvent(gameId, 'map_uploaded', `🗺️ Mapa "${file.name}" foi adicionado`, {
      actor: user.id,
      details: { mapId: mapRecord.id, filename: file.name },
    })
  } catch (err) {
    console.warn('Erro ao criar log de mapa:', err)
  }

  return mapRecord as Map
}

/**
 * Deletar mapa
 */
export async function deleteMap(mapId: string) {
  // Buscar o mapa primeiro
  const { data: map, error: fetchError } = await supabase
    .from('rpg_maps')
    .select('filename')
    .eq('id', mapId)
    .single()

  if (fetchError) throw fetchError

  // Deletar do Storage
  if (map.filename) {
    await supabase.storage.from(STORAGE_BUCKET).remove([map.filename])
  }

  // Buscar game_id antes de deletar para criar o log
  const { data: mapData } = await supabase
    .from('rpg_maps')
    .select('game_id, filename')
    .eq('id', mapId)
    .single()

  // Deletar do banco
  const { error: deleteError } = await supabase
    .from('rpg_maps')
    .delete()
    .eq('id', mapId)

  if (deleteError) throw deleteError

  // Criar log automático
  if (mapData?.game_id) {
    try {
      const { logGameEvent } = await import('./chatService')
      await logGameEvent(mapData.game_id, 'map_deleted', `🗑️ Mapa foi removido`, {
        details: { mapId, filename: mapData.filename },
      })
    } catch (err) {
      console.warn('Erro ao criar log de remoção de mapa:', err)
    }
  }
}

/**
 * Obter URL pública de um mapa
 */
export function getMapUrl(filename: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filename)
  return publicUrl
}
