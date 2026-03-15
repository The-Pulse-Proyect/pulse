import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { Song } from './types/tauri';

// Event listeners
export const setupTauriListeners = () => {
    listen('mini-mode', (event) => {
    window.dispatchEvent(new CustomEvent('mini-mode', { detail: event.payload }));
  });
  
  listen('tauri://file-drop', (event) => {
    console.log('Evento file-drop recibido:', event);
    window.dispatchEvent(new CustomEvent('tauri-file-drop', { detail: event.payload }));
  });
  
  listen('file-drop-hover', (event) => {
    console.log('Evento file-drop-hover recibido:', event);
    window.dispatchEvent(new CustomEvent('file-drop-hover', { detail: event.payload }));
  });
  
  listen('files-dropped', (event) => {
    console.log('Evento files-dropped recibido:', event);
    window.dispatchEvent(new CustomEvent('files-dropped', { detail: event.payload }));
  });
  
  // Nuevos listeners para streaming
  listen('stream-progress', (event) => {
    window.dispatchEvent(new CustomEvent('stream-progress', { detail: event.payload }));
  });
  
  listen('stream-ended', (event) => {
    window.dispatchEvent(new CustomEvent('stream-ended', { detail: event.payload }));
  });
};

export const windowControls = {
  minimizeApp: (): Promise<unknown> => invoke('minimize_window'),
  maximizeApp: (): Promise<unknown> => invoke('maximize_window'),
  closeApp: (): Promise<unknown> => invoke('close_window'),
  setMiniMode: (enable: boolean): Promise<unknown> => invoke('set_mini_mode', { enable }),
  toggleMaximize: (): Promise<unknown> => invoke('toggle_maximize'),
  dragMainWindow: (): Promise<unknown> => invoke('drag_main_window'),
  isWindowMaximized: (): Promise<boolean> => invoke('is_window_maximized'),
  restoreWindow: (): Promise<unknown> => invoke('restore_window'),
  dragWindow: (): Promise<unknown> => invoke('drag_window'),
  saveMiniWindowPosition: (): Promise<unknown> => invoke('save_mini_window_position'),
};

// Music handlers - Nombres actualizados y NUEVOS
export const musicHandlers = {
  openFile: (): Promise<string[]> => invoke('open_file_dialog'),
  processMetadata: (filePaths: string[]): Promise<Song[]> => 
    invoke('process_metadata', { filePaths }),
  getAudioData: (filePath: string): Promise<string | null> => 
    invoke('get_audio_data', { filePath }),
  getAudioStreamUrl: (filePath: string): Promise<string | null> => 
    invoke('get_audio_stream_url', { filePath }),
  handleDroppedFiles: (filePaths: string[]): Promise<Song[]> => 
    invoke('handle_dropped_files', { filePaths }), 
};

// Config handlers - Nombres actualizados
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

if (typeof window !== 'undefined') {
  window.tauriAPI = tauriAPI;
}

export type TauriAPI = typeof tauriAPI;