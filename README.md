# Pulse Music Player

🎵 Reproductor de música moderno construido con Tauri

## Características

- 🎨 Interfaz moderna con tema oscuro
- 🪄 Modo mini ventana (siempre al frente)
- 📊 Visualizador de espectro en tiempo real
- 🖼️ Extracción de portadas de álbumes
- 🎵 Soporte para múltiples formatos (MP3, WAV, FLAC, OGG, M4A)
- 📱 Diseño responsive
- 🎮 Controles de reproducción completos
- ❤️ Sistema de favoritos
- 📋 Gestión de playlists
- 🔄 Modo aleatorio y repetición

## Tecnologías

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Tauri (Rust)
- **Audio**: Howler.js + Symphonia
- **Estado**: Zustand

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/The-Pulse-Proyect/pulse.git
cd pulse

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run tauri dev

# Construir para producción
npm run tauri build