"use client"

import { Play, Pause, SkipBack, SkipForward, Heart, X, Minus, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMusicStore } from "@/store/useMusic"
import { next, previus } from "@/lib/howler/hwoler"
import { ProgressBar } from "../components/player-controls/progress-bar"
import { useState, useRef, useEffect } from "react"

export default function MiniMusicPlayer() {
  const [currentTime, setCurrentTime] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [titleWidth, setTitleWidth] = useState(0)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragAreaRef = useRef<HTMLDivElement>(null)
  
  const { currentSong, toggleLike, setIsPlaying, isPlaying } = useMusicStore.getState()

  // Verificar si el título necesita animación y medir su ancho
  useEffect(() => {
    const checkOverflow = () => {
      if (titleRef.current && containerRef.current) {
        const width = titleRef.current.scrollWidth
        const containerWidth = containerRef.current.clientWidth
        setTitleWidth(width)
        setShouldAnimate(width > containerWidth)
      }
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [currentSong?.title])

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.tauriAPI.minimizeApp()
  }

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.tauriAPI.maximizeApp()
  }

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation()
    window.tauriAPI.closeApp()
  }

  const handleProgressChange = (value: number[]) => {
    setCurrentTime(value[0])
  }

  const handleDragStart = (e: React.MouseEvent) => {
    if (dragAreaRef.current && dragAreaRef.current.contains(e.target as Node)) {
      setIsDragging(true)
      window.tauriAPI.dragWindow()
    }
  }

  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false)
      window.tauriAPI.saveMiniWindowPosition()
    }
  }

  return (
    <div 
      className="w-full max-w-[340px] h-[180px] mx-auto bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 shadow-2xl border border-slate-700 flex flex-col overflow-hidden select-none"
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      
      {/* Barra superior estilo Windows */}
      <div className="h-6 bg-slate-900/90 flex items-center border-b border-slate-700">
        {/* Área de arrastre - TODO el espacio antes de los botones con el nombre de la app */}
        <div 
          ref={dragAreaRef}
          className="flex-1 h-full flex items-center px-2 text-xs text-slate-400 font-medium"
          onMouseDown={handleDragStart}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <span>Pulse Music</span>
        </div>
        
        {/* Botones de control - NO arrastrables */}
        <div className="flex items-center h-full" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className="w-8 h-full flex items-center justify-center hover:bg-slate-700/70" 
            title="Minimizar" 
            onClick={handleMinimize}
          >
            <Minus className="h-3 w-3 text-slate-300" />
          </button>
          <button 
            className="w-8 h-full flex items-center justify-center hover:bg-slate-700/70" 
            title="Maximizar" 
            onClick={handleMaximize}
          >
            <Square className="h-3 w-3 text-slate-300" />
          </button>
          <button 
            className="w-8 h-full flex items-center justify-center hover:bg-red-600/80" 
            title="Cerrar" 
            onClick={handleClose}
          >
            <X className="h-3 w-3 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 p-3 gap-3 overflow-hidden">
        {/* Album Art */}
        <div className="w-[100px] h-[100px] relative flex-shrink-0 rounded-xl overflow-hidden shadow-xl">
          <img 
            src={currentSong?.cover_url || '/pulse.png'} 
            alt="Album cover" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Info + Controles + Barra */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Título y Artista con animación infinita en una sola dirección */}
          <div className="mb-1">
            {/* Contenedor del título con efecto de desvanecimiento en los bordes */}
            <div 
              ref={containerRef}
              className="w-full overflow-hidden whitespace-nowrap relative"
              style={{
                maskImage: 'linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%)'
              }}
            >
              {shouldAnimate ? (
                // Versión con animación: duplicamos el título para efecto continuo
                <div className="inline-block animate-marquee-single-direction" style={{ animationDuration: `${Math.max(8, titleWidth / 15)}s` }}>
                  <span className="text-white font-semibold text-[14px] leading-tight">
                    {currentSong?.title || 'Sin canción'}
                  </span>
                  <span className="text-white font-semibold text-[14px] leading-tight ml-8">
                    {currentSong?.title || 'Sin canción'}
                  </span>
                </div>
              ) : (
                // Versión sin animación (título cabe en el espacio)
                <h3 
                  ref={titleRef}
                  className="text-white font-semibold text-[14px] leading-tight inline-block"
                >
                  {currentSong?.title || 'Sin canción'}
                </h3>
              )}
            </div>
            <p className="text-slate-400 text-[12px] truncate mt-0.5">{currentSong?.artist || 'Desconocido'}</p>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between mt-2 mb-1">
            <div className="flex items-center gap-2">
              <Button onClick={previus} variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </Button>
              <Button onClick={next} variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Like */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${currentSong && currentSong.isLiked ? "text-orange-500" : "text-slate-400"} hover:text-orange-400 hover:bg-slate-700/50`}
                onClick={() => currentSong && toggleLike(currentSong.id)}
              >
                <Heart className={`h-4 w-4 ${currentSong && currentSong.isLiked ? "fill-current" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mt-1">
            <ProgressBar
              currentTime={currentTime}
              duration={currentSong?.duration_raw || 0}
              onProgressChange={handleProgressChange}
            />
          </div>
        </div>
      </div>

      {/* Estilos para la animación infinita en una sola dirección */}
      <style>{`
        @keyframes marqueeSingleDirection {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-marquee-single-direction {
          animation: marqueeSingleDirection linear infinite;
          will-change: transform;
          display: inline-flex;
          gap: 2rem;
        }
        
        .animate-marquee-single-direction:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}