// src/types/electron-api.d.ts
export {};

declare global {
  interface Window {
    electronAPI: {
      closeApp: () => void;
      minimizeApp: () => void;
      maximizeApp: () => void;
      openFile: () => Promise<string[]>;
      // Puedes agregar más métodos aquí si expones otros
    };
  }

  interface Song {
    name: string
    poster: string
    duration: string
    author?: string
    liked?: boolean
  } 
}


