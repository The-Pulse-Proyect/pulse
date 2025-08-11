"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const mainWindow_1 = require("./window/mainWindow");
const windowControls_1 = require("./handlers/windowControls");
const musicHandlers_1 = require("./handlers/musicHandlers");
const electron_squirrel_startup_1 = __importDefault(require("electron-squirrel-startup"));
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
let mainWindow;
let userSettings = {};
const isDev = !electron_1.app.isPackaged;
if (electron_squirrel_startup_1.default) {
    electron_1.app.quit();
}
async function loadUserSettings() {
    const userDataPath = electron_1.app.getPath('userData');
    const configPath = path.join(userDataPath, 'config');
    try {
        await fs.access(configPath);
    }
    catch {
        await fs.mkdir(configPath, { recursive: true });
    }
    const settingsFilePath = path.join(configPath, 'settings.json');
    try {
        await fs.access(settingsFilePath);
        const fileContent = await fs.readFile(settingsFilePath, 'utf-8');
        userSettings = JSON.parse(fileContent);
    }
    catch {
        const defaultConfig = {
            welcomeMessage: "Hola desde tu configuración personalizada!",
            autoPlay: false,
            theme: "dark"
        };
        await fs.writeFile(settingsFilePath, JSON.stringify(defaultConfig, null, 2));
        userSettings = defaultConfig;
    }
}
const SIZES = {
    normal: { width: 1200, height: 800 },
    mini: { width: 380, height: 180 }
};
const initialize = () => {
    loadUserSettings();
    mainWindow = (0, mainWindow_1.createMainWindow)(isDev);
    (0, windowControls_1.registerWindowControls)();
    (0, musicHandlers_1.registerMusicHandlers)(mainWindow);
    electron_1.ipcMain.handle('config:get', () => {
        return userSettings;
    });
    electron_1.ipcMain.handle('config:open-folder', () => {
        const configPath = path.join(electron_1.app.getPath('userData'), 'config');
        electron_1.shell.openPath(configPath);
    });
    electron_1.ipcMain.handle('toggle-mini-mode', (event, isMini) => {
        if (isMini) {
            mainWindow.setResizable(false);
            mainWindow.setAlwaysOnTop(true, 'screen-saver');
            mainWindow.setSize(SIZES.mini.width, SIZES.mini.height, true);
        }
        else {
            mainWindow.setSize(SIZES.normal.width, SIZES.normal.height, true);
            mainWindow.setResizable(true);
            mainWindow.setAlwaysOnTop(false);
        }
    });
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