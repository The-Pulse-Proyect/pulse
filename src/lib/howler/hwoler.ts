import { useMusicStore } from "@/store/useMusic";
import { useSoundStore } from "@/store/useSound";
import { getRandomIndexExcluding } from "../utils";
import { useConfigStore } from "@/store/useConfig";

export async function playSound(filePath: string, songId?: string) {
  const { setCurrentSound } = useSoundStore.getState();
  const { setOpenErrorDialog } = useConfigStore.getState();
  const { setCurrentSong, setIsPlaying } = useMusicStore.getState();

  // Stop previous sound (works for both Howl and HTMLAudioElement)
  stopCurrentSound();

  const streamUrl = await window.tauriAPI.getAudioStreamUrl(filePath);
  const data = streamUrl ?? await window.tauriAPI.getAudioData(filePath);

  // Si no hay datos, es un error real (archivo no encontrado o inaccesible)
  if (!data) {
    const current = useMusicStore.getState().currentSong ?? null;
    setOpenErrorDialog(true, 'No se encontró el audio para la canción.', current);
    // Cambiar a siguiente canción en lugar de eliminar
    return null;
  }

  // Choose element type based on video flag
  const isVideo = !!useMusicStore.getState().currentSong?.isVideo;
  let audio: HTMLMediaElement;
  if (isVideo) {
    const v = document.createElement('video');
    v.src = data as string;
    audio = v as HTMLMediaElement;
  } else {
    audio = new Audio(data as string) as HTMLMediaElement;
  }
  audio.preload = 'auto';
  audio.crossOrigin = 'anonymous';
  // Set loop using the current store value
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  try { (audio as HTMLMediaElement).loop = useSoundStore.getState().repeatMode; } catch (e: unknown) { /* ignore */ }
  if (isVideo) {
    // For video elements we keep it hidden (we only need audio)
    (audio as HTMLVideoElement).playsInline = true;
    (audio as HTMLVideoElement).muted = false;
  }

  // Solo considerar error si es un error de red o formato, no de tiempo de carga
  let hasNetworkError = false;
  audio.onerror = () => {
    // Ignorar errores temporales de carga, solo procesar errores reales
    if (audio.networkState === 3) { // NetworkState.NO_SOURCE = 3
      hasNetworkError = true;
      const current = useMusicStore.getState().currentSong;
      const targetId = songId || current?.id;
      if (current?.id === targetId && hasNetworkError) {
        setOpenErrorDialog(true, 'Error al cargar el archivo de audio.', current ?? null);
        // Pasar a siguiente en lugar de eliminar
        skipToNextSong();
      }
    }
    // Si es solo un error temporal de carga, ignorar y continuar reproduciendo
  };

  audio.onended = () => {
    const { repeatMode, isShuffled } = useSoundStore.getState();
    const { currentSong } = useMusicStore.getState();
    if (repeatMode) return;

    const currentPL = useMusicStore.getState().currentPlaylist;
    const songIndex = currentPL.findIndex(song => song.id === currentSong?.id);
    const nextSong = isShuffled
      ? currentPL[getRandomIndexExcluding(currentPL, songIndex)]
      : currentPL[(songIndex + 1) % currentPL.length];

    if (nextSong) {
      setCurrentSong(nextSong);
      playSound(nextSong.filePath, nextSong.id);
    } else {
      setIsPlaying(false);
    }
  };

  setCurrentSound(audio as HTMLMediaElement);
  audio.play().catch((err: unknown) => console.error('Audio playback error', err));
  return audio;
}

function stopCurrentSound() {
  const { setCurrentSound, currentSound } = useSoundStore.getState();
  if (!currentSound) return;
  // Detect Howl-like (has stop/unload functions)
  const maybeHowl = currentSound as unknown as { stop?: unknown; unload?: unknown };
  const maybeAudio = currentSound as unknown as HTMLMediaElement;
  if (typeof maybeHowl.stop === 'function') {
    try {
      (maybeHowl.stop as () => void)();
      if (typeof maybeHowl.unload === 'function') (maybeHowl.unload as () => void)();
    } catch (e) {
      console.warn('Error stopping Howl', e);
    }
  } else if (maybeAudio instanceof HTMLMediaElement) {
    try {
      // Remove handlers to avoid spurious errors
      try { (maybeAudio as HTMLMediaElement).onerror = null; } catch (e) { console.warn('Failed to clear audio onerror handler', e); }
      try { (maybeAudio as HTMLMediaElement).onended = null; } catch (e) { console.warn('Failed to clear audio onended handler', e); }
      (maybeAudio as HTMLMediaElement).pause();
      // Reset source and call load to clear buffer
      try { (maybeAudio as HTMLMediaElement).src = ''; (maybeAudio as HTMLMediaElement).load(); } catch (e) { console.warn('Failed to clear audio src/load', e); }
    } catch (e) {
      console.warn('Error stopping audio element', e);
    }
  }
  setCurrentSound(null);
}

/**
 * Salta a la siguiente canción cuando hay un error de carga
 */
function skipToNextSong() {
  const { currentPlaylist, currentSong, setCurrentSong, setIsPlaying } = useMusicStore.getState();
  const { isShuffled } = useSoundStore.getState();
  
  if (!currentSong || !currentPlaylist.length) {
    setIsPlaying(false);
    return;
  }

  const songIndex = currentPlaylist.findIndex(song => song.id === currentSong.id);
  const nextSong = isShuffled
    ? currentPlaylist[getRandomIndexExcluding(currentPlaylist, songIndex)]
    : currentPlaylist[(songIndex + 1) % currentPlaylist.length];

  if (nextSong) {
    setCurrentSong(nextSong);
    playSound(nextSong.filePath, nextSong.id);
  } else {
    setIsPlaying(false);
  }
}

export function previus() {
  const { currentPlaylist, currentSong, setCurrentSong, setIsPlaying } = useMusicStore.getState();
  stopCurrentSound();
  if (!currentSong) return;

  const songIndex = currentPlaylist.findIndex(song => song.id === currentSong.id);
  const prevSong = songIndex > 0 ? currentPlaylist[songIndex - 1] : currentPlaylist[currentPlaylist.length - 1];
  setCurrentSong(prevSong);
  setIsPlaying(true);
}

export function next() {
  const { currentPlaylist, currentSong, setCurrentSong, setIsPlaying } = useMusicStore.getState();
  stopCurrentSound();
  if (!currentSong) return;

  const songIndex = currentPlaylist.findIndex(song => song.id === currentSong.id);
  const nextSong = (songIndex + 1) % currentPlaylist.length;
  setCurrentSong(currentPlaylist[nextSong]);
  setIsPlaying(true);
}