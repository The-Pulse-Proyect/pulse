/// <reference types="vite/client" />

// Referencia a los tipos de Tauri
/// <reference types="./types/tauri.d.ts" />

// Para que Vite reconozca los imports de Tauri
declare module '@tauri-apps/api/*' {
  const content: any;
  export default content;
}