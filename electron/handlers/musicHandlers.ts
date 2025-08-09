import { ipcMain, dialog, BrowserWindow } from 'electron';
import { parseFile } from 'music-metadata';
import path from 'path';
import { Song } from '../types/music';

export const registerMusicHandlers = (mainWindow: BrowserWindow) => {
  // Manejador para abrir el diálogo de selección de archivos
  ipcMain.handle('dialog:openFile', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Música', extensions: ['mp3', 'wav', 'ogg'] }]
      });

      if (result.canceled) {
        return [];
      }

      console.log('Archivos seleccionados:', result.filePaths);
      return result.filePaths;
    } catch (error) {
      console.error('Error al abrir el diálogo:', error);
      return [];
    }
  });

  // Manejador para procesar la metadata de los archivos
  ipcMain.handle('music:processMetadata', async (event, filePaths: string[]) => {
    try {
      const songsMetadata = await Promise.all(
        filePaths.map(async (filePath: string) => {
          try {
            const metadata = await parseFile(filePath);
            
            // Extraer la imagen si existe
            let coverUrl: string | undefined;
            if (metadata.common.picture && metadata.common.picture.length > 0) {
              const picture = metadata.common.picture[0];
              // Usamos Buffer.from para convertir el array de bytes a base64
              const base64String = Buffer.from(picture.data).toString('base64');
              coverUrl = `data:${picture.format};base64,${base64String}`;
            }

            // Formatear la duración a minutos:segundos
            const formatDuration = (duration: number): string => {
              const minutes = Math.floor(duration / 60);
              const seconds = Math.floor(duration % 60);
              return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            };

            return {
              title: metadata.common.title || path.basename(filePath),
              artist: metadata.common.artist || 'Desconocido',
              album: metadata.common.album || 'Desconocido',
              duration: formatDuration(metadata.format.duration || 0),
              durationRaw: metadata.format.duration || 0, // Mantener la duración original en segundos
              coverUrl,
              filePath
            };
          } catch (error) {
            console.error(`Error procesando archivo ${filePath}:`, error);
            return {
              title: path.basename(filePath),
              artist: 'Desconocido',
              album: 'Desconocido',
              duration: '0:00',
              durationRaw: 0,
              filePath
            };
          }
        })
      );

      console.log('Metadata procesada:', songsMetadata);
      return songsMetadata;
    } catch (error) {
      console.error('Error al procesar los archivos de música:', error);
      return [];
    }
  });
};
