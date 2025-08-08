"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'),
    closeApp: () => electron_1.ipcRenderer.invoke('close-app'),
    minimizeApp: () => electron_1.ipcRenderer.invoke('minimize-app'),
});
//# sourceMappingURL=preload.js.map