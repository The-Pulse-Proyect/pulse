"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Configurar el listener para mini-mode una sola vez
electron_1.ipcRenderer.on('mini-mode', (_event, enable) => {
    window.dispatchEvent(new CustomEvent('mini-mode', { detail: enable }));
});
const electronHandler = {
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'),
    closeApp: () => electron_1.ipcRenderer.invoke('close-app'),
    minimizeApp: () => electron_1.ipcRenderer.invoke('minimize-app'),
    maximizeApp: () => electron_1.ipcRenderer.invoke('maximize-app'),
    setMiniMode: (enable) => electron_1.ipcRenderer.invoke('set-mini-mode', enable),
    openFile: () => electron_1.ipcRenderer.invoke('dialog:openFile'),
    processMetadata: (filePaths) => electron_1.ipcRenderer.invoke('music:processMetadata', filePaths),
    // Musica
    getAudioData: (filePath) => electron_1.ipcRenderer.invoke('get-audio-data', filePath)
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronHandler);
//# sourceMappingURL=preload.js.map