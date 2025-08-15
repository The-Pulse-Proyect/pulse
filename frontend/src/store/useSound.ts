import { create } from 'zustand'
import { Howl } from 'howler'

interface SoundState {
  currentSound: Howl | null;
  setCurrentSound: (sound: Howl | null) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isShuffled: boolean;
  setIsShuffled: (isShuffled: boolean) => void;
  repeatMode: boolean;
  setRepeatMode: (repeatMode: boolean) => void;    
  spectrumData: number[];
  setSpectrumData: (data: number[]) => void;
}

export const useSoundStore = create<SoundState>()((set) => ({
  isShuffled: false,
  setIsShuffled: (isShuffled: boolean) => set({ isShuffled }),
  setRepeatMode: (repeatMode: boolean) => set({ repeatMode }),
  repeatMode: false,
  currentSound: null,
  setCurrentSound: (sound) => set({ currentSound: sound }),
  currentTime: 0,
  setCurrentTime: (time: number) => set({ currentTime: time}),
  spectrumData: Array(30).fill(5),
  setSpectrumData: (data: number[]) => set({ spectrumData: data }),
}))
