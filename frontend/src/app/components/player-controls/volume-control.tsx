"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Volume2, VolumeX, Volume1 } from "lucide-react"
import { useSoundStore } from "@/store/useSound"

interface VolumeControlProps {
  volume: number
  onVolumeChange: (volume: number) => void
}

export default function VolumeControl({ volume, onVolumeChange }: VolumeControlProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [sliderValue, setSliderValue] = useState(100)
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentSound } = useSoundStore.getState()

  useEffect(() => {
    if (!showVolumeSlider) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showVolumeSlider])

  useEffect(() => {
    setSliderValue(volume)
  }, [volume])

  const VolumeIcon = useMemo(() => {
    if (isMuted || sliderValue === 0) return VolumeX
    if (sliderValue < 50) return Volume1
    return Volume2
  }, [isMuted, sliderValue])

  const handleVolumeChange = ([newVolume]: number[]) => {
    if (!currentSound) return
    currentSound.volume(newVolume / 100)
    setSliderValue(newVolume)
    onVolumeChange(newVolume)
    if (newVolume > 0 && isMuted) setIsMuted(false)
  }

  const handleMuteToggle = () => {
    if (!currentSound) return
    const wasMuted = isMuted
    setIsMuted(!wasMuted)
    const restoredVolume = sliderValue > 0 ? sliderValue : 50
    currentSound.volume(wasMuted ? restoredVolume / 100 : 0)
    if (wasMuted) setSliderValue(restoredVolume)
    else setSliderValue(0)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Volume Slider */}
      <div
        className={`absolute bottom-12 left-1/2 transform -translate-x-30 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-slate-700 min-w-[200px] transition-all duration-200 ease-in-out ${
          showVolumeSlider ? "scale-100" : "scale-95 hidden"
        }`}
      >
        <div className="flex items-center gap-3">
          <button onClick={handleMuteToggle} className="text-gray-400 hover:text-white transition-colors duration-200">
            <VolumeIcon className="h-4 w-4 flex-shrink-0" />
          </button>
          <div className="flex-1">
            <Slider
              value={[isMuted ? 0 : sliderValue]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-full"
            />
          </div>
          <span className="text-sm text-gray-400 min-w-[35px] text-right">
            {isMuted ? 0 : sliderValue}%
          </span>
        </div>
      </div>

      {/* Volume Button */}
      <Button
        variant="ghost"
        size="icon"
        className="text-white hover:bg-white/10 relative transition duration-150 hover:scale-105"
        onClick={() => setShowVolumeSlider(prev => !prev)}
      >
        <VolumeIcon className="h-5 w-5" />
      </Button>
    </div>
  )
}
