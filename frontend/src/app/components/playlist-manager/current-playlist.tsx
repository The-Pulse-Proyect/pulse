
import { Music, Trash2, MoreVertical, Heart } from 'lucide-react';
import { useMusicStore, type Song } from '@/store/useMusic';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { FAVORITES_PLAYLIST_ID } from '@/store/useMusic';



export function CurrentPlaylist() {
  const { currentId ,currentPlaylist,  selectedSong, toggleSongPlay, setSelectedSong, removeSongFromPlaylist, addSongsToPlaylist, toggleLike, playlists } = useMusicStore();
  // Buscar el nombre de la playlist actual




  const currentPlaylistName = playlists.find(p => p.songs === currentPlaylist)?.name || "Playlist";
  // Estado para mostrar el diálogo de añadir canciones


  const handleOpenFile = async () => {
    try {
      const filePaths = await window.electronAPI.openFile();
      
      if (filePaths && Array.isArray(filePaths) && filePaths.length > 0) {
        const songMetadata = await window.electronAPI.processMetadata(filePaths);
        if (songMetadata && Array.isArray(songMetadata)) {
          addSongsToPlaylist(songMetadata, currentId);
        }
      }
    } catch (error) {
      console.error('Error al cargar archivos:', error);
    }
  }
  const handleSongClick = (song: Song) => {
    setSelectedSong(song.id === selectedSong?.id ? undefined : song);
  };

  if (currentPlaylist.length === 0) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-md border-t border-gray-800">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
        {currentId !== FAVORITES_PLAYLIST_ID &&
          <Button
            variant="default"
            size="sm"
            onClick={handleOpenFile}
            className="bg-orange-500 text-white"
          >
            Añadir canciones
          </Button>}
          </div>
          <div className="flex items-center justify-center h-[168px] text-gray-500">
            No hay canciones en la cola
          </div>
        </div>
        {/* Dialogo para añadir canciones (placeholder visual) */}
      
      </div>
    );
  }

  return (
    <div className="bg-gray-900/95 backdrop-blur-md border-t border-gray-800">
      <div className="mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-orange-400/80 text-sm font-medium">{currentPlaylistName}</h3> 
        {currentId !== FAVORITES_PLAYLIST_ID &&
          <Button
            variant="default"
            size="sm"
            onClick={handleOpenFile}
            className="bg-orange-500 text-white"
          >
            Añadir canciones
          </Button>}
        </div>
        <div className="space-y-2 h-[168px] overflow-y-auto custom-scrollbar pr-2">
          {currentPlaylist.map((song) => (
            <div 
              key={song.id}
              onClick={() => handleSongClick(song)}
              onDoubleClick={() => toggleSongPlay(song.id)}
              className={`group flex items-center gap-3 p-2 rounded-lg hover:bg-orange-500/5 transition-colors cursor-pointer
                ${song.isPlaying ? 'bg-orange-500/10 border border-orange-500/20' : ''}
                ${selectedSong?.id === song.id ? 'bg-orange-500/10 border border-orange-500/20' : ''}`}
            >
              {/* Cover/Placeholder */}
              <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-gray-800">
                {song.coverUrl ? (
                  <img 
                    src={song.coverUrl} 
                    alt={`${song.title} cover`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Music className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Song Info */}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${song.isPlaying ? 'text-orange-400' : 'text-gray-300'}`}>
                  {song.title}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {song.artist}
                </div>
              </div>

              {/* Duration and Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(song.id);
                  }}
                  className={`px-2 hover:bg-orange-500/10 ${song.isLiked ? 'text-orange-400' : 'text-gray-500 hover:text-orange-400'}`}
                >
                  <Heart className={`h-4 w-4 ${song.isLiked ? 'fill-current' : ''}`} />
                </Button>

                <div className="text-sm text-gray-500">
                  {song.duration}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-orange-500/10"
                    >
                      <MoreVertical className="h-4 w-4 text-orange-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 bg-gray-900/95 border border-orange-500/20">
                    {/* <DropdownMenuItem 
                      onClick={() => console.log('Editar', song.id)} 
                      className="gap-2 focus:bg-orange-500/10 focus:text-orange-400"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </DropdownMenuItem> */}
                    <DropdownMenuItem 
                      onClick={() => removeSongFromPlaylist(song.id)}
                      className="gap-2 text-red-400 focus:text-red-400 focus:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Eliminar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
 
      </div>
    </div>
  )
}
