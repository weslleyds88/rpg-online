'use client'

import React, { useState, useRef, useEffect } from 'react'
import InteractiveMap from './InteractiveMap'
import NPCSelectionIndicator from './NPCSelectionIndicator'
import type { Character } from '@/lib/supabase/types'

interface MapContainerProps {
  gameId: string
  isMaster: boolean
  myCharacter: Character | null
  sidebarWidth: number
  leftPanelWidth?: number
}

// Context para compartilhar transformações do mapa
export const MapTransformContext = React.createContext<{
  zoom: number
  pan: { x: number; y: number }
}>({ zoom: 1, pan: { x: 0, y: 0 } })

export default function MapContainer({ gameId, isMaster, myCharacter, sidebarWidth, leftPanelWidth = 0 }: MapContainerProps) {
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom((prev) => Math.max(0.5, Math.min(3, prev * delta)))
    }

    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Apenas arrastar com botão direito ou com Shift pressionado
    if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp)
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-gray-950 overflow-hidden"
      style={{ 
        right: `${sidebarWidth}px`,
        left: `${leftPanelWidth}px`
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-700 p-2">
        <button
          onClick={() => setZoom((prev) => Math.min(3, prev + 0.1))}
          className="px-3 py-1.5 text-xs font-medium text-white bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <div className="px-3 py-1 text-xs text-center text-gray-300 border-t border-b border-gray-700">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
          className="px-3 py-1.5 text-xs font-medium text-white bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={() => {
            setZoom(1)
            setPan({ x: 0, y: 0 })
          }}
          className="px-3 py-1.5 text-xs font-medium text-white bg-gray-800 hover:bg-gray-700 rounded transition-colors mt-1"
          title="Reset"
        >
          ⟲
        </button>
      </div>

      {/* Map Wrapper with Transform */}
      <MapTransformContext.Provider value={{ zoom, pan }}>
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          <InteractiveMap gameId={gameId} isMaster={isMaster} myCharacter={myCharacter} />
        </div>
      </MapTransformContext.Provider>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-700 px-4 py-2">
        <p className="text-xs text-gray-300">
          💡 Clique no mapa para posicionar • Scroll para zoom • Shift+Arraste para mover
        </p>
      </div>

      {/* Indicador de NPC selecionado (apenas mestre) */}
      {isMaster && (
        <NPCSelectionIndicator />
      )}
    </div>
  )
}
