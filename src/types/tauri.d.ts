// src/types/tauri.d.ts
export interface Song {
  id: string; 
  title: string;
  artist: string;
  album: string;
  duration: string;      // Duración formateada (MM:SS)
  durationRaw: number;   // <-- CAMBIO: Ahora es camelCase para coincidir con el frontend
  coverUrl?: string;     // <-- CAMBIO: camelCase
  filePath: string;      // <-- CAMBIO: camelCase
  isVideo?: boolean;     // <-- NUEVO: para manejar videos
  isPlaying?: boolean;
  isLiked?: boolean
}

export interface TauriAPI {
  // Window controls (nombres actualizados)
  minimizeApp: () => Promise<unknown>; // Ahora activa mini-mode
  maximizeApp: () => Promise<unknown>; // Alterna max/restaurar o sale de mini-mode
  closeApp: () => Promise<unknown>;
  setMiniMode: (enable: boolean) => Promise<unknown>;
  toggleMaximize: () => Promise<unknown>;
  dragMainWindow: () => Promise<unknown>;
  isWindowMaximized: () => Promise<boolean>;
  restoreWindow: () => Promise<unknown>;
  dragWindow: () => Promise<unknown>;
  saveMiniWindowPosition: () => Promise<unknown>;

  // Music handlers (nombres actualizados)
  openFile: () => Promise<string[]>;
  processMetadata: (file_paths: string[]) => Promise<Song[]>;
  getAudioData: (file_path: string) => Promise<string | null>; // Devuelve null si error
  getAudioStreamUrl: (file_path: string) => Promise<string | null>; // <-- NUEVO
  handleDroppedFiles: (file_paths: string[]) => Promise<Song[]>; // <-- NUEVO

  // Config handlers
  getConfig: () => Promise<any>;
  saveConfig: (config: any) => Promise<any>;
  openConfigFolder: () => Promise<unknown>;
}

declare global {
  interface Window {
    __TAURI__?: any;
    tauriAPI: TauriAPI;
  }
}