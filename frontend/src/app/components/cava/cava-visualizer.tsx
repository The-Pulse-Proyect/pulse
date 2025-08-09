import { useEffect, useState, useCallback, useRef } from 'react'
import './cava-visualizer.css'

interface CavaVisualizerProps {
  isPlaying?: boolean;
}

export function CavaVisualizer({ isPlaying = false }: CavaVisualizerProps) {
  const [numberOfBars, setNumberOfBars] = useState(30);

  const updateBarsCount = useCallback(() => {
    const width = window.innerWidth;
    if (width < 640) { // móvil
      setNumberOfBars(12);
    } else if (width < 1024) { // tablet
      setNumberOfBars(16);
    } else { // desktop
      setNumberOfBars(30);
    }
  }, []);

  useEffect(() => {
    updateBarsCount();
    window.addEventListener('resize', updateBarsCount);
    return () => window.removeEventListener('resize', updateBarsCount);
  }, [updateBarsCount]);

  const [spectrumData, setSpectrumData] = useState(() => 
    Array.from({ length: numberOfBars }, () => Math.random() * 100)
  );

  // Modo de prueba: siempre activo
  useEffect(() => {
    if (!isPlaying) {
      setSpectrumData(prev => prev.map(() => 5));
      return;
    }

    let prevValues = spectrumData;
    const momentum = Array(numberOfBars).fill(0);
    
    const interval = setInterval(() => {
      setSpectrumData(prev => {
        const targetValues = prev.map((_, index) => {
          const time = Date.now() / 1000;
          
          // Múltiples ondas para una simulación más rica
          const bass = Math.sin(time * 1.5 + index * 0.2) * 0.7 + 0.7;
          const mid = Math.sin(time * 3 + index * 0.3) * 0.5 + 0.5;
          const high = Math.sin(time * 6 + index * 0.4) * 0.3 + 0.3;
          
          // Ruido controlado
          const noise = (Math.random() - 0.5) * 6;
          
          // Amplitud que favorece frecuencias bajas
          const baseAmplitude = 85 - (index / (numberOfBars - 1)) * 30;
          
          // Patrones de énfasis cada 4 barras
          const emphasis = index % 4 === 0 ? 1.2 : 1;
          
          return Math.max(5, Math.min(100, 
            ((bass + mid + high) * baseAmplitude + noise) * emphasis
          ));
        });

        // Aplicar inercia al movimiento
        const newValues = targetValues.map((target, i) => {
          const diff = target - prevValues[i];
          momentum[i] = momentum[i] * 0.8 + diff * 0.2;
          return prevValues[i] + momentum[i];
        });

        prevValues = newValues;
        return newValues;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, numberOfBars]);

  return (
    <div className="cava-container">
      {spectrumData.map((height, index) => (
        <div
          key={index}
          className="spectrum-bar"
          style={{
            height: `${height}%`,
            animationDelay: `${index * 0.02}s`
          }}
        />
      ))}
    </div>
  );
}
