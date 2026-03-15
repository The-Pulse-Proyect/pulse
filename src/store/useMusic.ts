/**
 * useMusic Store - Mejorado con IndexedDB
 * 
 * Gestiona el estado de música manteniendo playlists en memoria
 * pero sincronizando con IndexedDB para persistencia sin límite.
 * 
 * CAMBIOS:
 * - Playlists se cargan desde IndexedDB al iniciar
 * - addSongsToPlaylist ahora es async y guarda en IndexedDB automáticamente
 * - removeSongFromPlaylist sincroniza con IndexedDB
 */

import { playSound } from '@/lib/howler/hwoler';
import { create } from 'zustand'
import { useSoundStore } from './useSound';
import * as db from '@/lib/database';
import type { Song } from '@/types/tauri';

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
  
  // Acciones
  setCurrentSong: (song: Song) => void;
  setSelectedSong: (song: Song | undefined) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  addSongsToPlaylist: (songs: Song[], currentId?: string) => Promise<void>;
  removeSongFromPlaylist: (songId: string) => Promise<void>;
  toggleLike: (songId: string) => void;
  createPlaylist: (name: string) => void;
  toggleSongPlay: (songId: string) => void;
  loadPlaylist: (playlistId: string) => Promise<void>;
  removePlaylist: (playlistId: string) => Promise<void>;
  initStore: () => Promise<void>;
}

export const FAVORITES_PLAYLIST_ID = 'favorites';
export const CURRENT_SESSION_PLAYLIST_ID = 'current-session';

