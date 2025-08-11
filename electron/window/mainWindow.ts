import { BrowserWindow } from 'electron';
import path from 'path';

export const createMainWindow = (isDev: boolean): BrowserWindow => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
  });

  if (isDev) {
    try {
      require('electron-reloader')(module);
    } catch (err) {
      console.warn('🔁 electron-reloader no disponible:', err);
    }

    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../frontend/dist/index.html'));
  }

  return mainWindow;
};
