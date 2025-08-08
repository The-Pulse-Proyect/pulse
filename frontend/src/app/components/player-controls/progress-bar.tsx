import { Slider } from "@/components/ui/slider"

interface ProgressBarProps {
  currentTime: number
  duration: number
  onProgressChange: (value: number[]) => void
}

export function ProgressBar({ currentTime, duration, onProgressChange }: ProgressBarProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 font-mono min-w-[35px]">{formatTime(currentTime)}</span>
      <Slider
        value={[currentTime]}
        max={duration}
        step={1}
        onValueChange={onProgressChange}
        className="flex-1"
      />
      <span className="text-xs text-gray-400 font-mono min-w-[35px]">{formatTime(duration)}</span>
    </div>
  )
}
