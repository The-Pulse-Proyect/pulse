import { useLoadStore } from "@/store/useLoad";
import { useMusicStore } from "@/store/useMusic";

function useFile() {
    const {
        addSongsToPlaylist,
    } = useMusicStore();
    const { setTotalSongs, setSongsLoaded, setLoad } = useLoadStore()
  
    const ProcessFiles = async (currentId?: string) => {
      const filePaths = await window.tauriAPI.openFile();
      if (!filePaths?.length) return;
      
      setLoad(true);
      setTotalSongs(filePaths.length);
      
      try {
        const CHUNK_SIZE = 10;
        let processedCount = 0;
        
        // Procesar todos los archivos en chunks usando requestAnimationFrame
        const processNextChunk = async (startIndex: number) => {
          if (startIndex >= filePaths.length) {
            setLoad(false);
            setSongsLoaded(null);
            setTotalSongs(null);
            return;
          }
          
          const chunk = filePaths.slice(startIndex, startIndex + CHUNK_SIZE);
          
          try {
            const songMetadata = await window.tauriAPI.processMetadata(chunk);
            
            // addSongsToPlaylist ahora es async y guarda en IndexedDB automáticamente
            if (songMetadata?.length) {
              await addSongsToPlaylist(songMetadata, currentId);
            }
            
            processedCount = Math.min(startIndex + CHUNK_SIZE, filePaths.length);
            setSongsLoaded(processedCount);
          } catch (error) {
            console.error('Error procesando chunk:', error);
          }
          
          // Usar requestAnimationFrame para no bloquear
          requestAnimationFrame(() => {
            processNextChunk(startIndex + CHUNK_SIZE);
          });
        };
        
        // Iniciar procesamiento
        processNextChunk(0);
      } catch (error) {
        console.error('Error procesando archivos:', error);
        setLoad(false);
      }
    };

    return { ProcessFiles }
}

export default useFile