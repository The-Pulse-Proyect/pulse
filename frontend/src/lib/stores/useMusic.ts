import { create } from 'zustand'

interface Song {
  id: string
  title: string
  artist: string
  duration: number
  isLiked: boolean
  path: string
}

interface MusicStore {
  currentSong: Song | null
  isPlaying: boolean
  playlist: Song[]
  setCurrentSong: (song: Song) => void
  togglePlay: () => void
  toggleLike: (songId: string) => void
  addToPlaylist: (song: Song) => void
  removeFromPlaylist: (songId: string) => void
}

export const useMusicStore = create<MusicStore>((set) => ({
  currentSong: null,
  isPlaying: false,
  playlist: [],

  setCurrentSong: (song) => set({ currentSong: song }),
  
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  toggleLike: (songId) => set((state) => ({
    playlist: state.playlist.map(song => 
      song.id === songId ? { ...song, isLiked: !song.isLiked } : song
    ),
    currentSong: state.currentSong?.id === songId 
      ? { ...state.currentSong, isLiked: !state.currentSong.isLiked }
      : state.currentSong
  })),
  
  addToPlaylist: (song) => set((state) => ({
    playlist: [...state.playlist, song]
  })),
  
  removeFromPlaylist: (songId) => set((state) => ({
    playlist: state.playlist.filter(song => song.id !== songId)
  }))
}))
