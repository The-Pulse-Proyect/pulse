export interface Song {
  title: string;
  artist: string;
  album: string;
  duration: string;     // Duración formateada (MM:SS)
  durationRaw: number;  // Duración en segundos
  coverUrl?: string;
  filePath: string;
}
