"use strict";
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const electronSquirrelStartup = require('electron-squirrel-startup');
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
const isDev = !app.isPackaged;
if (electronSquirrelStartup) {
    app.quit();
}
const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        },
    });
    // Load the app.
    console.log(process.env.VITE_DEV_SERVER_URL);
    if (isDev) {
        try {
            require('electron-reloader')(module);
        }
        catch (err) {
            console.warn('🔁 electron-reloader no disponible:', err);
        }
        mainWindow.loadURL('http://localhost:5173');
        // Open the DevTools.
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
    }
};
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
// Example IPC handler
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});
ipcMain.handle('close-app', (event) => {
    console.log("Cerrando aplicación");
    const ventana = BrowserWindow.getFocusedWindow();
    if (ventana)
        ventana.close();
});
ipcMain.handle('minimize-app', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win)
        win.minimize();
});
ipcMain.handle('maximize-app', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win)
        win.maximize();
});
//# sourceMappingURL=main.js.map