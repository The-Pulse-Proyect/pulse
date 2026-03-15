import { useMusicStore } from "@/store/useMusic";
import { useSoundStore } from "@/store/useSound";
import { useEffect, useState } from "react";

export type AudioNodes = {
  ctx: AudioContext;
  analyser: AnalyserNode;
  audioSource: MediaElementAudioSourceNode;
  frequencyData: Uint8Array;
};

let audioNodes: AudioNodes | null = null;
let sharedAudioContext: AudioContext | null = null;

function getOrCreateSource(ctx: AudioContext, el: HTMLMediaElement) {
  const anyEl = el as HTMLMediaElement & { _mediaSourceNode?: MediaElementAudioSourceNode };
  if (!anyEl._mediaSourceNode) {
    anyEl._mediaSourceNode = ctx.createMediaElementSource(el);
  }
  return anyEl._mediaSourceNode as MediaElementAudioSourceNode;
}

// We no longer use Howl/Howler; only support HTMLMediaElement as sound source.

export function useCava(): AudioNodes | null {
  const [nodes, setNodes] = useState<AudioNodes | null>(null);
  const { currentSound } = useSoundStore.getState();
  const { isPlaying } = useMusicStore.getState();

  useEffect(() => {
    if (!isPlaying || !currentSound) {
      cleanupAudioNodes();
      setNodes(null);
      return;
    }

    try {
      let ctx: AudioContext;
      let audioElement: HTMLMediaElement | undefined;
      let audioSource: MediaElementAudioSourceNode;

      // Determine type of currentSound: Howl or HTMLMediaElement
      if (currentSound instanceof HTMLMediaElement) {
        // Native audio element
        // Reuse a shared audio context to avoid creating multiple contexts
        if (!sharedAudioContext) {
                interface WindowWithLegacyAudio extends Window {
                  webkitAudioContext?: typeof AudioContext;
                }
                const win = window as WindowWithLegacyAudio;
                const AudioCtor: { new(): AudioContext } | undefined = (typeof AudioContext !== 'undefined') ? (AudioContext as unknown as { new(): AudioContext }) : win.webkitAudioContext as { new(): AudioContext } | undefined;
                if (!AudioCtor) throw new Error('No AudioContext available');
                sharedAudioContext = new AudioCtor();
              }
            ctx = sharedAudioContext as AudioContext;
        audioElement = currentSound as HTMLMediaElement;
        audioSource = getOrCreateSource(ctx, audioElement);
      } else {
        throw new Error('Unsupported audio source for spectrum analysis');
      }

      // Create an analyser and configure it
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.4;

      // Ensure previous connections are cleared — safe guards
      try { audioSource.disconnect(); } catch (e) { console.warn('audioSource.disconnect failed', e); }
      try { analyser.disconnect(); } catch (e) { console.warn('analyser.disconnect failed', e); }

      audioSource.connect(analyser);
      // If we're not using Howler's own destination, connect to context destination
        analyser.connect(ctx.destination);

      // Obtain the initial frequency data
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(frequencyData);

      const newNodes: AudioNodes = {
        ctx,
        analyser,
        audioSource,
        frequencyData,
      };

      audioNodes = newNodes;
      setNodes(newNodes);
    } catch (error) {
      console.error("Error al inicializar el análisis de audio:", error);
      setNodes(null);
    }

    return () => {
      cleanupAudioNodes();
    };
  }, [currentSound, isPlaying]);

  return nodes;
}

export function cleanupAudioNodes() {
  if (audioNodes?.analyser) {
    audioNodes.analyser.disconnect();
  }
  if (audioNodes?.audioSource) {
    try { audioNodes.audioSource.disconnect(); } catch (e) { console.warn('audioNodes.audioSource.disconnect failed', e); }
  }
  audioNodes = null;
}