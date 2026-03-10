import { create } from 'zustand'
import { Howl } from 'howler'

interface SoundState {
  currentSound: Howl | null;
  setCurrentSound: (sound: Howl | null) => void;
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
      currentSound.loop(newRepeatMode)
    }
    set({ repeatMode: newRepeatMode })
  },
  currentSound: null,
  setCurrentSound: (sound) => set({ currentSound: sound }),
  currentTime: 0,
  setCurrentTime: (time: number) => set({ currentTime: time}),
  spectrumData: Array(30).fill(5),
  setSpectrumData: (data: number[]) => set({ spectrumData: data }),
}))
