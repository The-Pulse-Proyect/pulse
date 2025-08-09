import { ipcMain, BrowserWindow, dialog } from 'electron';

export const registerWindowControls = () => {
  ipcMain.handle('get-app-version', (event) => {
    return process.env.npm_package_version;
  });

  ipcMain.handle('close-app', () => {
    console.log("Cerrando aplicación");
    const ventana = BrowserWindow.getFocusedWindow();
    if (ventana) ventana.close();
  });

  ipcMain.handle('minimize-app', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
  });

  ipcMain.handle('maximize-app', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });
};
