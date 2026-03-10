"use client"

import { Minus, X, MoreVertical, Settings, Info, FileText, HelpCircle, Maximize, Minimize2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useMusicStore } from '@/store/useMusic';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function CurrentSongTitle() {
  const { currentSong } = useMusicStore();

  if (!currentSong) {
    return (
      <span className="text-sm font-medium text-gray-300">
        Pulse - Reproductor de Música
      </span>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      {currentSong.cover_url && (
        <img 
          src={currentSong.cover_url} 
          alt={currentSong.title} 
          className="w-6 h-6 rounded-sm object-cover"
        />
      )}
      <div className="flex flex-col items-center">
        <span className="text-sm font-medium text-orange-400">
          {currentSong.title}
        </span>
        <span className="text-xs text-gray-400">
          {currentSong.artist}
        </span>
      </div>
    </div>
  );
}

export default function TauriNavbar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Verificar el estado inicial de maximizado
  useEffect(() => {
    const checkMaximized = async () => {
      try {
        const maximized = await window.tauriAPI.isWindowMaximized()
        setIsMaximized(maximized as boolean)
      } catch (error) {
        console.error("Error checking maximized state:", error)
      }
    }
    
    checkMaximized()
    
    // Escuchar cambios en el estado de la ventana (cada segundo)
    const checkInterval = setInterval(checkMaximized, 1000)
    
    return () => clearInterval(checkInterval)
  }, [])

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.tauriAPI.minimizeApp()
  }

  const handleMaximizeRestore = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isMaximized) {
      await window.tauriAPI.restoreWindow()
      setIsMaximized(false)
    } else {
      await window.tauriAPI.maximizeApp()
      setIsMaximized(true)
    }
  }

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation()
    window.tauriAPI.closeApp()
  }

  const handleDragStart = () => {
    setIsDragging(true)
    window.tauriAPI.dragMainWindow()
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleMenuAction = (action: string) => {
    console.log(`Acción del menú: ${action}`)
  }

  return (
    <div 
      className="flex items-center justify-between h-12 bg-slate-900/95 border-b border-slate-800 select-none p-0 w-full relative backdrop-blur-sm"
      onMouseUp={handleDragEnd}
    >
      {/* Menú lateral izquierdo - Este botón NO debe iniciar el arrastre */}
      <div 
        className="h-full"
        onMouseDown={handleDragStart}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-full w-12 rounded-none p-0 flex items-center justify-center hover:bg-gray-700 text-gray-300 hover:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => handleMenuAction("nuevo")}>
              <FileText className="mr-2 h-4 w-4" />
              Nuevo archivo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleMenuAction("configuracion")}>
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleMenuAction("ayuda")}>
              <HelpCircle className="mr-2 h-4 w-4" />
              Ayuda
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleMenuAction("acerca")}>
              <Info className="mr-2 h-4 w-4" />
              Acerca de
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Título de la aplicación / Canción actual - También arrastrable */}
      <div 
        className="flex-1 text-center px-4 h-full flex items-center justify-center"
        onMouseDown={handleDragStart}
      >
        <CurrentSongTitle />
      </div>

      {/* Controles de ventana - lado derecho (NO arrastrables) */}
      <div className="flex items-center h-full" onMouseDown={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          className="h-full w-12 rounded-none p-0 flex items-center justify-center hover:bg-gray-700 text-gray-300 hover:text-white"
          onClick={handleMinimize}
        >
          <Minus className="h-4 w-4" />
          <span className="sr-only">Minimizar</span>
        </Button>
        
        <Button
          variant="ghost"
          className="h-full w-12 rounded-none p-0 flex items-center justify-center hover:bg-gray-700 text-gray-300 hover:text-white"
          onClick={handleMaximizeRestore}
        >
          {isMaximized ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
          <span className="sr-only">{isMaximized ? 'Restaurar' : 'Maximizar'}</span>
        </Button>

        <Button
          variant="ghost"
          className="h-full w-12 rounded-none p-0 flex items-center justify-center hover:bg-red-600 text-gray-300 hover:text-white"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </Button>
      </div>
    </div>
  )
}