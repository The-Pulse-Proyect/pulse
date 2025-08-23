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


  // Cambiar a modo mini en vez de minimizar
  // Almacenar el estado anterior de la ventana
  let previousBounds: Electron.Rectangle | null = null;
  let isMiniMode = false;

  // Función auxiliar para manejar el modo mini
  const setWindowMiniMode = (win: BrowserWindow, enable: boolean) => {
    if (enable && !isMiniMode) {
      // Guardar el estado actual antes de cambiar a mini
      previousBounds = win.getBounds();
      const display = require('electron').screen.getPrimaryDisplay();
      const { width, height } = display.workAreaSize;
      if (win.isMaximized()) {
          win.unmaximize();
        }
      win.setPosition(width - 340 - 20, height - 200);
      win.setSize(340, 120);
      win.setResizable(false);
      win.setAlwaysOnTop(true);
      win.setMovable(true);
      win.setMinimizable(true);
      isMiniMode = true;
    } else if (!enable && isMiniMode) {
      // Restaurar el estado anterior
        win.setSize(1200, 800);
        win.center();
      
      win.setResizable(true);
      win.setAlwaysOnTop(false);
      win.setMovable(true);
      win.setMinimizable(true);
      isMiniMode = false;
    }
    win.webContents.send('mini-mode', enable);
  };

  // Handler para minimizar (activa modo mini)
  ipcMain.handle('minimize-app', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      setWindowMiniMode(win, true);
    }
  });

  // Handler para alternar modo mini
  ipcMain.handle('set-mini-mode', (event, enable: boolean) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      setWindowMiniMode(win, enable);
    }
  });

  ipcMain.handle('maximize-app', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      if (isMiniMode) {
        // Si estamos en modo mini, restaurar al estado normal
        setWindowMiniMode(win, false);
      } else {
        // Si no estamos en modo mini, alternar maximizado
        if (win.isMaximized()) {
          win.unmaximize();
        } else {
          previousBounds = win.getBounds(); // Guardar estado antes de maximizar
          win.maximize();
        }
      }
    }
  });
};
