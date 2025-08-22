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
        html5: true, // Permite la reproducción de archivos grandes sin cargar todo en memoria
        
        volume: 1.0,
        loop: useSoundStore.getState().repeatMode, // Asegura que siempre se use el estado más reciente
        onloaderror: (id, err) => console.error('Error al cargar el audio:', err),
        onend: () => {
            const { repeatMode, isShuffled } = useSoundStore.getState();
            const { currentPlaylist, currentSong, setCurrentSong } = useMusicStore.getState();

            if (repeatMode) {
                // Howler se encarga del bucle, no hacemos nada aquí.
                return;
            }

            let nextSong;
            const songIndex = currentPlaylist.findIndex(song => song.id === currentSong?.id);

            if (isShuffled) {
                const nextIndex = getRandomIndexExcluding(currentPlaylist, songIndex);
                nextSong = currentPlaylist[nextIndex];
            } else {
                const isLastSong = songIndex === currentPlaylist.length - 1;
                nextSong = isLastSong ? currentPlaylist[0] : currentPlaylist[songIndex + 1];
            }

            if (nextSong) {
                setCurrentSong(nextSong);
                playSound(nextSong.filePath);
            } else {
                // Si no hay próxima canción (lista vacía o error), detenemos la reproducción.
                const { setIsPlaying } = useMusicStore.getState();
                setIsPlaying(false);
            }
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