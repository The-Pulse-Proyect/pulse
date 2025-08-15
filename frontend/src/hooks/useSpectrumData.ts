// hooks/useCavaSpectrum.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSoundStore } from '@/store/useSound';
import { useMusicStore } from '@/store/useMusic';
import { getAudioGraph } from './audioGraph';

// Función mejorada para crear bandas de frecuencia más musicales
function createFrequencyBands(
  count: number,
  sampleRate: number,
  binCount: number,
  minHz = 20,  // Bajado a 20Hz para más graves
  maxHz = 20000 // Subido a 20kHz para más detalle en agudos
): Array<[number, number]> {
  const nyquist = sampleRate / 2;
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
  
  // Conversión mejorada de Hz a bins para mayor precisión
  const hzToBin = (hz: number) =>
    Math.round(clamp((hz / nyquist) * (binCount - 1), 0, binCount - 1));

  // Usar escala Mel para mejor distribución de frecuencias
  const melMin = 1127 * Math.log(1 + minHz / 700);
  const melMax = 1127 * Math.log(1 + maxHz / 700);
  
  const edges: number[] = [];
  for (let i = 0; i <= count; i++) {
    const p = i / count;
    const mel = melMin + p * (melMax - melMin);
    const hz = 700 * (Math.exp(mel / 1127) - 1);
    edges.push(hzToBin(hz));
  }

  // Asegurar distribución uniforme y sin gaps
  edges.sort((a, b) => a - b);
  for (let i = 1; i < edges.length; i++) {
    if (edges[i] <= edges[i - 1]) {
      edges[i] = edges[i - 1] + 1;
    }
  }

  // Crear rangos con solapamiento para transiciones más suaves
  const ranges: Array<[number, number]> = [];
  for (let i = 0; i < count; i++) {
    let start = edges[i];
    let end = edges[i + 1];
    
    // Añadir solapamiento del 20% para suavizar
    const overlap = Math.floor((end - start) * 0.2);
    if (i > 0) start -= overlap;
    if (i < count - 1) end += overlap;
    
    ranges.push([
      clamp(start, 0, binCount - 1),
      clamp(end, 0, binCount - 1)
    ]);
  }
  
  return ranges;
}

export function useCavaSpectrum(barCount: number) {
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const [bars, setBars] = useState<number[]>(() => Array(barCount).fill(0));
  const prevRef = useRef<number[]>(Array(barCount).fill(0));
  const rafRef = useRef<number | null>(null);

  // Reajustar buffers cuando cambia el número de barras
  useEffect(() => {
    prevRef.current = Array(barCount).fill(0);
    setBars(Array(barCount).fill(0));
  }, [barCount]);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const run = async () => {
      const { analyser, data, ctx } = await getAudioGraph();
      const ranges = createFrequencyBands(barCount, ctx.sampleRate, analyser.frequencyBinCount);

      const ATTACK = 0.4;
      const RELEASE = 0.15;
      const MIN_HEIGHT = 2; // Altura mínima en porcentaje
      const MAX_BOOST = 1.2;

      const tick = () => {
        if (!isPlaying) {
          // Decaimiento suave a cero
          const next = prevRef.current.map(v => Math.max(0, v - RELEASE * v * 0.5));
          prevRef.current = next;
          setBars(next);
          if (next.some(v => v > 0.1)) {
            rafRef.current = requestAnimationFrame(tick);
          }
          return;
        }

        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        analyser.getByteFrequencyData(data);

        const next = ranges.map(([start, end], i) => {
          let sum = 0, peak = 0, count = 0;
          for (let bin = start; bin <= end; bin++) {
            const value = data[bin] || 0;
            sum += value;
            count++;
            peak = Math.max(peak, value);
          }
          const avg = count > 0 ? sum / count : 0;
          const freqBoost = 1 + (MAX_BOOST - 1) * (i / ranges.length);
          const mix = (0.4 * peak + 0.6 * avg) * freqBoost;
          
          // Escalar a un valor entre 0 y 100, con un mínimo visible
          const target = Math.max(MIN_HEIGHT, (mix / 255) * 100);

          const prev = prevRef.current[i] || 0;
          const alpha = target > prev ? ATTACK : RELEASE;
          return prev + alpha * (target - prev);
        });

        prevRef.current = next;
        setBars(next);
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    run();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, barCount]);

  return bars;
}
