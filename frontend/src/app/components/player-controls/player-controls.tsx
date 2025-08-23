import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from 'lucide-react'
import { PlaybackControls } from "./playback-controls"
import { ProgressBar } from "./progress-bar"
import { CurrentPlaylist } from "../playlist-manager/current-playlist"
import { useMusicStore } from "@/store/useMusic"
import "./scrollbar.css"
import { CavaVisualizer } from "../cava/cava-visualizer"
import { useSoundStore } from "@/store/useSound"
import { next, previus } from "@/lib/howler/hwoler"
import VolumeControl from "./volume-control"

export function MediaPlayerBar() {
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0)


  const { currentSong, isPlaying, setIsPlaying, toggleLike } = useMusicStore()
  const { currentSound, isShuffled, setIsShuffled, repeatMode, setRepeatMode } = useSoundStore()
  
  const handleProgressChange = (value: number[]) => {
    setCurrentTime(value[0])
  }

  // Pausar/reanudar cuando cambia isPlaying
  useEffect(() => {
    if (currentSound) {
      if (isPlaying) {
        currentSound.play();
      } else {
        currentSound.pause();
      }
    }
  }, [isPlaying, currentSound]);

  

  return (
    <div className="w-full border-t border-gray-800">
      <div className="flex flex-col">
        {/* Panel de controles principal */}
        <div className="relative flex flex-col bg-gradient-to-b from-gray-900/95 to-gray-900">
          {/* Visualizador */}
          {currentSong && (
            <div className="absolute inset-x-0 -top-20 h-20">
              <CavaVisualizer  />
            </div>
          )}
          
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex flex-1 w-full items-center gap-8">
              {/* Controles de reproducción */}
              <PlaybackControls
                isPlaying={isPlaying}
                isShuffled={isShuffled}
                repeatMode={repeatMode}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onShuffle={() => setIsShuffled(!isShuffled)}
                onPrevious={previus}
                onNext={next}
                onRepeat={() => setRepeatMode(!repeatMode)}
              />
              
              {/* Barra de progreso */}
              <div className="w-full">
                <ProgressBar
                  currentTime={currentTime}
                  duration={currentSong?.durationRaw || 0}
                  onProgressChange={handleProgressChange}
                />
              </div>
            </div>
            
            {/* Botón de Me gusta */}
            <div className="flex gap-x-2">

              <VolumeControl volume={volume} onVolumeChange={setVolume}/>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => currentSong && toggleLike(currentSong.id)}
                className={`p-2 h-8 w-8 rounded-lg transition-all duration-200 ${
                  currentSong?.isLiked
                  ? 'text-orange-400 hover:text-orange-300 bg-orange-400/10 hover:bg-orange-400/20' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
                >
                <Heart className={`w-4 h-4 ${currentSong?.isLiked ? 'fill-current' : ''}`} />
              </Button>
            </div>

            
          </div>
        </div>

        {/* Cola de reproducción */}
        <CurrentPlaylist />
      </div>
    </div>
  )
}