export const useMusicStore = create<MusicState>((set, get) => ({
  currentSong: undefined,
  selectedSong: undefined,
  playlists: [],
  currentPlaylist: [],
  currentId: CURRENT_SESSION_PLAYLIST_ID,
  isPlaying: false,

  /**
   * Inicializa el store cargando playlists desde IndexedDB
   * IMPORTANTE: Llamar esto al montar la app (en App.tsx)
   */
  initStore: async () => {
    try {
      console.log('🎵 Inicializando store de música desde IndexedDB...');
      const savedPlaylists = await db.getAllPlaylists();
      console.log(`✅ Se encontraron ${savedPlaylists.length} playlists en la BD`);
      
      if (savedPlaylists.length === 0) {
        console.log('📝 Creando playlists del sistema...');
        // Crear playlists del sistema
        const defaultPlaylists = [
          { id: FAVORITES_PLAYLIST_ID, name: '❤️ Favoritos', songs: [], isSystem: true },
          { id: CURRENT_SESSION_PLAYLIST_ID, name: '🎵 Reproducción Actual', songs: [], isSystem: true }
        ];
        
        for (const playlist of defaultPlaylists) {
          await db.savePlaylist(playlist);
        }
        
        console.log('✅ Playlists del sistema creadas');
        set({ playlists: defaultPlaylists, currentPlaylist: [] });
      } else {
        console.log(`📚 Cargando ${savedPlaylists.length} playlists...`);
        // Cargar todas las playlists
        set({ playlists: savedPlaylists });
        
        // Cargar la playlist de sesión actual automáticamente
        const currentSessionPlaylist = savedPlaylists.find(p => p.id === CURRENT_SESSION_PLAYLIST_ID);
        if (currentSessionPlaylist) {
          console.log(`🎶 Cargando ${currentSessionPlaylist.songs.length} canciones de la playlist actual`);
          set({
            currentId: CURRENT_SESSION_PLAYLIST_ID,
            currentPlaylist: currentSessionPlaylist.songs
          });
        }
      }
    } catch (error) {
      console.error('❌ Error inicializando store:', error);
    }
  },

  setCurrentSong: (song) => {
    set((state) => {
      // Actualizar isPlaying en todas las playlists
      const updatedPlaylists = state.playlists.map(playlist => ({
        ...playlist,
        songs: playlist.songs.map(s => ({
          ...s,
          isPlaying: s.id === song.id
        }))
      }));

      return {
        currentSong: { ...song, isPlaying: true },
        currentPlaylist: state.currentPlaylist.map(s => ({
          ...s,
          isPlaying: s.id === song.id
        })),
        playlists: updatedPlaylists
      };
    })
  },

  setIsPlaying: (isPlaying) => {
    const { currentSound } = useSoundStore.getState();
    const { currentSong } = get();
    if (isPlaying && currentSong && !currentSound) playSound(currentSong.filePath, currentSong.id);
    set((state) => ({
      isPlaying,
      currentSong: state.currentSong ? { ...state.currentSong, isPlaying } : undefined
    }))
  },

  /**
   * Añade canciones a una playlist y las guarda en IndexedDB
   * Las canciones se sincronizan automáticamente con la base de datos
   */
  addSongsToPlaylist: async (songs, currentId) => {
    const state = get();
    const playlistId = currentId || state.currentId || CURRENT_SESSION_PLAYLIST_ID;

    const newSongs = songs.map((song) => ({
      ...song,
      id: crypto.randomUUID(),
      isPlaying: false,
      isLiked: false
    }));

    // Guardar en IndexedDB (sincrónico con el estado)
    await db.addSongsToPlaylist(playlistId, newSongs);

    // Actualizar estado local
    set((state) => {
      const updatedPlaylists = state.playlists.map(playlist =>
        playlist.id === playlistId
          ? { ...playlist, songs: [...playlist.songs, ...newSongs] }
          : playlist
      );

      const updatedCurrentPlaylist = playlistId === state.currentId
        ? [...state.currentPlaylist, ...newSongs]
        : state.currentPlaylist;

      return {
        playlists: updatedPlaylists,
        currentPlaylist: updatedCurrentPlaylist,
        currentSong: state.currentSong || newSongs[0]
      };
    });
  },

  removeSongFromPlaylist: async (songId) => {
    // Eliminar de IndexedDB
    await db.deleteSong(songId);

    // Actualizar estado local
    set((state) => {
      const updatedCurrentPlaylist = state.currentPlaylist.filter(s => s.id !== songId);
      const updatedPlaylists = state.playlists.map(playlist => ({
        ...playlist,
        songs: playlist.songs.filter(s => s.id !== songId)
      }));

      return {
        playlists: updatedPlaylists,
        currentPlaylist: updatedCurrentPlaylist,
        currentSong: state.currentSong?.id === songId ? undefined : state.currentSong,
        selectedSong: state.selectedSong?.id === songId ? undefined : state.selectedSong
      };
    });
  },

  toggleLike: (songId) => {
    set((state) => {
      // Encontrar la canción y su estado actual de "me gusta"
      let songToLike: Song | undefined;
      for (const playlist of state.playlists) {
        const found = playlist.songs.find(s => s.id === songId);
        if (found) {
          songToLike = found;
          break;
        }
      }

      if (!songToLike) return state;

      const isNowLiked = !songToLike.isLiked;

      // Actualizar todas las playlists
      const updatedPlaylists = state.playlists.map(playlist => {
        if (playlist.id === FAVORITES_PLAYLIST_ID) {
          // Agregar o quitar de favoritos
          if (isNowLiked) {
            // Si ya existe en favoritos, actualizar el estado
            // Si no existe, agregarlo
            const existsInFavorites = playlist.songs.some(s => s.id === songId);
            if (existsInFavorites) {
              return {
                ...playlist,
                songs: playlist.songs.map(s =>
                  s.id === songId ? { ...s, isLiked: true } : s
                )
              };
            } else {
              return {
                ...playlist,
                songs: [...playlist.songs, { ...songToLike, isLiked: true }]
              };
            }
          } else {
            // Remover de favoritos
            return {
              ...playlist,
              songs: playlist.songs.filter(s => s.id !== songId)
            };
          }
        } else {
          // Otras playlists: solo actualizar el estado isLiked
          return {
            ...playlist,
            songs: playlist.songs.map(song =>
              song.id === songId ? { ...song, isLiked: isNowLiked } : song
            )
          };
        }
      });

      // Actualizar currentPlaylist si contiene la canción
      const updatedCurrentPlaylist = state.currentPlaylist.map(song =>
        song.id === songId ? { ...song, isLiked: isNowLiked } : song
      );

      // Actualizar currentSong si es la misma canción
      const updatedCurrentSong = state.currentSong?.id === songId 
        ? { ...state.currentSong, isLiked: isNowLiked }
        : state.currentSong;

      // Sincronizar con IndexedDB
      db.updateSongLikeStatus(songId, isNowLiked).catch(err => 
        console.error('Error actualizando favorito en BD:', err)
      );

      // Sincronizar Favoritos playlist en IndexedDB
      if (songToLike) {
        db.toggleFavoriteSong(songId, songToLike, isNowLiked).catch(err =>
          console.error('Error toggling favorite in DB:', err)
        );
      }

      return { playlists: updatedPlaylists, currentPlaylist: updatedCurrentPlaylist, currentSong: updatedCurrentSong };
    });
  },

  createPlaylist: (name) => {
    const newId = crypto.randomUUID();
    const newPlaylist: PlaylistInfo = { id: newId, name, songs: [], isSystem: false };

    set((state) => ({
      playlists: [...state.playlists, newPlaylist]
    }));

    db.savePlaylist(newPlaylist).catch(err => console.error('Error guardando playlist:', err));
  },

  toggleSongPlay: (songId) => {
    const state = get();
    const song = state.currentPlaylist.find(s => s.id === songId);

    if (song) {
      // Actualizar isPlaying en todas las playlists
      const updatedPlaylists = state.playlists.map(playlist => ({
        ...playlist,
        songs: playlist.songs.map(s => ({
          ...s,
          isPlaying: s.id === songId
        }))
      }));

      set({
        currentSong: { ...song, isPlaying: true },
        currentPlaylist: state.currentPlaylist.map(s => ({
          ...s,
          isPlaying: s.id === songId
        })),
        playlists: updatedPlaylists
      });
      
      playSound(song.filePath, song.id);
    }
  },

  loadPlaylist: async (playlistId) => {
    const state = get();
    const playlist = state.playlists.find(p => p.id === playlistId);

    if (playlist) {
      set({
        currentId: playlistId,
        currentPlaylist: playlist.songs
      });
    }
  },

  removePlaylist: async (playlistId) => {
    if (playlistId === FAVORITES_PLAYLIST_ID || playlistId === CURRENT_SESSION_PLAYLIST_ID) {
      console.warn('No se pueden eliminar playlists del sistema');
      return;
    }

    await db.deletePlaylistSongs(playlistId);

    set((state) => {
      const updatedPlaylists = state.playlists.filter(p => p.id !== playlistId);
      const isCurrentPlaylist = state.currentId === playlistId;

      return {
        playlists: updatedPlaylists,
        currentPlaylist: isCurrentPlaylist ? [] : state.currentPlaylist,
        currentId: isCurrentPlaylist ? CURRENT_SESSION_PLAYLIST_ID : state.currentId
      };
    });
  },

  setSelectedSong: (song) => set({ selectedSong: song })
}));