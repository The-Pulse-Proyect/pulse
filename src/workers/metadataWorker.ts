// Web Worker para procesar metadatos en paralelo sin bloquear el hilo principal

self.onmessage = async (event: MessageEvent) => {
  const { filePaths } = event.data;
  
  try {
    // Llamar a IPC desde el worker (disponible via tauriAPI)
    const songMetadata = await (window as any).tauriAPI.processMetadata(filePaths);
    
    self.postMessage({
      success: true,
      data: songMetadata,
    });
  } catch (error) {
    self.postMessage({
      success: false,
      error: (error as Error).message,
    });
  }
};