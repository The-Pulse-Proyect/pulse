import { create } from 'zustand'

interface SoundState {
  currentSound: HTMLMediaElement | null;
  setCurrentSound: (sound: Howl | HTMLMediaElement | null) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isShuffled: boolean;
  toggleShuffle: () => void;
  repeatMode: boolean;
  toggleRepeatMode: () => void;
  spectrumData: number[];
  setSpectrumData: (data: number[]) => void;
}

export const useSoundStore = create<SoundState>()((set, get) => ({
  isShuffled: false,
  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
  repeatMode: false,
  toggleRepeatMode: () => {
    const { currentSound, repeatMode } = get()
    const newRepeatMode = !repeatMode
    if (currentSound) {
      try { currentSound.loop = newRepeatMode; } catch (e) { /* ignore */ }
    }
    set({ repeatMode: newRepeatMode })
  },
  currentSound: null,
  setCurrentSound: (sound) => set({ currentSound: sound as HTMLMediaElement | null }),
  currentTime: 0,
  setCurrentTime: (time: number) => set({ currentTime: time}),
  spectrumData: Array(30).fill(5),
  setSpectrumData: (data: number[]) => set({ spectrumData: data }),
}))