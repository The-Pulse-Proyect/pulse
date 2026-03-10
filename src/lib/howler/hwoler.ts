import { useMusicStore } from "@/store/useMusic";
import { useSoundStore } from "@/store/useSound";
import { Howl } from "howler"
import { getRandomIndexExcluding } from "../utils";

export async function playSound(filePath: string) {
    
    const { setCurrentSound, currentSound, setCurrentTime } = useSoundStore.getState()
    
    // Resetear tiempo actual
    setCurrentTime(0);
    
    if (currentSound) {
        currentSound.stop();
        currentSound.unload();
        setCurrentSound(null);
    }
    
    try {
        const data = await window.tauriAPI.getAudioData(filePath);
        console.log(data)
        if (!data) {
            return;
        }

        const sound = new Howl({
            src: [data],
            html5: true,
            volume: 1.0,
            loop: useSoundStore.getState().repeatMode,
            onloaderror: (_id, err) => console.error('Error al cargar el audio en Howl:', err),
            onload: () => console.log('Audio cargado correctamente en Howl'),
            onplay: () => console.log('Audio comenzó a reproducirse'),
            onpause: () => console.log('Audio pausado'),
            onstop: () => console.log('Audio detenido'),
            onseek: () => {
                // Actualizar tiempo cuando se hace seek
                const seek = sound.seek();
                if (typeof seek === "number") {
                    setCurrentTime(Math.round(seek));
                }
            },
            onend: () => {
                const { repeatMode, isShuffled } = useSoundStore.getState();
                const { currentPlaylist, currentSong, setCurrentSong } = useMusicStore.getState();

                if (repeatMode) {
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
                    playSound(nextSong.file_path);
                } else {
                    const { setIsPlaying } = useMusicStore.getState();
                    setIsPlaying(false);
                }
            },
        });

        setCurrentSound(sound);
        sound.play();
        
        return sound;
        
    } catch (error) {
    }
}

export function previus(){
    const { setCurrentSound, currentSound, setCurrentTime } = useSoundStore.getState()
    const { currentPlaylist, currentSong, setCurrentSong, setIsPlaying } = useMusicStore.getState()
    
    if (currentSound) {
        currentSound.stop();
        currentSound.unload();
        setCurrentSound(null);
    }

    if (!currentSong) return;

    const songIndex = currentPlaylist.findIndex(song => song.id === currentSong.id);
    if (songIndex > 0) {
        setCurrentSong(currentPlaylist[songIndex - 1]);
    } else {
        setCurrentSong(currentPlaylist[currentPlaylist.length - 1]);
    }
    setCurrentTime(0); // Resetear tiempo
    setIsPlaying(true)
}

export function next(){
    const { setCurrentSound, currentSound, setCurrentTime } = useSoundStore.getState()
    const { currentPlaylist, currentSong, setCurrentSong, setIsPlaying } = useMusicStore.getState()
    
    if (currentSound) {
        currentSound.stop();
        currentSound.unload();
        setCurrentSound(null);
    }

    if (!currentSong) return;

    const songIndex = currentPlaylist.findIndex(song => song.id === currentSong.id);
    if (songIndex < currentPlaylist.length - 1) {
        setCurrentSong(currentPlaylist[songIndex + 1]);
    } else {
        setCurrentSong(currentPlaylist[0]);
    }
    setCurrentTime(0); // Resetear tiempo
    setIsPlaying(true)
}