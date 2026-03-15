/**
 * IndexedDB Database Service
 * 
 * Maneja toda la persistencia de datos (playlists y canciones)
 * sin límite de tamaño, a diferencia de localStorage
 */

import type { Song } from '@/types/tauri';

interface PlaylistInfo {
  id: string;
  name: string;
  songs: Song[];
  isSystem?: boolean;
}

const DB_NAME = 'pulse-music-db';
const DB_VERSION = 1;
const PLAYLISTS_STORE = 'playlists';
const SONGS_STORE = 'songs';

/**
 * Inicializa la base de datos IndexedDB
 */
export function initDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Crear store para playlists
      if (!db.objectStoreNames.contains(PLAYLISTS_STORE)) {
        db.createObjectStore(PLAYLISTS_STORE, { keyPath: 'id' });
      }

      // Crear store para canciones con índice por playlist
      if (!db.objectStoreNames.contains(SONGS_STORE)) {
        const songStore = db.createObjectStore(SONGS_STORE, { keyPath: 'id' });
        songStore.createIndex('playlistId', 'playlistId', { unique: false });
      }
    };
  });
}

/**
 * Obtiene todas las playlists CON sus canciones
 */
export async function getAllPlaylists() {
  console.log('🔍 Leyendo todas las playlists de IndexedDB...');
  const db = await initDatabase();
  
  return new Promise<PlaylistInfo[]>((resolve, reject) => {
    const transaction = db.transaction([PLAYLISTS_STORE, SONGS_STORE], 'readonly');
    const playlistStore = transaction.objectStore(PLAYLISTS_STORE);
    const playlistRequest = playlistStore.getAll();

    playlistRequest.onsuccess = async () => {
      try {
        const playlists = playlistRequest.result as PlaylistInfo[];
        console.log(`✅ Se leyeron ${playlists.length} playlists`);

        // Asegurar que existan las playlists del sistema
        const FAVORITES_PLAYLIST_ID = 'favorites';
        const CURRENT_SESSION_PLAYLIST_ID = 'current-session';
        
        const hasFavorites = playlists.some(p => p.id === FAVORITES_PLAYLIST_ID);
        const hasCurrentSession = playlists.some(p => p.id === CURRENT_SESSION_PLAYLIST_ID);
        
        if (!hasFavorites) {
          console.log('⚠️ Playlist de Favoritos no encontrada, creando...');
          playlists.push({
            id: FAVORITES_PLAYLIST_ID,
            name: '❤️ Favoritos',
            songs: [],
            isSystem: true
          });
        }
        
        if (!hasCurrentSession) {
          console.log('⚠️ Playlist de Sesión Actual no encontrada, creando...');
          playlists.push({
            id: CURRENT_SESSION_PLAYLIST_ID,
            name: '🎵 Reproducción Actual',
            songs: [],
            isSystem: true
          });
        }

        // Para cada playlist, obtener sus canciones
        const allPlaylists: PlaylistInfo[] = [];
        for (const playlist of playlists) {
          const songs = await getSongsByPlaylistId(playlist.id);
          allPlaylists.push({
            ...playlist,
            songs: songs
          });
          console.log(`   📁 Playlist "${playlist.name}": ${songs.length} canciones`);
        }

        resolve(allPlaylists);
      } catch (error) {
        console.error('❌ Error procesando playlists:', error);
        reject(error);
      }
    };

    playlistRequest.onerror = () => {
      console.error('❌ Error leyendo playlists:', playlistRequest.error);
      reject(playlistRequest.error);
    };
  });
}

/**
 * Obtiene una playlist específica por ID
 */
export async function getPlaylistById(playlistId: string) {
  const db = await initDatabase();
  return new Promise<PlaylistInfo | undefined>((resolve, reject) => {
    const transaction = db.transaction([PLAYLISTS_STORE], 'readonly');
    const store = transaction.objectStore(PLAYLISTS_STORE);
    const request = store.get(playlistId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as PlaylistInfo | undefined);
  });
}

/**
 * Guarda o actualiza una playlist (sin las canciones)
 * Las canciones se guardan por separado en el store de songs
 */
export async function savePlaylist(playlist: PlaylistInfo) {
  console.log(`💾 Guardando playlist: ${playlist.name}`);
  const db = await initDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([PLAYLISTS_STORE], 'readwrite');
    const store = transaction.objectStore(PLAYLISTS_STORE);
    
    // Guardar sin las canciones (se guardan separadamente)
    const playlistWithoutSongs = {
      id: playlist.id,
      name: playlist.name,
      isSystem: playlist.isSystem,
      songs: [] // Vacío, las canciones están en otro store
    };
    
    const request = store.put(playlistWithoutSongs);

    request.onerror = () => {
      console.error('❌ Error guardando playlist:', request.error);
      reject(request.error);
    };
    request.onsuccess = () => {
      console.log(`✅ Playlist guardada: ${playlist.name}`);
      resolve();
    };
  });
}

/**
 * Obtiene todas las canciones de una playlist
 */
export async function getSongsByPlaylistId(playlistId: string): Promise<Song[]> {
  const db = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE], 'readonly');
    const store = transaction.objectStore(SONGS_STORE);
    const index = store.index('playlistId');
    const request = index.getAll(playlistId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Añade múltiples canciones a una playlist (batch operation)
 * NOTA: NO actualiza el objeto playlist, solo añade las canciones con playlistId
 */
export async function addSongsToPlaylist(playlistId: string, songs: Song[]) {
  console.log(`💾 Guardando ${songs.length} canciones en la playlist ${playlistId}...`);
  const db = await initDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE], 'readwrite');
    const songStore = transaction.objectStore(SONGS_STORE);

    // Guardar las canciones con el playlistId como referencia
    songs.forEach((song) => {
      songStore.put({ ...song, playlistId });
    });

    transaction.onerror = () => {
      console.error('❌ Error guardando canciones:', transaction.error);
      reject(transaction.error);
    };
    transaction.oncomplete = () => {
      console.log(`✅ ${songs.length} canciones guardadas correctamente`);
      resolve();
    };
  });
}

