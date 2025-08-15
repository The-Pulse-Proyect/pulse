
import ElectronNavbar from './app/components/navbar/navbar'
import './App.css'
import { MediaPlayerBar } from './app/components/player-controls/player-controls'
import { useMusicStore } from './store/useMusic'
import { Sidebar } from './app/components/sidebar/sidebar'
import { useEffect, useState } from 'react'

function App() {
  const { currentSong } = useMusicStore();
  const [miniMode, setMiniMode] = useState(false);

  useEffect(() => {
    // Escuchar evento de modo mini usando la API segura del preload
    const handleMiniMode = (_event: Event) => {
      const e = _event as CustomEvent;
      setMiniMode(!!e.detail);
    };

    // Registrar el evento personalizado
    window.addEventListener('mini-mode', handleMiniMode);

    return () => {
      window.removeEventListener('mini-mode', handleMiniMode);
    };
  }, []);

  if (miniMode) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center select-none">
        {/* Contenido centrado y arrastrable */}
        <div 
          className="absolute inset-0"
          style={{ 
            // @ts-expect-error - propiedad específica de electron
            WebkitAppRegion: 'drag' 
          }}
        />
        <span className="text-lg font-bold text-white animate-pulse relative z-10">
          En Desarrollo
        </span>
        <div 
          className="absolute bottom-4 flex gap-2"
          style={{ 
            // @ts-expect-error - propiedad específica de electron
            WebkitAppRegion: 'no-drag'
          }}
        >
          <button
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors text-white"
            onClick={() => window.electronAPI.closeApp()}
          >
            Cerrar
          </button>
          <button
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors text-white"
            onClick={() => window.electronAPI.maximizeApp()}
          >
            Restaurar
          </button>
          <button
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors text-white"
            onClick={() => window.electronAPI.minimizeApp()}
          >
            Ocultar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='relative flex flex-col h-screen text-white bg-slate-900 overflow-hidden'>
      {/* Fondo con la portada actual */}
      {currentSong?.coverUrl && (
        <div 
          className="fixed inset-0 pointer-events-none" 
          style={{
            backgroundImage: `url(${currentSong.coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(5px)',
            transform: 'scale(1.2)',
            opacity: '0.5',
            transition: 'all 0.5s ease-out'
          }}
        />
      )}
      {/* Gradientes oscuros superpuestos */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80" />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(17,24,39,0.3) 50%, rgba(17,24,39,0.9) 100%)'
        }} />
      </div>

      <div className="sticky top-0 z-50">
        <ElectronNavbar />
      </div>
      {/* Contenedor principal con sidebar */}
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 flex flex-col transition-all duration-300">
          <div className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
            </div>
          </div>
          <MediaPlayerBar />
        </main>
      </div>
    </div>
  )
}

export default App
