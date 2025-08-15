// hooks/audioGraph.ts

type Entry = {
  source: MediaElementAudioSourceNode;
  monitor: GainNode;
  connected: boolean;
};

type Graph = {
  ctx: AudioContext;
  analyser: AnalyserNode;
  data: Uint8Array;
  entries: WeakMap<HTMLMediaElement, Entry>;
};

const Ctx: AudioContext =
  (globalThis as any).__CAVA_CTX__ ||
  new (window.AudioContext || (window as any).webkitAudioContext)();

(globalThis as any).__CAVA_CTX__ = Ctx;

// Analyser único (suficiente si sólo hay una reproducción a la vez)
const analyser = Ctx.createAnalyser();
analyser.fftSize = 1024;               // alta resolución, latencia baja
analyser.smoothingTimeConstant = 0.06; // fluido pero reactivo

const data = new Uint8Array(analyser.frequencyBinCount);

// Para no reconectar el mismo <audio> varias veces
const entries = new WeakMap<HTMLMediaElement, Entry>();

const graph: Graph = { ctx: Ctx, analyser, data, entries };

// Conecta el <audio> tanto al analyser como a la salida audible.
// OJO: al usar createMediaElementSource, el audio YA NO sale directo; hay que conectarlo a destination.
export async function getAnalyserFor(element: HTMLMediaElement) {
  if (graph.ctx.state === 'suspended') {
    try { await graph.ctx.resume(); } catch {}
  }

  let entry = entries.get(element);

  if (!entry) {
    const source = graph.ctx.createMediaElementSource(element);

    // Ruta audible (monitor)
    const monitor = graph.ctx.createGain();
    monitor.gain.value = 1;

    // Conexiones
    source.connect(graph.analyser);   // análisis
    source.connect(monitor);          // audio audible
    monitor.connect(graph.ctx.destination);

    entry = { source, monitor, connected: true };
    entries.set(element, entry);
  } else if (!entry.connected) {
    try {
      entry.source.connect(graph.analyser);
      entry.source.connect(entry.monitor);
      entry.monitor.connect(graph.ctx.destination);
      entry.connected = true;
    } catch {}
  }

  return graph;
}
