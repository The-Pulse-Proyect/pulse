// src/types/electron-api.d.ts
export {};

declare global {
  interface Window {
    electronAPI: {
      closeApp: () => void;
      minimizeApp: () => void;
      openFile: () => Promise<string[]>;
      // Puedes agregar más métodos aquí si expones otros
    };
  }
}
