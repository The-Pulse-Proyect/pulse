import { create } from 'zustand'

interface LoadState {
    isLoad: boolean,
    setLoad: (load: boolean) => void,
    SongsLoaded: null | number,
    setSongsLoaded: (songsLoaded: number | null) => void,
    totalSongs: null | number,
    setTotalSongs: (total: number | null) => void
}

export const useLoadStore = create<LoadState>()((set) => ({
    isLoad: false,
    setLoad: (load: boolean) => {
        set({ isLoad: load})
    },
    SongsLoaded: null,
    setSongsLoaded: (songsLoaded: number | null) => {
        set({ SongsLoaded: songsLoaded})
    },
    totalSongs: null,
    setTotalSongs: (total: number | null) => {
        set({ totalSongs: total })
    }
}))