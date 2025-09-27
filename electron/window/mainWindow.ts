import { BrowserWindow } from 'electron';
import path from 'path';

export const createMainWindow = (isDev: boolean): BrowserWindow => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 320,
    minHeight: 180,
    frame: false,
    icon: path.join(__dirname, '../../assets/logo.ico'),
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.webContents.openDevTools();
   
    mainWindow.loadFile(path.join(__dirname, '../../frontend/dist/index.html'));
  }

  return mainWindow;
};
