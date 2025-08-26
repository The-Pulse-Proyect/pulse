// Extiende el tipo Window para exponer electronAPI y eventos personalizados
interface ElectronAPI {
  getAudioData(filePath: string): unknown;
  minimizeApp: () => void;
  maximizeApp: () => void;
  closeApp: () => void;
  setMiniMode: (enable: boolean) => void;
  openConfigFolder: () => void;
}

interface Window {
  electronAPI: ElectronAPI;
}
