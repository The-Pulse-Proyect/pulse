

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from 'lucide-react'
import { PlaybackControls } from "./playback-controls"
import { ProgressBar } from "./progress-bar"
import { CurrentPlaylist } from "../playlist-manager/current-playlist"

// Estilos personalizados para la barra de desplazamiento
import "./scrollbar.css"

export function MediaPlayerBar() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration] = useState(240) // 4:00 in seconds
  const [isLiked, setIsLiked] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState(false)

  const handleProgressChange = (value: number[]) => {
    setCurrentTime(value[0])
  }

  return (
    <div className="fixed bottom-0 left-0 right-0">
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col">
          {/* Panel de controles principal */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-gray-900/95 to-gray-900">
            <div className="flex items-center gap-8">
              {/* Controles de reproducción */}
              <PlaybackControls
                isPlaying={isPlaying}
                isShuffled={isShuffled}
                repeatMode={repeatMode}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onShuffle={() => setIsShuffled(!isShuffled)}
                onPrevious={() => {}}
                onNext={() => {}}
                onRepeat={() => setRepeatMode(!repeatMode)}
              />
              
              {/* Barra de progreso */}
              <div className="w-96">
                <ProgressBar
                  currentTime={currentTime}
                  duration={duration}
                  onProgressChange={handleProgressChange}
                />
              </div>
            </div>

            {/* Botón de Me gusta */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLiked(!isLiked)}
              className={`p-2 h-8 w-8 rounded-lg transition-all duration-200 ${
                isLiked 
                  ? 'text-orange-400 hover:text-orange-300 bg-orange-400/10 hover:bg-orange-400/20' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* Cola de reproducción */}
          <CurrentPlaylist />
        </div>
      </div>
    </div>
  )
}