import { create } from 'zustand'
import { persist } from 'zustand/middleware'


export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;      // Duración formateada (MM:SS)
  durationRaw: number;   // Duración en segundos
  coverUrl?: string;
  filePath: string;
  isPlaying?: boolean;
  isLiked?: boolean;
}

interface MusicState {
  currentSong?: Song;
  selectedSong?: Song;
  playlists: { id: string; name: string; songs: Song[] }[];
  currentPlaylist: Song[];
  isPlaying: boolean;
  setCurrentSong: (song: Song) => void;
  setSelectedSong: (song: Song | undefined) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  addSongsToPlaylist: (songs: Song[]) => void;
  removeSongFromPlaylist: (songId: string) => void;
  toggleLike: (songId: string) => void;
  createPlaylist: (name: string, songs?: Song[]) => void;
  toggleSongPlay: (songId: string) => void;
  isMini: boolean;
  toggleMiniMode: () => void;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set) => ({
      currentSong: undefined,
      selectedSong: undefined,
      playlists: [],
      currentPlaylist: [],
      isPlaying: false,
      isMini: false,

      setCurrentSong: (song) => 
        set((state) => ({
          currentSong: { ...song, isPlaying: true },
          currentPlaylist: state.currentPlaylist.map(s => 
            s.id === song.id ? { ...s, isPlaying: true } : { ...s, isPlaying: false }
          )
        })),

      setIsPlaying: (isPlaying) => 
        set((state) => ({
          isPlaying,
          currentSong: state.currentSong 
            ? { ...state.currentSong, isPlaying }
            : undefined
        })),

      addSongsToPlaylist: (songs) =>
        set((state) => {
          const newSongs = songs.map((song) => ({
            ...song,
            id: crypto.randomUUID(),
            isPlaying: false
          }));
          return {
            currentPlaylist: [...state.currentPlaylist, ...newSongs]
          };
        }),

      createPlaylist: (name, songs = []) =>
        set((state) => ({
          playlists: [
            ...state.playlists,
            {
              id: crypto.randomUUID(),
              name,
              songs: songs.map(song => ({ ...song, id: crypto.randomUUID() }))
            }
          ]
        })),

      setSelectedSong: (song) =>
        set({ selectedSong: song }),

      removeSongFromPlaylist: (songId) =>
        set((state) => ({
          currentPlaylist: state.currentPlaylist.filter(s => s.id !== songId),
          // Si la canción eliminada es la actual, la limpiamos
          currentSong: state.currentSong?.id === songId ? undefined : state.currentSong,
          isPlaying: state.currentSong?.id === songId ? false : state.isPlaying
        })),

      toggleLike: (songId) =>
        set((state) => ({
          currentPlaylist: state.currentPlaylist.map(s => 
            s.id === songId ? { ...s, isLiked: !s.isLiked } : s
          ),
          currentSong: state.currentSong?.id === songId 
            ? { ...state.currentSong, isLiked: !state.currentSong.isLiked }
            : state.currentSong
        })),

      toggleSongPlay: (songId) =>
        set((state) => {
          const song = state.currentPlaylist.find(s => s.id === songId);
          if (!song) return state;

          return {
            currentSong: song,
            isPlaying: true,
            currentPlaylist: state.currentPlaylist.map(s => 
              s.id === songId ? { ...s, isPlaying: true } : { ...s, isPlaying: false }
            )
          };
        }),
      toggleMiniMode: () => set((state) => ({isMini: !state.isMini})),
    }),
    {
      name: 'music-storage'
    }
  )
) 