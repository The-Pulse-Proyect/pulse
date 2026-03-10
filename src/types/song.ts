export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;      // Duración formateada (MM:SS)
  duration_raw: number;   // Duración en segundos
  cover_url?: string;
  file_path: string;
  isPlaying?: boolean;
  isLiked?: boolean;
}