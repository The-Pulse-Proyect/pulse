import { ipcRenderer, contextBridge } from 'electron';
import { Song } from './types/music';

const electronHandler = {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  closeApp: () => ipcRenderer.invoke('close-app'),
  minimizeApp: () => ipcRenderer.invoke('minimize-app'),
  maximizeApp: () => ipcRenderer.invoke('maximize-app'),
  openFile: (): Promise<string[]> => ipcRenderer.invoke('dialog:openFile'),
  processMetadata: (filePaths: string[]): Promise<Song[]> => ipcRenderer.invoke('music:processMetadata', filePaths),
  toggleMiniMode: (isMini: boolean) => ipcRenderer.invoke('toggle-mini-mode', isMini),
  getUserConfig: () => ipcRenderer.invoke('config:get'),
  openConfigFolder: () => ipcRenderer.invoke('config:open-folder'),
};

contextBridge.exposeInMainWorld('electronAPI', electronHandler);
