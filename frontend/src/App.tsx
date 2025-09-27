
import ElectronNavbar from './app/components/navbar/navbar'
import './App.css'
import { MediaPlayerBar } from './app/components/player-controls/player-controls'
import { useMusicStore } from './store/useMusic'
import { Sidebar } from './app/components/sidebar/sidebar'
import { useEffect, useRef, useState } from 'react'
import MiniMusicPlayer from './app/mini-mode/mini-mode'

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

  return (
    <>
    {miniMode &&
      <MiniMusicPlayer></MiniMusicPlayer>
    }
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
    </>
  )
}

export default App
