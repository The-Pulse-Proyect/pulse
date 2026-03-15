import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from 'lucide-react'
import { PlaybackControls } from "./playback-controls"
import { ProgressBar } from "./progress-bar"
import { CurrentPlaylist } from "../playlist-manager/current-playlist"
import { useMusicStore } from "@/store/useMusic"
import "./scrollbar.css"
import { useSoundStore } from "@/store/useSound"
import { next, previus } from "@/lib/howler/hwoler"
import { useHotkeys } from "@/hooks/useHotkeys.ts";
import VolumeControl from "./volume-control"
import { CavaVisualizer } from "../cava/cava-visualizer"

export function MediaPlayerBar() {
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(100)
  const [showVolume, setShowVolume] = useState(false)
  const volumeAutoHideRef = useRef<number | null>(null)
  const isKeyVolumeRef = useRef(false)


  const { currentSong, isPlaying, setIsPlaying, toggleLike } = useMusicStore()
  const { currentSound, isShuffled, toggleShuffle, repeatMode, toggleRepeatMode } = useSoundStore()
  
  const handleProgressChange = (value: number[]) => {
    setCurrentTime(value[0])
  }

  // Sync volume to the current sound when volume or currentSound changes
  useEffect(() => {
    if (!currentSound) return;
    try { (currentSound as HTMLMediaElement).volume = Math.min(1, Math.max(0, volume / 100)); } catch { /* ignore */ }
  }, [volume, currentSound]);

  useHotkeys('space', () => setIsPlaying(!isPlaying))
  useHotkeys('arrowright', () => {
    if (!currentSong || !currentSound) return;
    try { (currentSound as HTMLMediaElement).currentTime += 5 } catch (e) { console.warn('Error seeking forward', e); }
  })
  useHotkeys('arrowleft', () => {
    if (!currentSong || !currentSound) return;
    try { (currentSound as HTMLMediaElement).currentTime -= 5 } catch (e) { console.warn('Error seeking backward', e); }
  })
  useHotkeys('shift+arrowright', next)
  useHotkeys('shift+arrowleft', previus)
  useHotkeys('arrowdown', () => {
    setVolume(prev => {
      const newVol = Math.max(0, prev - 5)
      // Show volume modal and auto-hide
      setShowVolume(true)
      isKeyVolumeRef.current = true
      if (volumeAutoHideRef.current) clearTimeout(volumeAutoHideRef.current)
      volumeAutoHideRef.current = window.setTimeout(() => { setShowVolume(false); isKeyVolumeRef.current = false }, 1500)
      return newVol
    })
  })
  useHotkeys('arrowup', () => {
    setVolume(prev => {
      const newVol = Math.min(100, prev + 5)
      // Show volume modal and auto-hide
      setShowVolume(true)
      isKeyVolumeRef.current = true
      if (volumeAutoHideRef.current) clearTimeout(volumeAutoHideRef.current)
      volumeAutoHideRef.current = window.setTimeout(() => { setShowVolume(false); isKeyVolumeRef.current = false }, 1500)
      return newVol
    })
  })

  // Cleanup volume auto-hide timer on unmount
  useEffect(() => {
    return () => {
      if (volumeAutoHideRef.current) {
        clearTimeout(volumeAutoHideRef.current)
        volumeAutoHideRef.current = null
      }
    }
  }, [])

  // Pausar/reanudar cuando cambia isPlaying
  useEffect(() => {
    if (currentSound) {
      if (isPlaying) {
        try { (currentSound as HTMLMediaElement).play().catch((err) => { console.warn('Audio play failed', err); setIsPlaying(false); }); } catch (e) { console.warn('Audio play error', e); setIsPlaying(false); }
      } else {
        try { (currentSound as HTMLMediaElement).pause(); } catch (e) { console.warn('Audio pause error', e); }
      }
    }
  }, [isPlaying, currentSound, setIsPlaying]);

  // Reset progress bar when the song changes
  useEffect(() => {
    setCurrentTime(0);
  }, [currentSong]);

  return (
    <div className="w-full border-t border-gray-800">
      <div className="flex flex-col">
        {/* Panel de controles principal */}
        <div className="relative flex flex-col bg-linear-to-b from-gray-900/95 to-gray-900">
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
                onShuffle={toggleShuffle}
                onPrevious={previus}
                onNext={next}
                onRepeat={toggleRepeatMode}
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

              <VolumeControl
                volume={volume}
                onVolumeChange={setVolume}
                isOpen={showVolume}
                onVisibleChange={(v) => {
                  setShowVolume(v)
                  if (!v) {
                    isKeyVolumeRef.current = false
                    if (volumeAutoHideRef.current) {
                      clearTimeout(volumeAutoHideRef.current);
                      volumeAutoHideRef.current = null
                    }
                  }
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => currentSong && toggleLike(currentSong.id)}
                className={`p-2 h-8 w-8 rounded-lg transition-all duration-200 ${
                  currentSong?.isLiked
                  ? 'text-accent hover:text-accent bg-accent-10 hover:bg-accent-20' 
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