// src/workers/metadataWorker.ts

export default {} as typeof Worker;

self.onmessage = async (event: MessageEvent) => {
  const { fileGroup } = event.data;

  try {
    // Comunicación con el proceso principal a través de postMessage
    const result = await new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (e) => resolve(e.data);
      (self as any).postMessage({ type: 'processMetadata', fileGroup }, [channel.port2]);
    });

    self.postMessage({ success: true, data: result });
  } catch (error: any) {
    self.postMessage({ success: false, error: error.message });
  }
};