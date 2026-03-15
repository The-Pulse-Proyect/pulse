// src/app/components/drop-zone/drop-zone.tsx
import React, { useEffect, useState } from 'react';
import { useMusicStore } from '../../../store/useMusic';
import { tauriAPI } from '../../../tauri-bridge';

interface DropZoneProps {
  children: React.ReactNode;
}

export const DropZone: React.FC<DropZoneProps> = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addSongsToPlaylist, setCurrentSong, toggleSongPlay, currentSong } = useMusicStore();

  // Función para procesar archivos y reproducir
  const processAndPlayFiles = async (filePaths: string[]) => {
    if (!filePaths || filePaths.length === 0) return;

    try {
      setError(null);
      console.log('Procesando archivos:', filePaths);
      
      // Procesar los metadatos
      const songs = await tauriAPI.processMetadata(filePaths);
      
      console.log('Canciones procesadas:', songs);
      
      if (songs.length > 0) {
        // Agregar a la playlist (esto ahora no debería dar error de cuota)
        addSongsToPlaylist(songs);
        
        // Pequeño delay para asegurar que el estado se actualice
        setTimeout(() => {
          // Si no hay canción actualmente reproduciéndose, reproducir la primera
          if (!currentSong) {
            console.log('Reproduciendo primera canción:', songs[0].title);
            setCurrentSong(songs[0]);
            // Usar toggleSongPlay para iniciar reproducción
            toggleSongPlay(songs[0].id);
          } else {
            console.log('Ya hay una canción reproduciéndose');
          }
        }, 200); // Aumentado un poco el delay
      }
    } catch (error) {
      console.error('Error procesando archivos:', error);
      setError('Error al procesar los archivos. Intenta de nuevo.');
    } finally {
      // Siempre desactivar el estado de dragging
      setIsDragging(false);
    }
  };

  useEffect(() => {
    // Escuchar evento de archivos arrastrados desde Tauri
    const handleFileDrop = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const filePaths = customEvent.detail;
      await processAndPlayFiles(filePaths);
    };

    // Escuchar hover para feedback visual
    const handleDropHover = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsDragging(customEvent.detail);
      // Si hay error, ocultarlo cuando se vuelva a arrastrar
      if (customEvent.detail) {
        setError(null);
      }
    };

    // Escuchar archivos ya procesados desde Rust (por si acaso)
    const handleFilesDropped = (event: Event) => {
      const customEvent = event as CustomEvent;
      const songs = customEvent.detail;
      
      if (songs && songs.length > 0) {
        addSongsToPlaylist(songs);
        
        setTimeout(() => {
          if (!currentSong) {
            setCurrentSong(songs[0]);
            toggleSongPlay(songs[0].id);
          }
        }, 200);
      }
      
      setIsDragging(false);
    };

    // Manejar cuando el cursor sale de la ventana
    const handleDragLeave = () => {
      setIsDragging(false);
    };

    window.addEventListener('tauri-file-drop', handleFileDrop);
    window.addEventListener('file-drop-hover', handleDropHover);
    window.addEventListener('files-dropped', handleFilesDropped);
    window.addEventListener('dragleave', handleDragLeave);

    return () => {
      window.removeEventListener('tauri-file-drop', handleFileDrop);
      window.removeEventListener('file-drop-hover', handleDropHover);
      window.removeEventListener('files-dropped', handleFilesDropped);
      window.removeEventListener('dragleave', handleDragLeave);
    };
  }, [addSongsToPlaylist, setCurrentSong, toggleSongPlay, currentSong]);
//El diseño de la dropzone a tu gusto pa' lol ;)
  return (
    <div className="relative">
      {isDragging && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm border-4 border-blue-500 border-dashed rounded-lg m-4 flex items-center justify-center">
            <div className="bg-gray-900/90 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-xl font-medium">Suelta para añadir a la biblioteca</span>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="fixed top-4 right-4 z-[9999] bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}
      
      {children}
    </div>
  );
};