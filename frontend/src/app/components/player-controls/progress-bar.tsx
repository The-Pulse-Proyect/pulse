import { Slider } from "@/components/ui/slider"
import { useSoundStore } from "@/store/useSound"
import { useEffect, useRef, useCallback } from "react"

interface ProgressBarProps {
  currentTime: number
  duration: number
  onProgressChange: (value: number[]) => void
}

export function ProgressBar({ currentTime, duration, onProgressChange }: ProgressBarProps) {
  const { currentSound } = useSoundStore();
  const isDraggingRef = useRef(false);
  const updateIntervalRef = useRef<NodeJS.Timeout>();
  
  const formatTime = (seconds: number) => {
    const roundedSeconds = Math.round(seconds)
    const mins = Math.floor(roundedSeconds / 60)
    const secs = roundedSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const updateProgress = useCallback(() => {
    if (!currentSound) return;

    const seek = currentSound.seek();
    if (typeof seek === 'number') {
      onProgressChange([Math.round(seek)]);
    }
  }, [currentSound, onProgressChange]);

  const startProgressInterval = useCallback(() => {
    const updateProgress = () => {
      if (!isDraggingRef.current) {
        const seek = currentSound?.seek();
        if (typeof seek === 'number') {
          onProgressChange([Math.round(seek)]);
        }
      }
    };

    // Limpiar intervalo existente
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    
    // Iniciar nuevo intervalo
    updateIntervalRef.current = setInterval(updateProgress, 100);
    // Actualización inmediata
    updateProgress();
  }, [currentSound, onProgressChange]);

  // Efecto para manejar las actualizaciones del progreso
  useEffect(() => {
    if (!currentSound) return;
    startProgressInterval();

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [currentSound, startProgressInterval]);

  const handleSliderChange = (value: number[]) => {
    isDraggingRef.current = true;
    onProgressChange(value);
  };

  const handleSliderCommit = (value: number[]) => {
    if (currentSound) {
      currentSound.seek(value[0]);
      // Forzar una actualización inmediata
      onProgressChange(value);
      
      isDraggingRef.current = false;
      // Reiniciar el intervalo de actualización
      startProgressInterval();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 font-mono min-w-[35px]">{formatTime(currentTime)}</span>
      <Slider
        value={[currentTime]}
        max={duration}
        step={1}
        onValueChange={handleSliderChange}
        onValueCommit={handleSliderCommit}
        className="flex-1 w-full"
      />
      <span className="text-xs text-gray-400 font-mono min-w-[35px]">{formatTime(duration)}</span>
    </div>
  )
}
