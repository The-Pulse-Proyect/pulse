"use client"

import { Minus, X, MoreVertical, Settings, Info, FileText, HelpCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ElectronNavbar() {
  const handleMinimize = () => {
    // En una app real de Electron, usarías:
    window.electronAPI.minimizeApp()
    console.log("Minimizar ventana")
  }

  const handleClose = async () => {
    // En una app real de Electron, usarías:
    window.electronAPI.closeApp()
    console.log("Cerrar ventana")
  }

  const handleMenuAction = (action: string) => {
    console.log(`Acción del menú: ${action}`)
  }

  return (
    <div className="flex items-center justify-between h-12 bg-[#2b2b2b] border-b border-gray-800 select-none p-0">
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

      {/* Título de la aplicación (opcional) */}
      <div className="flex-1 text-center px-4"> {/* Padding horizontal para el título */}
        <span className="text-sm font-medium text-gray-300">
          Mi Aplicación Electron
        </span>
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
