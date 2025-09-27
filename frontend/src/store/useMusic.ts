
import { playSound } from '@/lib/howler/hwoler';
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useSoundStore } from './useSound';
import { cleanupAudioNodes } from '@/hooks/useSpectrumData';


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

interface PlaylistInfo {
  id: string;
  name: string;
  songs: Song[];
  isSystem?: boolean;
}

interface MusicState {
  currentSong?: Song;
  currentId?: string;
  selectedSong?: Song;
  playlists: PlaylistInfo[];
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
  loadPlaylist: (playlistId: string) => void;
  removePlaylist: (playlistId: string) => void;
}

// Constantes para playlists especiales
export const FAVORITES_PLAYLIST_ID = 'favorites';
export const CURRENT_SESSION_PLAYLIST_ID = 'current-session';

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      currentSong: undefined,
      selectedSong: undefined,
      playlists: [
        {
          id: FAVORITES_PLAYLIST_ID,
          name: '❤️ Favoritos',
          songs: [],
          isSystem: true
        },
        {
          id: CURRENT_SESSION_PLAYLIST_ID,
          name: '🎵 Reproducción Actual',
          songs: [],
          isSystem: true
        }
      ],
      currentPlaylist: [],
      currentId: "",
      isPlaying: false,
        removePlaylist: (playlistId) =>
          set((state) => ({
            playlists: state.playlists.filter(p => p.id !== playlistId),
            currentPlaylist: state.currentPlaylist.length && state.playlists.find(p => p.id === playlistId)?.songs === state.currentPlaylist ? [] : state.currentPlaylist,
            currentSong: state.currentPlaylist.length && state.playlists.find(p => p.id === playlistId)?.songs === state.currentPlaylist ? undefined : state.currentSong,
            selectedSong: state.currentPlaylist.length && state.playlists.find(p => p.id === playlistId)?.songs === state.currentPlaylist ? undefined : state.selectedSong
          })),

      setCurrentSong: (song) => 
      {
        set((state) => ({
          currentSong: { ...song, isPlaying: true },
          currentPlaylist: state.currentPlaylist.map(s => 
            s.id === song.id ? { ...s, isPlaying: true } : { ...s, isPlaying: false }
          )
        }))
      },

      setIsPlaying: (isPlaying) => {
        const { currentSound } = useSoundStore.getState();
        // Si hay un sonido actual, lo detenemos y liberamos recursos
        const { currentSong } = get();
        // Si isPlaying es true, reproducimos el sonido
        if (isPlaying && currentSong && !currentSound) playSound(currentSong.filePath);
        set((state) => ({
          isPlaying,
          currentSong: state.currentSong 
            ? { ...state.currentSong, isPlaying }
            : undefined
        }))
      },

      addSongsToPlaylist: (songs) =>
        set((state) => {
          const newSongs = songs.map((song) => ({
            ...song,
            id: crypto.randomUUID(),
            isPlaying: false,
            isLiked: false
          }));

          let updatedPlaylists
          let selectedPlaylist = state.playlists.find(playlist => playlist.id === state.currentId)

          if (selectedPlaylist) {
            updatedPlaylists = state.playlists.map(playlist => 
              playlist.id === state.currentId
                ? { ...playlist, songs: [...playlist.songs, ...newSongs] }
                : playlist
            );
          }
          else {
            updatedPlaylists = state.playlists.map(playlist => 
              playlist.id === CURRENT_SESSION_PLAYLIST_ID
                ? { ...playlist, songs: [...playlist.songs, ...newSongs] }
                : playlist
            );

          }
          console.log(state.currentPlaylist)
          // Si no hay playlist actual, usar la de sesión actual
          const updatedCurrentPlaylist = state.currentPlaylist.length === 0
            ? newSongs
            : [...state.currentPlaylist, ...newSongs];

          return {
            playlists: updatedPlaylists,
            currentPlaylist: updatedCurrentPlaylist,
            // Si no hay canción actual, establecer la primera de las nuevas
            currentSong: state.currentSong || newSongs[0]
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
        set((state) => {
          const updatedCurrentPlaylist = state.currentPlaylist.filter(s => s.id !== songId);
          
          // Actualizar todas las playlists, incluyendo las del sistema
          const updatedPlaylists = state.playlists.map(playlist => {
            // Para la playlist de favoritos, mantener la lógica especial
            if (playlist.id === FAVORITES_PLAYLIST_ID) {
              return {
                ...playlist,
                songs: playlist.songs.filter(s => s.id !== songId)
              };
            }
            // Para la playlist de sesión actual, reflejar el estado actual
            if (playlist.id === CURRENT_SESSION_PLAYLIST_ID) {
              return {
                ...playlist,
                songs: playlist.songs.filter(s => s.id !== songId)
              };
            }
            // Para el resto de playlists
            return {
              ...playlist,
              songs: playlist.songs.filter(s => s.id !== songId)
            };
          });

          // Si la canción eliminada era la actual
          if (state.currentSong?.id === songId) {
            // Intentar seleccionar la siguiente canción, o la anterior si era la última
            const currentIndex = state.currentPlaylist.findIndex(s => s.id === songId);
            const nextSong = updatedCurrentPlaylist[currentIndex] || updatedCurrentPlaylist[currentIndex - 1];
            
            // Si hay un sonido actual reproduciéndose, detenerlo
            const { currentSound } = useSoundStore.getState();
            if (currentSound) {
              currentSound.stop();
              currentSound.unload();
            }

            return {
              currentPlaylist: updatedCurrentPlaylist,
              playlists: updatedPlaylists,
              currentSong: nextSong,
              selectedSong: nextSong,
              isPlaying: false
            };
          }

          return {
            currentPlaylist: updatedCurrentPlaylist,
            playlists: updatedPlaylists,
            currentSong: state.currentSong,
            selectedSong: state.selectedSong,
            isPlaying: state.isPlaying
          };
        }),

      toggleLike: (songId) =>
        set((state) => {
          // Encontrar la canción en la playlist actual o en cualquier playlist
          const song = state.currentPlaylist.find(s => s.id === songId) || 
                      state.playlists.flatMap(p => p.songs).find(s => s.id === songId);
          
          if (!song) return state;

          const newLikeState = !song.isLiked;
          
          // Actualizar el estado de "me gusta" en todas las playlists
          const updatedPlaylists = state.playlists.map(playlist => {
            if (playlist.id === FAVORITES_PLAYLIST_ID) {
              // Para la playlist de favoritos
              if (newLikeState) {
                // Añadir a favoritos si no existe
                return {
                  ...playlist,
                  songs: playlist.songs.some(s => s.id === songId)
                    ? playlist.songs.map(s => s.id === songId ? { ...s, isLiked: true } : s)
                    : [...playlist.songs, { ...song, isLiked: true }]
                };
              } else {
                // Quitar de favoritos
                return {
                  ...playlist,
                  songs: playlist.songs.filter(s => s.id !== songId)
                };
              }
            } else {
              // Para otras playlists, solo actualizar el estado
              return {
                ...playlist,
                songs: playlist.songs.map(s => 
                  s.id === songId ? { ...s, isLiked: newLikeState } : s
                )
              };
            }
          });

          return {
            playlists: updatedPlaylists,
            currentPlaylist: state.currentPlaylist.map(s => 
              s.id === songId ? { ...s, isLiked: newLikeState } : s
            ),
            currentSong: state.currentSong?.id === songId 
              ? { ...state.currentSong, isLiked: newLikeState }
              : state.currentSong
          };
        }),

      toggleSongPlay: (songId) =>
        set((state) => {
          const song = state.currentPlaylist.find(s => s.id === songId);
          if (!song) return state;
          playSound(song.filePath)
          return {
            currentSong: song,
            isPlaying: true,
            currentPlaylist: state.currentPlaylist.map(s => 
              s.id === songId ? { ...s, isPlaying: true } : { ...s, isPlaying: false }
            )
          };
        }),

      loadPlaylist: (playlistId) =>
        set((state) => {
          const playlist = state.playlists.find(p => p.id === playlistId);
          if (!playlist) return state;
          
          // Detener y liberar el sonido actual


          // Preservar el estado de "me gusta" al cargar las canciones
          const songsWithLikeState = playlist.songs.map(song => {
            const existingVersion = state.playlists
              .find(p => p.id === FAVORITES_PLAYLIST_ID)?.songs
              .find(s => s.id === song.id);
            return {
              ...song,
              isLiked: existingVersion?.isLiked || false,
              isPlaying: false
            };
          });

          const firstSong = songsWithLikeState[0];

          return {
            currentPlaylist: songsWithLikeState,
            currentSong: firstSong,
            currentId: playlistId,
            selectedSong: firstSong,
            // isPlaying: false // Asegura que no se reproduce automáticamente
          };
        })
    }),
    {
      name: 'music-storage',
      partialize: (state) => ({
        currentSong: state.currentSong,
        selectedSong: state.selectedSong,
        playlists: state.playlists,
        currentPlaylist: state.currentPlaylist,
        // isPlaying NO se almacena
      }),
    }
  )
) 