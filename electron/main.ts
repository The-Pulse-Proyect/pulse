import {app, BrowserWindow, ipcMain} from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createMainWindow } from './window/mainWindow';
import { registerWindowControls } from './handlers/windowControls';
import { registerMusicHandlers } from './handlers/musicHandlers';
import electronSquirrelStartup from 'electron-squirrel-startup';
import shell = Electron.shell;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
let mainWindow: BrowserWindow;
let userSettings: any = {};

async function loadUserSettings() {
  const userDataPath = app.getPath('userData');
  const configPath = path.join(userDataPath, 'config');

  try {
    await fs.access(configPath);
  } catch {
    await fs.mkdir(configPath, { recursive: true });
  }

  const settingsFilePath = path.join(configPath, 'settings.json');

  try {
    await fs.access(settingsFilePath);
    const fileContent = await fs.readFile(settingsFilePath, 'utf-8');
    userSettings = JSON.parse(fileContent);
  } catch {
    const defaultConfig = {
      welcomeMessage: "Hola desde tu configuración personalizada!",
      autoPlay: false,
      theme: "dark"
    };
    await fs.writeFile(settingsFilePath, JSON.stringify(defaultConfig, null, 2));
    userSettings = defaultConfig;
  }
}

const isDev = !app.isPackaged;
if (electronSquirrelStartup) {
  app.quit();
}

const initialize = () => {
  loadUserSettings();
  mainWindow = createMainWindow(isDev);
  registerWindowControls();
  registerMusicHandlers(mainWindow);
};


ipcMain.handle('config:get', () => {
  return userSettings;
});

ipcMain.handle('config:open-folder', () => {
  const configPath = path.join(app.getPath('userData'), 'config');
  shell.openPath(configPath);
});


// This method will be called when Electron has finished initialization
app.on('ready', initialize);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    initialize();
  }
});
