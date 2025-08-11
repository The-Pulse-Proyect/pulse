"use client"

import {Minus, X, MoreVertical, Settings, Info, FileText, HelpCircle, Maximize, Minimize} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useMusicStore } from '@/store/useMusic';

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
      {currentSong.coverUrl && (
        <img 
          src={currentSong.coverUrl} 
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ElectronNavbar() {
  const { toggleMiniMode } = useMusicStore();

  const handleMinimize = () => {
    window.electronAPI.minimizeApp()
  }

  const handleMaximize = () => {
    window.electronAPI.maximizeApp()
  }



  const handleClose = async () => {
    window.electronAPI.closeApp()
  }

  const handleMenuAction = (action: string) => {
    console.log(`Acción del menú: ${action}`)
  }

  return (
    <div className="flex items-center justify-between h-12 bg-slate-900/95 border-b border-slate-800 select-none p-0 w-full relative backdrop-blur-sm">
      {/* Menú lateral izquierdo */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            // h-full para ocupar todo el alto, w-12 para un ancho fijo, rounded-none para esquinas cuadradas
            // p-0 y flex items-center justify-center para centrar el icono
            className="h-full w-12 rounded-none p-0 flex items-center justify-center hover:bg-gray-700 text-gray-300 hover:text-white"
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
          <DropdownMenuItem onClick={() => toggleMiniMode()}>
            <Minimize className="mr-2 h-4 w-4" />
            <span>Modo Mini</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMenuAction("configuracion")}>
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.electronAPI.openConfigFolder()}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Abrir Carpeta de Configuración</span>
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

      {/* Título de la aplicación / Canción actual */}
      <div className="flex-1 text-center px-4">
        <CurrentSongTitle />
      </div>

      {/* Controles de ventana - lado derecho */}
      <div className="flex items-center h-full">
        <Button
          variant="ghost"
          // h-full para ocupar todo el alto, w-12 para un ancho fijo, rounded-none para esquinas cuadradas
          // p-0 y flex items-center justify-center para centrar el icono
          className="h-full w-12 rounded-none p-0 flex items-center justify-center hover:bg-gray-700 text-gray-300 hover:text-white"
          onClick={handleMinimize}
        >
          <Minus className="h-4 w-4" />
          <span className="sr-only">Minimizar</span>
        </Button>
          <Button
          variant="ghost"
          // h-full para ocupar todo el alto, w-12 para un ancho fijo, rounded-none para esquinas cuadradas
          // p-0 y flex items-center justify-center para centrar el icono
          className="h-full w-12 rounded-none p-0 flex items-center justify-center hover:bg-gray-700 text-gray-300 hover:text-white"
          onClick={handleMaximize}
        >
          <Maximize className="h-4 w-4" />
          <span className="sr-only">Maximizar</span>
        </Button>

        <Button
          variant="ghost"
          // h-full para ocupar todo el alto, w-12 para un ancho fijo, rounded-none para esquinas cuadradas
          // p-0 y flex items-center justify-center para centrar el icono
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
