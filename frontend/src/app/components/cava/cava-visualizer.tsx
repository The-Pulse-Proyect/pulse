// components/CavaVisualizer.tsx
import { useRef } from 'react';
import { useResponsiveBars } from '@/hooks/useResponsiveBars';
import { useCavaSpectrum } from '@/hooks/useSpectrumData';
import { useMusicStore } from '@/store/useMusic';
import './cava-visualizer.css';

export function CavaVisualizer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isPlaying = useMusicStore((s) => s.isPlaying);

  const numberOfBars = useResponsiveBars(containerRef, {
    min: 16,
    max: 48,
    targetBarWidth: 12,
    gap: 4,
    debounceMs: 50,
  });

  const spectrum = useCavaSpectrum(numberOfBars);

  return (
    <div ref={containerRef} className="cava-container">
      {spectrum.map((h, i) => (
        <div
          key={i}
          className="spectrum-bar"
          style={{
            height: `${h}%`,
            // Animación de entrada escalonada
            animationDelay: `${i * 10}ms`,
          }}
        />
      ))}
    </div>
  );
}