/**
 * Elimina una canción
 */
export async function deleteSong(songId: string) {
  const db = await initDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE], 'readwrite');
    const store = transaction.objectStore(SONGS_STORE);
    const request = store.delete(songId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Elimina todas las canciones de una playlist
 */
export async function deletePlaylistSongs(playlistId: string) {
  const db = await initDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE], 'readwrite');
    const store = transaction.objectStore(SONGS_STORE);
    const index = store.index('playlistId');
    const request = index.openCursor(IDBKeyRange.only(playlistId));

    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
  });
}

/**
 * Borra toda la base de datos
 */
export async function clearDatabase() {
  const db = await initDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([PLAYLISTS_STORE, SONGS_STORE], 'readwrite');
    
    transaction.objectStore(PLAYLISTS_STORE).clear();
    transaction.objectStore(SONGS_STORE).clear();

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });
}

/**
 * Actualiza el estado de "me gusta" de una canción en TODAS las playlists
 * También maneja agregar/remover de la playlist de Favoritos
 */
export async function updateSongLikeStatus(songId: string, isLiked: boolean) {
  console.log(`💾 Actualizando like de canción ${songId} a ${isLiked}`);
  const db = await initDatabase();
  
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE], 'readwrite');
    const songStore = transaction.objectStore(SONGS_STORE);
    
    // Obtener todas las instancias de esta canción (puede estar en múltiples playlists)
    const getAllRequest = songStore.getAll();
    
    getAllRequest.onsuccess = () => {
      const allSongs = getAllRequest.result as (Song & { playlistId?: string })[];
      
      // Actualizar TODAS las instancias de esta canción
      allSongs.forEach(song => {
        if (song.id === songId) {
          songStore.put({ ...song, isLiked });
        }
      });
    };

    transaction.onerror = () => {
      console.error('❌ Error actualizando like:', transaction.error);
      reject(transaction.error);
    };
    
    transaction.oncomplete = () => {
      console.log(`✅ Like actualizado para canción ${songId}`);
      resolve();
    };
  });
}

/**
 * Maneja la adición o eliminación de una canción de la playlist de Favoritos
 * Sincroniza la canción entre SONGS_STORE y mantiene el estado isLiked
 */
export async function toggleFavoriteSong(songId: string, song: Song, isAdding: boolean) {
  const FAVORITES_PLAYLIST_ID = 'favorites';
  console.log(`🎵 ${isAdding ? 'Agregando' : 'Removiendo'} canción ${songId} de Favoritos`);
  const db = await initDatabase();
  
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([PLAYLISTS_STORE, SONGS_STORE], 'readwrite');
    const songStore = transaction.objectStore(SONGS_STORE);
    const playlistStore = transaction.objectStore(PLAYLISTS_STORE);
    
    // Primero, asegurar que la playlist de Favoritos existe
    const playlistCheckRequest = playlistStore.get(FAVORITES_PLAYLIST_ID);
    
    playlistCheckRequest.onsuccess = () => {
      const favPlaylist = playlistCheckRequest.result;
      
      if (!favPlaylist) {
        // Crear la playlist de Favoritos si no existe
        const newFavPlaylist = {
          id: FAVORITES_PLAYLIST_ID,
          name: '❤️ Favoritos',
          songs: [],
          isSystem: true
        };
        playlistStore.put(newFavPlaylist);
        console.log('📁 Playlist de Favoritos creada');
      }
    };
    
    if (isAdding) {
      // Agregar la canción a Favoritos con playlistId='favorites'
      const favoriteEntry = {
        ...song,
        playlistId: FAVORITES_PLAYLIST_ID,
        isLiked: true
      };
      songStore.put(favoriteEntry);
      console.log(`✅ Canción agregada a Favoritos`);
    } else {
      // Remover la canción de Favoritos
      // Buscar la entrada específica que tiene playlistId='favorites'
      const index = songStore.index('playlistId');
      const request = index.openCursor(IDBKeyRange.only(FAVORITES_PLAYLIST_ID));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const currentSong = cursor.value as Song & { playlistId?: string };
          if (currentSong.id === songId) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
      console.log(`✅ Canción removida de Favoritos`);
    }

    transaction.onerror = () => {
      console.error('❌ Error toggling favorite:', transaction.error);
      reject(transaction.error);
    };
    
    transaction.oncomplete = () => {
      console.log(`✅ Favorito sincronizado en BD`);
      resolve();
    };
  });
}

/**
 * Actualiza una canción completa en todas sus instancias (por si hay cambios de metadata)
 */
export async function updateSong(songId: string, songData: Partial<Song>) {
  const db = await initDatabase();
  
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE], 'readwrite');
    const songStore = transaction.objectStore(SONGS_STORE);
    
    const getAllRequest = songStore.getAll();
    
    getAllRequest.onsuccess = () => {
      const allSongs = getAllRequest.result as (Song & { playlistId?: string })[];
      
      allSongs.forEach(song => {
        if (song.id === songId) {
          songStore.put({ ...song, ...songData });
        }
      });
    };

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });
}
