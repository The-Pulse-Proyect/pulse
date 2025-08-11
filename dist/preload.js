"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electronHandler = {
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'),
    closeApp: () => electron_1.ipcRenderer.invoke('close-app'),
    minimizeApp: () => electron_1.ipcRenderer.invoke('minimize-app'),
    maximizeApp: () => electron_1.ipcRenderer.invoke('maximize-app'),
    openFile: () => electron_1.ipcRenderer.invoke('dialog:openFile'),
    processMetadata: (filePaths) => electron_1.ipcRenderer.invoke('music:processMetadata', filePaths),
    toggleMiniMode: (isMini) => electron_1.ipcRenderer.invoke('toggle-mini-mode', isMini),
    getUserConfig: () => electron_1.ipcRenderer.invoke('config:get'),
    openConfigFolder: () => electron_1.ipcRenderer.invoke('config:open-folder'),
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronHandler);
//# sourceMappingURL=preload.js.map