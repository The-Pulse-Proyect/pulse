"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const mainWindow_1 = require("./window/mainWindow");
const windowControls_1 = require("./handlers/windowControls");
const musicHandlers_1 = require("./handlers/musicHandlers");
const electron_squirrel_startup_1 = __importDefault(require("electron-squirrel-startup"));
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
let mainWindow;
const isDev = !electron_1.app.isPackaged;
if (electron_squirrel_startup_1.default) {
    electron_1.app.quit();
}
const initialize = () => {
    mainWindow = (0, mainWindow_1.createMainWindow)(isDev);
    (0, windowControls_1.registerWindowControls)();
    (0, musicHandlers_1.registerMusicHandlers)(mainWindow);
};
// This method will be called when Electron has finished initialization
electron_1.app.on('ready', initialize);
// Quit when all windows are closed, except on macOS
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        initialize();
    }
});
//# sourceMappingURL=main.js.map