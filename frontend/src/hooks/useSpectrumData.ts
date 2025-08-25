import { useMusicStore } from "@/store/useMusic";
import { useSoundStore } from "@/store/useSound";
import { Howler } from "howler";
import { useEffect, useState } from "react";

export type AudioNodes = {
  ctx: AudioContext;
  analyser: AnalyserNode;
  audioSource: MediaElementAudioSourceNode;
  frequencyData: Uint8Array;
};

let audioNodes: AudioNodes | null = null;

function getOrCreateSource(ctx: AudioContext, el: HTMLMediaElement) {
  const anyEl = el as any;
  if (!anyEl._mediaSourceNode) {
    anyEl._mediaSourceNode = ctx.createMediaElementSource(el);
  }
  return anyEl._mediaSourceNode as MediaElementAudioSourceNode;
}

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
      const ctx = Howler.ctx as AudioContext;
      const audioElement = currentSound._sounds[0]._node as HTMLMediaElement;

      // Siempre obtenemos/reusamos el source
      const audioSource = getOrCreateSource(ctx, audioElement);

      // Creamos un nuevo analyser y conectamos todo de nuevo
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.4;

      // Limpieza de conexiones previas
      audioSource.disconnect();
      analyser.disconnect();

      // Conectar source -> analyser -> destino
      audioSource.connect(analyser);
      analyser.connect(ctx.destination);

      // Obtener frecuencia inicial
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
  audioNodes = null;
}
