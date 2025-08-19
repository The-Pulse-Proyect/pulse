"use client"

import { useState } from "react"
import { Play, Pause, SkipBack, SkipForward, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MiniMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isLiked, setIsLiked] = useState(true)

  return (
    <div className="w-[340px] h-[180px] bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg overflow-hidden shadow-2xl border border-slate-700">
      <div className="flex h-full">
        {/* Album Art */}
        <div className="w-[120px] h-[120px] relative">
          <img src="/placeholder.svg?height=120&width=120" alt="Album cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-3">
          {/* Song Info */}
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm leading-tight mb-1 truncate">Sung Jin Woo vs. Kargalaan</h3>
            <p className="text-slate-400 text-xs truncate">Adlomusic</p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Like and Time */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-orange-500 hover:text-orange-400 hover:bg-slate-700"
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              </Button>
              <span className="text-slate-400 text-xs font-mono">3:53</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2">
            <div className="w-full bg-slate-700 rounded-full h-1">
              <div className="bg-orange-500 h-1 rounded-full w-1/4 relative">
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-orange-500 rounded-full shadow-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
