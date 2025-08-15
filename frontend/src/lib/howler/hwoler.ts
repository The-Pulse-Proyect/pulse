import { useMusicStore } from "@/store/useMusic";
import { useSoundStore } from "@/store/useSound";
import { Howl } from "howler"
import { getRandomIndexExcluding } from "../utils";




export async function playSound(filePath: string) {
    const { setCurrentSound, currentSound , repeatMode, isShuffled } = useSoundStore.getState()
    const { currentPlaylist, currentSong,  setCurrentSong } = useMusicStore.getState()
    
    if (currentSound) {
        currentSound.stop();
        currentSound.unload(); // libera recursos
        setCurrentSound(null); // Limpia el sonido actual
    }

    const data = await window.electronAPI.getAudioData(filePath)
    if (!data) {
        console.error("No se pudo obtener los datos de audio para el archivo:", filePath);
        return;
    }

    const sound = new Howl({
        src: [data],
        html5: false, // Permite la reproducción de archivos grandes sin cargar todo en memoria
        
        volume: 1.0,
        loop: repeatMode,
        onloaderror: (id, err) => console.error('Error al cargar el audio:', err),
        onend: () => {
            if (repeatMode) {
                return;
            }
            if (isShuffled) {
                const songIndex = currentPlaylist.findIndex(song => song.id === currentSong?.id);
                const index = getRandomIndexExcluding(currentPlaylist, songIndex)
                setCurrentSong(currentPlaylist[index]);
                playSound(currentPlaylist[index].filePath)
                return
            }
            // Si no está en modo repetición, pasamos a la siguiente canción
            const songIndex = currentPlaylist.findIndex(song => song.id === currentSong?.id);
            if (songIndex < currentPlaylist.length - 1) {
                setCurrentSong(currentPlaylist[songIndex + 1]);
            } else {
                setCurrentSong(currentPlaylist[0]); // Reinicia al primer elemento si es el último
            }
            playSound(currentPlaylist[songIndex + 1]?.filePath || currentPlaylist[0].filePath);
        },
    })

    setCurrentSound(sound)

    sound.play()
    return sound
}

export function previus(){
    const { setCurrentSound, currentSound } = useSoundStore.getState()
    const { currentPlaylist, currentSong,  setCurrentSong, setIsPlaying } = useMusicStore.getState()
    // Si hay un sonido actual, lo detenemos y liberamos recursos
    // Si no hay canción actual, no hacemos nada
    if (currentSound) {
        currentSound.stop();
        currentSound.unload(); // libera recursos
        setCurrentSound(null); // Limpia el sonido actual
    }

    if (!currentSong) return;

    const songIndex = currentPlaylist.findIndex(song => song.id === currentSong.id);
    if (songIndex > 0) {
        setCurrentSong(currentPlaylist[songIndex - 1]);
    } else {
        setCurrentSong(currentPlaylist[currentPlaylist.length - 1]); // Vuelve al último si es el primero
    }
    setIsPlaying(true)
}

export function next(){
    const { setCurrentSound, currentSound } = useSoundStore.getState()
    const { currentPlaylist, currentSong,  setCurrentSong, setIsPlaying } = useMusicStore.getState()
    
    if (currentSound) {
        currentSound.stop();
        currentSound.unload(); // libera recursos
        setCurrentSound(null); // Limpia el sonido actual
    }

    if (!currentSong) return;

    const songIndex = currentPlaylist.findIndex(song => song.id === currentSong.id);
    if (songIndex < currentPlaylist.length - 1) {
        setCurrentSong(currentPlaylist[songIndex + 1]);
    } else {
        setCurrentSong(currentPlaylist[0]); // Reinicia al primer elemento si es el último
    }
    setIsPlaying(true)

}