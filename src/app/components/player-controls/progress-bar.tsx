import { Slider } from "@/components/ui/slider";
import { useSoundStore } from "@/store/useSound";
import { useEffect, useRef, useCallback, useState } from "react";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onProgressChange: (value: number[]) => void;
}

export function ProgressBar({ currentTime, duration, onProgressChange }: ProgressBarProps) {
  const { currentSound } = useSoundStore();
  const isDraggingRef = useRef(false);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const [bufferPercent, setBufferPercent] = useState(0);

  const formatTime = (seconds: number) => {
    const roundedSeconds = Math.round(seconds);
    const mins = Math.floor(roundedSeconds / 60);
    const secs = roundedSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Implemented inside startProgressInterval

  const startProgressInterval = useCallback(() => {
    const tick = () => {
      if (isDraggingRef.current) return;
      if (!currentSound) return;

      if (currentSound instanceof HTMLMediaElement) {
          const audio = currentSound as HTMLMediaElement;
        const ct = typeof audio.currentTime === 'number' ? audio.currentTime : 0;
        onProgressChange([Math.floor(ct)]);
        if (duration > 0 && audio.buffered && audio.buffered.length > 0) {
          try {
            const end = audio.buffered.end(audio.buffered.length - 1);
            const pct = Math.min(100, Math.max(0, (end / duration) * 100));
            setBufferPercent(pct);
          } catch {
            setBufferPercent(0);
          }
        } else {
          setBufferPercent(0);
        }
      }
    };

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    updateIntervalRef.current = setInterval(tick, 200);
    tick();
  }, [currentSound, onProgressChange, duration]);

  useEffect(() => {
    if (!currentSound) return;
    startProgressInterval();

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [currentSound, startProgressInterval]);

  // Reset progress and buffered state when the sound or duration changes
  useEffect(() => {
    isDraggingRef.current = false;
    setBufferPercent(0);
    onProgressChange([0]);
  }, [currentSound, duration]);

  const handleSliderChange = (value: number[]) => {
    isDraggingRef.current = true;
    onProgressChange(value);
  };

  const handleSliderCommit = (value: number[]) => {
    if (!currentSound) return;
    if (currentSound instanceof HTMLMediaElement) {
      try { currentSound.currentTime = value[0]; } catch (e) { console.warn('Failed to set currentTime', e); }
    }
    onProgressChange(value);
    isDraggingRef.current = false;
    startProgressInterval();
  };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault()
      event.stopPropagation()
    }
  }




  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 font-mono min-w-[35px]">
        {formatTime(currentTime)}
      </span>
      <div className="relative flex-1 w-full">
        <Slider
        value={[currentTime]}
        max={duration}
        onKeyDown={handleKeyDown}
        step={1}
        onValueChange={handleSliderChange}
        onValueCommit={handleSliderCommit}
        aria-label="Barra de progreso"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        aria-valuetext={`${formatTime(currentTime)} de ${formatTime(duration)}`}
        className="flex-1 w-full h-6 touch-none relative"
        bufferPercent={bufferPercent}
      />
      </div>
      <span className="text-xs text-gray-400 font-mono min-w-[35px]">
        {formatTime(duration)}
      </span>
    </div>
  );
}