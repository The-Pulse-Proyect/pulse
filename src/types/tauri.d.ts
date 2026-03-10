export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;      // Duración formateada (MM:SS)
  duration_raw: number;   // Duración en segundos
  cover_url?: string;
  file_path: string;
  isPlaying?: boolean;
  isLiked?: boolean;
}

export interface TauriAPI {
  // Window controls generales
  minimizeApp: () => Promise<unknown>;
  maximizeApp: () => Promise<unknown>;
  closeApp: () => Promise<unknown>;
  setMiniMode: (enable: boolean) => Promise<unknown>;
  toggleMaximize: () => Promise<unknown>;
  
  // Comandos para ventana principal
  dragMainWindow: () => Promise<unknown>;                 
  isWindowMaximized: () => Promise<boolean>;
  restoreWindow: () => Promise<unknown>;                 
  
  // Comandos para modo mini
  dragWindow: () => Promise<unknown>;
  saveMiniWindowPosition: () => Promise<unknown>;
  
  // Music handlers
  openFile: () => Promise<string[]>;
  processMetadata: (file_paths: string[]) => Promise<Song[]>;
  getAudioData: (file_path: string) => Promise<string>;
  
  // Config handlers
  getConfig: () => Promise<unknown>;
  saveConfig: (config: any) => Promise<unknown>;
  openConfigFolder: () => Promise<unknown>;
}

declare global {
  interface Window {
    __TAURI__?: any;
    tauriAPI: TauriAPI;
  }
}