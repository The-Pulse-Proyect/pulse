interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  closeApp: () => Promise<void>;
  minimizeApp: () => Promise<void>;
  maximizeApp: () => Promise<void>;
  openFile: () => Promise<Song[]>;
  processMetadata: (filePaths: Song[]) => Promise<Song[]>;
  toggleMiniMode: (isMini: boolean) => Promise<void>;
  getUserConfig: () => Promise<any>;
  openConfigFolder: () => Promise<void>;
}

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
}


declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
