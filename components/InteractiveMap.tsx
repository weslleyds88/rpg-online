'use client'

import { useEffect, useState, useRef, useCallback, useContext } from 'react'
import { getGameMaps } from '@/services/mapService'
import { getGamePlayers, updatePlayerPosition } from '@/services/playerService'
import { getCharacterById } from '@/services/characterService'
import { getGameNPCs, updateNPCPosition } from '@/services/npcService'
import { getAblyChannel } from '@/lib/ably/client'
import { useAuth } from '@/hooks/useAuth'
import type { Map as GameMap, Player, Character, NPC } from '@/lib/supabase/types'
import { supabase } from '@/lib/supabase/client'
import { MapTransformContext } from './MapContainer'

interface InteractiveMapProps {
  gameId: string
  isMaster: boolean
  myCharacter: Character | null
}

const GRID_SIZE = 50 // Tamanho de cada célula da grade em pixels

export default function InteractiveMap({ gameId, isMaster, myCharacter }: InteractiveMapProps) {
  const { user } = useAuth()
  const mapTransform = useContext(MapTransformContext)
  const [maps, setMaps] = useState<GameMap[]>([])
  const [selectedMap, setSelectedMap] = useState<GameMap | null>(null)
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [playerCharacters, setPlayerCharacters] = useState<Map<string, Character>>(new Map())
  const [npcs, setNPCs] = useState<NPC[]>([])
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null)
  const [draggingNPC, setDraggingNPC] = useState<{ npc: NPC; offsetX: number; offsetY: number } | null>(null)
  const [draggingPlayer, setDraggingPlayer] = useState<{ player: Player; offsetX: number; offsetY: number } | null>(null)
  const [mapScale, setMapScale] = useState(1)
  const [mapDrawPos, setMapDrawPos] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageCacheRef = useRef<HTMLImageElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    loadMaps()
    loadPlayers()
    loadNPCs()
  }, [gameId])

  // Listener para atualizar NPCs quando mudarem
  useEffect(() => {
    const handleNPCsChanged = () => {
      loadNPCs()
    }
    const handleNPCSelected = (e: Event) => {
      const customEvent = e as CustomEvent
      setSelectedNPC(customEvent.detail || null)
    }
    const handleMapSelected = async (e: Event) => {
      const customEvent = e as CustomEvent<GameMap>
      console.log('Evento map-selected recebido:', customEvent.detail)
      if (customEvent.detail) {
        const mapId = customEvent.detail.id
        // Recarregar mapas e então selecionar
        try {
          const updatedMaps = await getGameMaps(gameId)
          setMaps(updatedMaps)
          const mapToSelect = updatedMaps.find(m => m.id === mapId) || customEvent.detail
          console.log('Trocando mapa para:', mapToSelect.id)
          setSelectedMap(mapToSelect)
        } catch (err) {
          console.error('Erro ao carregar mapas:', err)
          // Se der erro, usar o mapa do evento mesmo assim
          setSelectedMap(customEvent.detail)
        }
      }
    }
    window.addEventListener('npcs-changed', handleNPCsChanged)
    window.addEventListener('npc-selected', handleNPCSelected)
    window.addEventListener('map-selected', handleMapSelected)
    return () => {
      window.removeEventListener('npcs-changed', handleNPCsChanged)
      window.removeEventListener('npc-selected', handleNPCSelected)
      window.removeEventListener('map-selected', handleMapSelected)
    }
  }, [gameId])

  useEffect(() => {
    if (selectedMap) {
      loadMapImage(selectedMap)
    }
  }, [selectedMap])

  useEffect(() => {
    if (players.length > 0) {
      loadPlayerCharacters()
    }
  }, [players])

  useEffect(() => {
    // Sincronização em tempo real via Ably
    const channel = getAblyChannel(`game:${gameId}:map`)
    if (!channel) return

    channel.subscribe('player_moved', (message) => {
      const { playerId, x, y } = message.data
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, position_x: x, position_y: y } : p
      ))
    })

    // Escutar mudanças de mapa do mestre
    channel.subscribe('map_changed', async (message) => {
      const { mapId } = message.data as { mapId: string; gameId: string }
      console.log('Mapa mudou via Ably, novo mapa ID:', mapId)
      
      // Recarregar mapas e selecionar o novo
      try {
        const updatedMaps = await getGameMaps(gameId)
        setMaps(updatedMaps)
        const mapToSelect = updatedMaps.find(m => m.id === mapId)
        if (mapToSelect) {
          console.log('Trocando mapa para todos os jogadores:', mapToSelect.id)
          setSelectedMap(mapToSelect)
        }
      } catch (err) {
        console.error('Erro ao carregar mapa após sincronização:', err)
      }
    })

    // Listener para atualizar players quando mudarem (ex: cor)
    const handlePlayersChanged = () => {
      loadPlayers()
    }
    window.addEventListener('players-changed', handlePlayersChanged)

    // Polling como fallback (aumentado para 20 segundos para evitar piscadas)
    // O Ably já cobre movimentos em tempo real
    const interval = setInterval(() => {
      loadPlayers()
    }, 20000)

    return () => {
      channel.unsubscribe('player_moved')
      channel.unsubscribe('map_changed')
      window.removeEventListener('players-changed', handlePlayersChanged)
      clearInterval(interval)
    }
  }, [gameId])

  const loadMaps = async () => {
    try {
      const data = await getGameMaps(gameId)
      setMaps(data)
      if (data.length > 0 && !selectedMap) {
        setSelectedMap(data[0])
      }
    } catch (err) {
      console.error('Erro ao carregar mapas:', err)
    }
  }

  const loadMapImage = async (map: Map) => {
    if (!map.filename) return

    try {
      const { data } = await supabase.storage
        .from('rpg-maps')
        .createSignedUrl(map.filename, 3600)

      if (data?.signedUrl) {
        setMapImageUrl(data.signedUrl)
      }
    } catch (err) {
      console.error('Erro ao carregar imagem do mapa:', err)
      // Se o bucket não existir, tentar usar URL pública
      try {
        const { data: { publicUrl } } = supabase.storage
          .from('rpg-maps')
          .getPublicUrl(map.filename)
        if (publicUrl) {
          setMapImageUrl(publicUrl)
        }
      } catch (err2) {
        console.error('Erro ao obter URL pública do mapa:', err2)
      }
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

  const loadPlayerCharacters = async () => {
    const charactersMap = new Map<string, Character>()
    
    for (const player of players) {
      if (player.character_id) {
        try {
          const char = await getCharacterById(player.character_id)
          charactersMap.set(player.user_id, char)
        } catch (err) {
          console.error(`Erro ao carregar personagem do jogador ${player.user_id}:`, err)
        }
      }
    }

    setPlayerCharacters(charactersMap)
  }

  const loadNPCs = async () => {
    try {
      const data = await getGameNPCs(gameId)
      setNPCs(data)
    } catch (err) {
      console.error('Erro ao carregar NPCs:', err)
    }
  }

  // Função auxiliar para converter coordenadas de tela para grid
  const screenToGrid = (clientX: number, clientY: number): { gridX: number; gridY: number } | null => {
    const canvas = canvasRef.current
    if (!canvas || !selectedMap) return null

    const containerZoom = mapTransform.zoom
    const containerPan = mapTransform.pan

    const transformedWrapper = canvas.closest('[style*="transform"]') as HTMLElement
    if (!transformedWrapper) return null

    const wrapperRect = transformedWrapper.getBoundingClientRect()
    
    const originalWrapperWidth = wrapperRect.width / containerZoom
    const originalWrapperHeight = wrapperRect.height / containerZoom
    
    const relativeToWrapperX = clientX - wrapperRect.left
    const relativeToWrapperY = clientY - wrapperRect.top
    
    const transformedCenterX = wrapperRect.width / 2
    const transformedCenterY = wrapperRect.height / 2
    const originalCenterX = originalWrapperWidth / 2
    const originalCenterY = originalWrapperHeight / 2
    
    const relativeToCenterX = relativeToWrapperX - transformedCenterX
    const relativeToCenterY = relativeToWrapperY - transformedCenterY
    
    const withoutPanX = relativeToCenterX - containerPan.x
    const withoutPanY = relativeToCenterY - containerPan.y
    const withoutZoomX = withoutPanX / containerZoom
    const withoutZoomY = withoutPanY / containerZoom
    
    const clickX = withoutZoomX + originalCenterX
    const clickY = withoutZoomY + originalCenterY

    const drawX = mapDrawPos.x
    const drawY = mapDrawPos.y
    const scale = mapScale

    const mapX = clickX - drawX
    const mapY = clickY - drawY

    if (mapX < 0 || mapY < 0) return null

    const gridX = Math.floor(mapX / (GRID_SIZE * scale))
    const gridY = Math.floor(mapY / (GRID_SIZE * scale))

    if (gridX < 0 || gridY < 0) return null

    return { gridX, gridY }
  }

  // Detectar qual NPC foi clicado (baseado na posição do mouse)
  const getNPCAtPosition = (clientX: number, clientY: number): NPC | null => {
    const gridPos = screenToGrid(clientX, clientY)
    if (!gridPos) return null

    // Verificar se algum NPC está nessa posição (com tolerância de 1 célula)
    for (const npc of npcs) {
      if (npc.position_x !== null && npc.position_y !== null && npc.status === 'active') {
        const distance = Math.abs(npc.position_x - gridPos.gridX) + Math.abs(npc.position_y - gridPos.gridY)
        if (distance <= 1) {
          return npc
        }
      }
    }
    return null
  }

  // Detectar qual Player foi clicado (baseado na posição do mouse)
  const getPlayerAtPosition = (clientX: number, clientY: number): Player | null => {
    const gridPos = screenToGrid(clientX, clientY)
    if (!gridPos) return null

    // Verificar se algum player está nessa posição (com tolerância de 1 célula)
    for (const player of players) {
      if (player.position_x !== null && player.position_y !== null) {
        const distance = Math.abs(player.position_x - gridPos.gridX) + Math.abs(player.position_y - gridPos.gridY)
        if (distance <= 1) {
          return player
        }
      }
    }
    return null
  }

  const handleNPCPosition = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedMap || !selectedNPC || !user) return

    const gridPos = screenToGrid(e.clientX, e.clientY)
    if (!gridPos) return

    try {
      await updateNPCPosition(selectedNPC.id, gridPos.gridX, gridPos.gridY)
      await loadNPCs()
      setSelectedNPC(null) // Deselecionar após posicionar
    } catch (err) {
      console.error('Erro ao posicionar NPC:', err)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedMap || !user) return

    // Mestre pode arrastar NPCs
    if (isMaster) {
      const clickedNPC = getNPCAtPosition(e.clientX, e.clientY)
      if (clickedNPC) {
        const gridPos = screenToGrid(e.clientX, e.clientY)
        if (gridPos) {
          setDraggingNPC({
            npc: clickedNPC,
            offsetX: gridPos.gridX - (clickedNPC.position_x || 0),
            offsetY: gridPos.gridY - (clickedNPC.position_y || 0),
          })
          e.preventDefault()
          e.stopPropagation()
          return
        }
      }

      // Se tinha NPC selecionado para posicionar, usar o comportamento antigo
      if (selectedNPC) {
        handleNPCPosition(e)
        return
      }
    }

    // Players podem arrastar apenas seu próprio personagem
    const clickedPlayer = getPlayerAtPosition(e.clientX, e.clientY)
    if (clickedPlayer && clickedPlayer.user_id === user.id) {
      const gridPos = screenToGrid(e.clientX, e.clientY)
      if (gridPos) {
        setDraggingPlayer({
          player: clickedPlayer,
          offsetX: gridPos.gridX - (clickedPlayer.position_x || 0),
          offsetY: gridPos.gridY - (clickedPlayer.position_y || 0),
        })
        e.preventDefault()
        e.stopPropagation()
        return
      }
    }
  }

  const handleMouseMove = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedMap) return

    const gridPos = screenToGrid(e.clientX, e.clientY)
    if (!gridPos) return

    // Mestre arrastando NPC
    if (isMaster && draggingNPC) {
      const newX = gridPos.gridX - draggingNPC.offsetX
      const newY = gridPos.gridY - draggingNPC.offsetY

      setNPCs(prev => prev.map(npc => 
        npc.id === draggingNPC.npc.id 
          ? { ...npc, position_x: newX, position_y: newY }
          : npc
      ))
      return
    }

    // Player arrastando seu próprio personagem
    if (draggingPlayer) {
      const newX = gridPos.gridX - draggingPlayer.offsetX
      const newY = gridPos.gridY - draggingPlayer.offsetY

      setPlayers(prev => prev.map(player => 
        player.id === draggingPlayer.player.id 
          ? { ...player, position_x: newX, position_y: newY }
          : player
      ))
    }
  }

  const handleMouseUp = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    const gridPos = screenToGrid(e.clientX, e.clientY)

    // Mestre soltando NPC
    if (isMaster && draggingNPC) {
      if (gridPos) {
        const finalX = gridPos.gridX - draggingNPC.offsetX
        const finalY = gridPos.gridY - draggingNPC.offsetY

        try {
          await updateNPCPosition(draggingNPC.npc.id, finalX, finalY)
          await loadNPCs()
        } catch (err) {
          console.error('Erro ao atualizar posição do NPC:', err)
          await loadNPCs()
        }
      }
      setDraggingNPC(null)
      return
    }

    // Player soltando seu próprio personagem
    if (draggingPlayer) {
      if (gridPos) {
        const finalX = gridPos.gridX - draggingPlayer.offsetX
        const finalY = gridPos.gridY - draggingPlayer.offsetY

        try {
          await updatePlayerPosition(gameId, draggingPlayer.player.user_id, finalX, finalY)

          // Publicar no Ably para sincronização em tempo real
          const channel = getAblyChannel(`game:${gameId}:map`)
          if (channel) {
            channel.publish('player_moved', {
              playerId: draggingPlayer.player.id,
              x: finalX,
              y: finalY,
            })
          }

          // Atualizar localmente
          setPlayers(prev => prev.map(p => 
            p.id === draggingPlayer.player.id 
              ? { ...p, position_x: finalX, position_y: finalY }
              : p
          ))
        } catch (err) {
          console.error('Erro ao atualizar posição do player:', err)
          await loadPlayers()
        }
      }
      setDraggingPlayer(null)
    }
  }

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !selectedMap || !mapImageUrl) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Ajustar tamanho do canvas baseado no container
    const container = containerRef.current
    if (!container) return

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    
    // Só redimensionar canvas se o tamanho mudou
    const dpr = window.devicePixelRatio || 1
    const newWidth = containerWidth * dpr
    const newHeight = containerHeight * dpr
    
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth
      canvas.height = newHeight
      canvas.style.width = `${containerWidth}px`
      canvas.style.height = `${containerHeight}px`
      ctx.scale(dpr, dpr)
    }

    // Limpar canvas
    ctx.clearRect(0, 0, containerWidth, containerHeight)

    // Usar imagem em cache se disponível, senão carregar
    const drawImage = (img: HTMLImageElement) => {
      // Calcular escala para que o mapa ocupe o máximo de espaço possível
      // Mas manter proporção original
      const scaleX = containerWidth / img.width
      const scaleY = containerHeight / img.height
      const scale = Math.max(scaleX, scaleY) * 1.2 // Escala para ocupar bem o espaço
      
      const scaledWidth = img.width * scale
      const scaledHeight = img.height * scale

      // Sempre centralizar o mapa
      const drawX = (containerWidth - scaledWidth) / 2
      const drawY = (containerHeight - scaledHeight) / 2

      // Salvar posição e escala para usar no clique
      setMapScale(scale)
      setMapDrawPos({ x: drawX, y: drawY })

      ctx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight)

      // Desenhar grade sobre a imagem (considerando a escala)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.lineWidth = 1.5

      const scaledGridSize = GRID_SIZE * scale

      // Calcular onde começar e terminar a grade baseado na posição do mapa
      const gridStartX = Math.floor(drawX / scaledGridSize) * scaledGridSize
      const gridStartY = Math.floor(drawY / scaledGridSize) * scaledGridSize
      const gridEndX = drawX + scaledWidth
      const gridEndY = drawY + scaledHeight

      // Desenhar linhas verticais
      for (let x = gridStartX; x <= gridEndX; x += scaledGridSize) {
        ctx.beginPath()
        ctx.moveTo(x, Math.max(0, drawY))
        ctx.lineTo(x, Math.min(containerHeight, drawY + scaledHeight))
        ctx.stroke()
      }

      // Desenhar linhas horizontais
      for (let y = gridStartY; y <= gridEndY; y += scaledGridSize) {
        ctx.beginPath()
        ctx.moveTo(Math.max(0, drawX), y)
        ctx.lineTo(Math.min(containerWidth, drawX + scaledWidth), y)
        ctx.stroke()
      }

      // Desenhar personagens
      players.forEach(player => {
        if (player.position_x !== null && player.position_y !== null) {
          const character = playerCharacters.get(player.user_id)
          const x = drawX + (player.position_x * GRID_SIZE * scale) + (GRID_SIZE * scale) / 2
          const y = drawY + (player.position_y * GRID_SIZE * scale) + (GRID_SIZE * scale) / 2

          // Verificar se está dentro da área visível
          if (x < 0 || x > containerWidth || y < 0 || y > containerHeight) return

          const isDragging = draggingPlayer?.player.id === player.id
          const isMyPlayer = player.user_id === user?.id

          // Círculo do personagem (usar cor do player ou padrão)
          const playerColor = player.color || (isMyPlayer ? '#3b82f6' : '#ef4444')
          ctx.fillStyle = playerColor
          ctx.beginPath()
          ctx.arc(x, y, isDragging ? 22 : 18, 0, 2 * Math.PI)
          ctx.fill()

          // Borda (amarela se estiver arrastando)
          ctx.strokeStyle = isDragging ? '#ffff00' : '#ffffff'
          ctx.lineWidth = isDragging ? 4 : 3
          ctx.stroke()

          // Sombra/glow se estiver arrastando
          if (isDragging) {
            ctx.shadowColor = playerColor
            ctx.shadowBlur = 15
            ctx.beginPath()
            ctx.arc(x, y, 22, 0, 2 * Math.PI)
            ctx.fill()
            ctx.shadowBlur = 0
          }

          // Nome do personagem
          if (character) {
            ctx.fillStyle = '#000000'
            ctx.font = isDragging ? 'bold 14px sans-serif' : 'bold 13px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillStyle = isDragging ? '#ffff00' : '#ffffff'
            ctx.strokeStyle = '#000000'
            ctx.lineWidth = 2
            ctx.strokeText(character.name, x, y - 25)
            ctx.fillText(character.name, x, y - 25)
          }
        }
      })

      // Desenhar NPCs
      npcs.forEach(npc => {
        if (npc.position_x !== null && npc.position_y !== null && npc.status === 'active') {
          const x = drawX + (npc.position_x * GRID_SIZE * scale) + (GRID_SIZE * scale) / 2
          const y = drawY + (npc.position_y * GRID_SIZE * scale) + (GRID_SIZE * scale) / 2

          // Verificar se está dentro da área visível
          if (x < 0 || x > containerWidth || y < 0 || y > containerHeight) return

          const isDragging = draggingNPC?.npc.id === npc.id

          // Círculo do NPC (usando a cor definida)
          ctx.fillStyle = npc.color
          ctx.beginPath()
          ctx.arc(x, y, isDragging ? 20 : 16, 0, 2 * Math.PI)
          ctx.fill()

          // Borda (mais escura para NPCs, destacada se estiver arrastando)
          ctx.strokeStyle = isDragging ? '#ffff00' : '#000000'
          ctx.lineWidth = isDragging ? 3 : 2
          ctx.stroke()

          // Sombra/glow se estiver arrastando
          if (isDragging) {
            ctx.shadowColor = npc.color
            ctx.shadowBlur = 15
            ctx.beginPath()
            ctx.arc(x, y, 20, 0, 2 * Math.PI)
            ctx.fill()
            ctx.shadowBlur = 0
          }

          // Nome do NPC
          ctx.fillStyle = '#000000'
          ctx.font = isDragging ? 'bold 13px sans-serif' : 'bold 12px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillStyle = isDragging ? '#ffff00' : '#ffffff'
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 2
          ctx.strokeText(npc.name, x, y - 25)
          ctx.fillText(npc.name, x, y - 25)
        }
      })
    }

    // Se já temos a imagem em cache e é a mesma URL, usar ela
    if (imageCacheRef.current && imageCacheRef.current.src === mapImageUrl) {
      drawImage(imageCacheRef.current)
    } else {
      // Carregar nova imagem
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        imageCacheRef.current = img // Cachear a imagem
        drawImage(img)
      }
      img.onerror = () => {
        console.error('Erro ao carregar imagem do mapa')
      }
      img.src = mapImageUrl
    }
  }, [selectedMap, mapImageUrl, players, playerCharacters, npcs, draggingNPC, draggingPlayer, user, gameId])

  // useEffect para redesenhar o mapa quando necessário (depois da definição de drawMap)
  useEffect(() => {
    if (selectedMap && canvasRef.current && mapImageUrl) {
      // Cancelar frame anterior se existir
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      // Usar requestAnimationFrame para suavizar o redraw
      animationFrameRef.current = requestAnimationFrame(() => {
        drawMap()
      })
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [selectedMap, mapImageUrl, players, playerCharacters, drawMap])

  const handleCanvasClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedMap || !user) return
    
    // Se for mestre e tiver NPC selecionado, posicionar NPC
    if (isMaster && selectedNPC) {
      await handleNPCPosition(e)
      return
    }
    
    // Se não tiver personagem, não pode posicionar
    if (!myCharacter) return

    const canvas = canvasRef.current
    if (!canvas) return

    // Obter transformações do MapContainer (zoom e pan)
    const containerZoom = mapTransform.zoom
    const containerPan = mapTransform.pan

    // Obter o elemento transformado (wrapper do MapContainer)
    const transformedWrapper = canvas.closest('[style*="transform"]') as HTMLElement
    if (!transformedWrapper) {
      console.error('Elemento transformado não encontrado')
      return
    }

    // Obter os rects: o canvas e o wrapper (ambos já transformados)
    const canvasRect = canvas.getBoundingClientRect()
    const wrapperRect = transformedWrapper.getBoundingClientRect()
    
    // Coordenadas do clique na viewport
    const viewportX = e.clientX
    const viewportY = e.clientY

    // O canvas está dentro de um wrapper com transform: translate(pan) scale(zoom) origin center
    // O getBoundingClientRect já retorna o rect transformado
    // Para inverter a transformação:
    
    // 1. Tamanho original do wrapper (sem transformação)
    const originalWrapperWidth = wrapperRect.width / containerZoom
    const originalWrapperHeight = wrapperRect.height / containerZoom
    
    // 2. Coordenadas do clique relativas ao wrapper transformado
    const relativeToWrapperX = viewportX - wrapperRect.left
    const relativeToWrapperY = viewportY - wrapperRect.top
    
    // 3. Centro do wrapper (transformado e original)
    const transformedCenterX = wrapperRect.width / 2
    const transformedCenterY = wrapperRect.height / 2
    const originalCenterX = originalWrapperWidth / 2
    const originalCenterY = originalWrapperHeight / 2
    
    // 4. Coordenadas relativas ao centro transformado
    const relativeToCenterX = relativeToWrapperX - transformedCenterX
    const relativeToCenterY = relativeToWrapperY - transformedCenterY
    
    // 5. Inverter a transformação: remover pan e zoom
    const withoutPanX = relativeToCenterX - containerPan.x
    const withoutPanY = relativeToCenterY - containerPan.y
    const withoutZoomX = withoutPanX / containerZoom
    const withoutZoomY = withoutPanY / containerZoom
    
    // 6. Voltar para coordenadas absolutas do wrapper original
    // Como o canvas ocupa 100% do wrapper, as coordenadas são as mesmas
    const clickX = withoutZoomX + originalCenterX
    const clickY = withoutZoomY + originalCenterY

    // Usar a posição e escala salvas do último desenho do mapa
    const drawX = mapDrawPos.x
    const drawY = mapDrawPos.y
    const scale = mapScale

    // Converter coordenadas do clique para coordenadas do mapa
    const mapX = clickX - drawX
    const mapY = clickY - drawY

    // Verificar se o clique está dentro do mapa
    if (mapX < 0 || mapY < 0) return

    // Converter para coordenadas da grade (considerando a escala do mapa)
    const gridX = Math.floor(mapX / (GRID_SIZE * scale))
    const gridY = Math.floor(mapY / (GRID_SIZE * scale))

    // Verificar se está dentro dos limites do mapa
    if (gridX < 0 || gridY < 0) return

    try {
      // Atualizar posição no banco
      const currentPlayer = players.find(p => p.user_id === user.id)
      if (currentPlayer) {
        await updatePlayerPosition(gameId, user.id, gridX, gridY)

        // Publicar no Ably para sincronização em tempo real
        const channel = getAblyChannel(`game:${gameId}:map`)
        if (channel) {
          channel.publish('player_moved', {
            playerId: currentPlayer.id,
            x: gridX,
            y: gridY,
          })
        }

        // Atualizar localmente
        setPlayers(prev => prev.map(p => 
          p.user_id === user.id ? { ...p, position_x: gridX, position_y: gridY } : p
        ))
      }
    } catch (err) {
      console.error('Erro ao atualizar posição:', err)
      alert('Erro ao mover personagem')
    }
  }

  if (maps.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-700 p-6 text-center">
          <p className="text-gray-400">Nenhum mapa disponível. O mestre precisa fazer upload de um mapa.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Seletor de Mapa (se houver múltiplos mapas - apenas mestre) */}
      {isMaster && maps.length > 1 && (
        <div className="absolute top-4 left-20 z-10">
          <select
            value={selectedMap?.id || ''}
            onChange={(e) => {
              const map = maps.find(m => m.id === e.target.value)
              if (map) setSelectedMap(map)
            }}
            className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {maps.map(map => (
              <option key={map.id} value={map.id}>
                {map.filename || `Mapa ${map.id.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-gray-950">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={(draggingNPC || draggingPlayer) ? 'cursor-grabbing w-full h-full' : 'cursor-crosshair w-full h-full'}
        />
      </div>
    </>
  )
}
