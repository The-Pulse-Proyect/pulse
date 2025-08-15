// hooks/useResponsiveBars.ts
import { useEffect, useRef, useState } from 'react';

interface Options {
  min?: number;
  max?: number;
  targetBarWidth?: number;
  gap?: number;
  debounceMs?: number;
}

export function useResponsiveBars(
  containerRef: React.RefObject<HTMLElement>,
  opts: Options = {}
) {
  const {
    min = 12,
    max = 30,
    targetBarWidth = 10,
    gap = 3,
    debounceMs = 60,
  } = opts;
  const [bars, setBars] = useState(max);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = () => {
      const width = el.clientWidth || window.innerWidth;
      const per = targetBarWidth + gap;
      let next = Math.max(min, Math.min(max, Math.round(width / per)));
      if (next % 2 !== 0) next += next < bars ? -1 : 1;
      if (Math.abs(next - bars) >= 1) setBars(next);
    };

    const ro = new ResizeObserver(() => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(compute);
      }, debounceMs);
    });

    ro.observe(el);
    compute();

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [containerRef, min, max, targetBarWidth, gap, debounceMs, bars]);

  return bars;
}
