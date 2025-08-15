// Extiende el tipo Window para exponer electronAPI y eventos personalizados
interface ElectronAPI {
  minimizeApp: () => void;
  maximizeApp: () => void;
  closeApp: () => void;
  setMiniMode: (enable: boolean) => void;
}

interface Window {
  electronAPI: ElectronAPI;
}
