import { useEffect, useRef } from 'react';
import './cava-visualizer.css';
import { useCava } from '@/hooks/useSpectrumData';
import { useMusicStore } from '@/store/useMusic';
import type { AudioNodes } from '@/hooks/useSpectrumData';

export function CavaVisualizer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { isPlaying } = useMusicStore();
  const audioNodes = useCava() as AudioNodes | null;
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isPlaying || !audioNodes?.analyser) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const updateBars = () => {
      if (!audioNodes?.analyser || !containerRef.current) return;

      audioNodes.analyser.getByteFrequencyData(audioNodes.frequencyData);
      const bars = containerRef.current.children;
      
      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i] as HTMLElement;
        const value = audioNodes.frequencyData[i];
        const height = (value / 255) * 80; // 80px es el máximo
        bar.style.height = `${height}px`;
      }

      animationFrameRef.current = requestAnimationFrame(updateBars);
    };

    updateBars();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, audioNodes]);

  if (!isPlaying || !audioNodes?.frequencyData) {
    return null;
  }

  // Crear 64 barras
  const bars = Array.from({ length: 64 }, (_, idx) => (
    <div key={idx} className="bar"></div>
  ));

  return (
    <div ref={containerRef} className="cava-container">
      {bars}
    </div>
  );
}
