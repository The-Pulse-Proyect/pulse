import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Inicializar listeners de Tauri
import { setupTauriListeners, tauriAPI } from './tauri-bridge';

// Asignar globalmente antes de cualquier otra cosa
if (typeof window !== 'undefined') {
  window.tauriAPI = tauriAPI;
}

// Inicializar listeners
setupTauriListeners();

// Verificar que está asignado (para depuración)
console.log('tauriAPI asignado:', window.tauriAPI);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)