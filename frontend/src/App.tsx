import ElectronNavbar from './app/components/navbar/navbar'
import './App.css'
import { MediaPlayerBar } from './app/components/player-controls/player-controls'
import { useMusicStore } from './store/useMusic'
import { Button } from './components/ui/button'
import { Music } from 'lucide-react'
import { Sidebar } from './app/components/sidebar/sidebar'

function App() {
  const { addSongsToPlaylist, currentSong } = useMusicStore();

  const handleOpenFile = async () => {
    try {
      const filePaths = await window.electronAPI.openFile();
      
      if (filePaths && Array.isArray(filePaths) && filePaths.length > 0) {
        const songMetadata = await window.electronAPI.processMetadata(filePaths);
        if (songMetadata && Array.isArray(songMetadata)) {
          addSongsToPlaylist(songMetadata);
        }
      }
    } catch (error) {
      console.error('Error al cargar archivos:', error);
    }
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
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-orange-400">Mi Reproductor de Pulso</h1>
                <Button
                  onClick={handleOpenFile}
                  className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-gray-900 shadow-lg shadow-orange-500/20 hover:shadow-orange-400/30 hover:scale-105 transition-all active:scale-95 font-semibold"
                >
                  <Music className="w-4 h-4" strokeWidth={2.5} />
                  Cargar Música
                </Button>
              </div>
            </div>
          </div>
          <MediaPlayerBar />
        </main>
      </div>
    </div>
  )
}

export default App
