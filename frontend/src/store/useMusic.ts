import { create } from 'zustand'
import { persist } from 'zustand/middleware'


interface MusicState {
    currentSong: Song
    Playlists: {
        songs: Song[]
    }[]
    currentPlaylist: Song[]
    isPlay: boolean
    setIsPlay: (isPlay: boolean) => void

}

export const useMusicStore = create<MusicState>()(
  persist(
    (set) => ({
    
    }),
    {
      name: 'music-storage'
    }
  )
) 