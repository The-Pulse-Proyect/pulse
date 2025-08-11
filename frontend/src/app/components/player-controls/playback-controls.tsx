import { Button } from "@/components/ui/button"
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Music2 } from 'lucide-react'

interface PlaybackControlsProps {
  isPlaying: boolean
  isShuffled: boolean
  repeatMode: boolean
  onPlayPause: () => void
  onShuffle: () => void
  onPrevious: () => void
  onNext: () => void
  onRepeat: () => void
}

export function PlaybackControls({
  isPlaying,
  isShuffled,
  repeatMode,
  onPlayPause,
  onShuffle,
  onPrevious,
  onNext,
  onRepeat
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Shuffle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onShuffle}
        className={`h-9 w-9 rounded-lg transition-all duration-200 ${
          isShuffled 
            ? 'text-orange-400 bg-orange-400/10 hover:bg-orange-400/20' 
            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
        }`}
      >
        <Shuffle className="w-4 h-4 fill-current" />
      </Button>

      {/* Previous */}
      <Button
      
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        className="h-9 w-9 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
      >
        <SkipBack className="w-4 h-4 fill-current" />
      </Button>

      {/* Play/Pause */}
      <Button
        onClick={onPlayPause}
        className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-400 text-gray-900 shadow-lg transition-all duration-200 hover:scale-105 p-0"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current ml-0.5" />
        )}
      </Button>

      {/* Next */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        className="h-9 w-9 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
      >
        <SkipForward className="w-4 h-4 fill-current" />
      </Button>

      {/* Repeat */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRepeat}
        className={`h-9 w-9 rounded-lg transition-all duration-200 ${
          repeatMode 
            ? 'text-orange-400 bg-orange-400/10 hover:bg-orange-400/20' 
            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
        }`}
      >
        <Repeat className="w-4 h-4 fill-current" />
      </Button>
    </div>
  )
}
