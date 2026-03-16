import TauriNavbar from './app/components/navbar/navbar'
import './App.css'
import { MediaPlayerBar } from './app/components/player-controls/player-controls'
import { useMusicStore } from './store/useMusic'
import { Sidebar } from './app/components/sidebar/sidebar'
import { useEffect, useState } from 'react'
import MiniMusicPlayer from './app/mini-mode/mini-mode'
import { DropZone } from './app/components/drop-zone/drop-zone'
function App() {
  const { currentSong } = useMusicStore();
  const [miniMode, setMiniMode] = useState(false);

  useEffect(() => {
    const handleMiniMode = (_event: Event) => {
      const e = _event as CustomEvent;
      setMiniMode(!!e.detail);
    };

    // Prevenir menú contextual en toda la app
    const preventContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable;
      
      // Permitir clic derecho SOLO en inputs y si se mantiene Shift (para debug)
      if (!isInput && !e.shiftKey) {
        e.preventDefault();
      }
    };

    // Prevenir atajos del navegador
    const preventBrowserShortcuts = (e: KeyboardEvent) => {
      // Prevenir Ctrl+S, Ctrl+P, etc.
      if (e.ctrlKey) {
        switch(e.key.toLowerCase()) {
          case 's': // Guardar
          case 'p': // Imprimir
          case 'u': // Ver código fuente
          case 'f': // Buscar
          case 'h': // Historial
          case 'r': // Recargar
            e.preventDefault();
            break;
        }
      }
      
      // Prevenir F5
      if (e.key === 'F5') {
        e.preventDefault();
      }
      
      // Prevenir Ctrl+Shift+I (DevTools) pero permitir F12
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', preventContextMenu);
    window.addEventListener('keydown', preventBrowserShortcuts);
    window.addEventListener('mini-mode', handleMiniMode);
    
    return () => {
      window.removeEventListener('contextmenu', preventContextMenu);
      window.removeEventListener('keydown', preventBrowserShortcuts);
      window.removeEventListener('mini-mode', handleMiniMode);
    };
  }, []);

  return (
    <>
      {miniMode && <MiniMusicPlayer />}
      
      {/* Envolver con DropZone */}
      <DropZone>
        <div className='relative flex flex-col h-screen text-white bg-slate-900 overflow-hidden' style={{
          display: miniMode ? "none" : "flex"
        }}>
          {/* Fondo dinámico con la portada actual */}
          <div className="background-artwork">
            <div className="artwork-container">
              {currentSong?.coverUrl ? (
                <>
                  <div 
                    className="artwork-image animate-fade-in"
                    style={{
                      backgroundImage: `url(${currentSong.coverUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                  <div className="artwork-overlay" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
              )}
            </div>
          </div>
          
          {/* Gradientes de ambiente */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div 
              className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent opacity-90"
              style={{ mixBlendMode: 'multiply' }}
            />
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 60%)',
                mixBlendMode: 'soft-light'
              }}
            />
          </div>

          <div className="sticky top-0 z-50">
            <TauriNavbar />
          </div>
          
          {/* Contenedor principal con sidebar */}
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 flex flex-col transition-all duration-300">
              <div className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">
                  {/* Aquí va tu contenido principal */}
                </div>
              </div>
              <MediaPlayerBar />
            </main>
          </div>
        </div>
      </DropZone>
    </>
  )
}

export default App