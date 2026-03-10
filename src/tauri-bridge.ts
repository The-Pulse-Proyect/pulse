import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { Song } from './types/song';

// Event listeners
export const setupTauriListeners = () => {
  listen('mini-mode', (event) => {
    window.dispatchEvent(new CustomEvent('mini-mode', { detail: event.payload }));
  });
};

// Window controls - ACTUALIZADO
export const windowControls = {
  // Comandos generales
  minimizeApp: (): Promise<unknown> => invoke('minimize_window'),
  maximizeApp: (): Promise<unknown> => invoke('maximize_window'),
  closeApp: (): Promise<unknown> => invoke('close_window'),
  setMiniMode: (enable: boolean): Promise<unknown> => invoke('set_mini_mode', { enable }),
  toggleMaximize: (): Promise<unknown> => invoke('toggle_maximize'),
  
  // Comandos para ventana principal
  dragMainWindow: (): Promise<unknown> => invoke('drag_main_window'),
  isWindowMaximized: (): Promise<boolean> => invoke('is_window_maximized'),
  restoreWindow: (): Promise<unknown> => invoke('restore_window'),
  
  // Comandos para modo mini
  dragWindow: (): Promise<unknown> => invoke('drag_window'),
  saveMiniWindowPosition: (): Promise<unknown> => invoke('save_mini_window_position'),
};

// Music handlers
export const musicHandlers = {
  openFile: (): Promise<string[]> => invoke('open_file_dialog'),
  processMetadata: (filePaths: string[]): Promise<Song[]> => 
    invoke('process_metadata', { filePaths }),
  getAudioData: (filePath: string): Promise<string> => 
    invoke('get_audio_data', { filePath }),
};

// Config handlers
export const configHandlers = {
  getConfig: () => invoke('get_config'),
  saveConfig: (config: any) => invoke('save_config', { config }),
  openConfigFolder: () => invoke('open_config_folder'),
};

// Export unified API
export const tauriAPI = {
  ...windowControls,
  ...musicHandlers,
  ...configHandlers,
};

// ASIGNAR GLOBALMENTE
if (typeof window !== 'undefined') {
  window.tauriAPI = tauriAPI;
}