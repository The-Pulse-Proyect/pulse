import { cn } from '@/lib/utils';
import type { Song } from '@/store/useMusic';
import { PlayCircle } from 'lucide-react';

interface PlaylistItemProps {
  name: string;
  songs: Song[];
  isActive: boolean;
  onClick: () => void;
}

export function PlaylistItem({ name, songs, isActive, onClick }: PlaylistItemProps) {
  // Función para obtener las primeras 3 portadas o placeholders
  const getCoverArt = (index: number) => {
    const song = songs[index];
    if (!song) {
      return (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <PlayCircle className="w-4 h-4 text-gray-600" />
        </div>
      );
    }
    return song.coverUrl ? (
      <img 
        src={song.coverUrl} 
        alt={`${song.title} cover`}
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
        <PlayCircle className="w-4 h-4 text-gray-600" />
      </div>
    );
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
        "text-sm font-medium text-left",
        "transition-all duration-200",
        "hover:bg-orange-500/10",
        isActive ? "bg-orange-500/20 text-orange-400" : "text-gray-400 hover:text-orange-400"
      )}
    >
      {/* Stack de portadas */}
      <div className="relative w-16 h-12 flex-shrink-0">
        {/* Tercera portada (fondo) */}
        <div className="absolute top-0 left-0 w-10 h-10 rounded-lg overflow-hidden transform translate-x-4 translate-y-2 shadow-md">
          {getCoverArt(2)}
        </div>
        {/* Segunda portada (medio) */}
        <div className="absolute top-0 left-0 w-10 h-10 rounded-lg overflow-hidden transform translate-x-2 translate-y-1 shadow-md">
          {getCoverArt(1)}
        </div>
        {/* Primera portada (frente) */}
        <div className="absolute top-0 left-0 w-10 h-10 rounded-lg overflow-hidden shadow-md">
          {getCoverArt(0)}
        </div>
      </div>

      <div className="flex-1 truncate">
        <span className="block truncate">{name}</span>
        <span className="text-xs text-gray-500">{songs.length} canciones</span>
      </div>
    </button>
  );
}
