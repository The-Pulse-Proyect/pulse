import { useState } from 'react';
import { ChevronRight, ListMusic, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMusicStore } from '@/store/useMusic';
import { PlaylistItem } from './playlist-item';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const { playlists, createPlaylist, loadPlaylist, removePlaylist } = useMusicStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);

  const handleCreatePlaylist = () => {
    setShowDialog(true);
  };

  const handleDialogSave = () => {
    if (playlistName.trim()) {
      createPlaylist(playlistName.trim());
      setPlaylistName("");
      setShowDialog(false);
    }
  };

  const handleSelectPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    loadPlaylist(playlistId);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylistToDelete(playlistId);
    setShowDeleteDialog(true);
  };

  const confirmDeletePlaylist = () => {
    if (playlistToDelete) {
      removePlaylist(playlistToDelete);
      setShowDeleteDialog(false);
      setPlaylistToDelete(null);
      // Si la eliminada era la seleccionada, limpiar selección
      if (selectedPlaylistId === playlistToDelete) setSelectedPlaylistId(null);
    }
  };

  return (
    <div
      className={cn(
        "flex relative",
        "bg-gray-900/95 border-r border-gray-800",
        "transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-8"
      )}
    >
      {/* Botón de expandir */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "absolute -right-3 top-8",
          "w-6 h-6 bg-orange-500/90 text-slate-900",
          "flex items-center justify-center",
          "hover:bg-orange-400 transition-all",
          "border border-orange-400/20",
          "rounded-full shadow-lg shadow-orange-500/20",
          "hover:scale-105 hover:-translate-x-0.5 active:scale-95",
          "backdrop-blur-sm"
        )}
      >
        <ChevronRight
          className={cn(
            "w-4 h-4 transition-transform duration-300",
            isExpanded ? "rotate-180" : "",
            "stroke-[3]"
          )}
        />
      </button>

      {/* Contenido del sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Encabezado */}
        <div
          className={cn(
            "flex items-center gap-3 p-4 border-b border-gray-800/50",
            "transition-all duration-300"
          )}
        >
          <ListMusic className="w-5 h-5 text-orange-500" />
          <span
            className={cn(
              "text-sm font-semibold text-orange-500 whitespace-nowrap",
              "transition-all duration-300",
              isExpanded ? "opacity-100" : "opacity-0"
            )}
          >
            Playlists
          </span>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col gap-1 p-2">
          {isExpanded && (
            <>
              {/* Playlists del sistema primero */}
              {playlists
                .filter(p => p.isSystem)
                .map((playlist) => (
                  <PlaylistItem
                    key={playlist.id}
                    name={playlist.name}
                    songs={playlist.songs}
                    isActive={selectedPlaylistId === playlist.id}
                    onClick={() => handleSelectPlaylist(playlist.id)}
                  />
                ))}
              
              {/* Separador si hay playlists personalizadas */}
              {playlists.some(p => !p.isSystem) && (
                <div className="h-px bg-gray-800 my-2" />
              )}

              {/* Playlists personalizadas */}
              {playlists
                .filter(p => !p.isSystem)
                .map((playlist) => (
                  <div className="relative group" key={playlist.id}>
                    <PlaylistItem
                      name={playlist.name}
                      songs={playlist.songs}
                      isActive={selectedPlaylistId === playlist.id}
                      onClick={() => handleSelectPlaylist(playlist.id)}
                    />
                    <button
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1 shadow-lg"
                      onClick={e => {e.stopPropagation(); handleDeletePlaylist(playlist.id);}}
                      title="Eliminar playlist"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6m-6 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                ))}
              
              <Button
                onClick={handleCreatePlaylist}
                variant="ghost"
                className="w-full justify-start gap-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
              >
                <PlusCircle className="w-4 h-4" />
                Nueva Playlist
              </Button>
            </>
          )}
        </div>
      </div>
      {/* Dialog para crear playlist */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
          <div className="bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-xs flex flex-col gap-4 border border-orange-500 animate-scale-in">
            <h2 className="text-lg font-bold text-orange-400 mb-2 animate-slide-down">Nueva Playlist</h2>
            <input
              type="text"
              value={playlistName}
              onChange={e => setPlaylistName(e.target.value)}
              placeholder="Nombre de la playlist"
              className="px-3 py-2 rounded bg-gray-800 text-white border border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200 animate-fade-in"
              autoFocus
            />
            <div className="flex gap-2 justify-end mt-2">
              <Button variant="ghost" onClick={() => setShowDialog(false)} className="transition-all duration-200 hover:bg-orange-500/10">
                Cancelar
              </Button>
              <Button variant="default" onClick={handleDialogSave} className="bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold shadow-lg hover:scale-105 active:scale-95 transition-all duration-200">
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Dialog para eliminar playlist */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
          <div className="bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-xs flex flex-col gap-4 border border-red-500 animate-scale-in">
            <h2 className="text-lg font-bold text-red-400 mb-2 animate-slide-down">¿Eliminar Playlist?</h2>
            <div className="text-gray-300">Esta acción no se puede deshacer.</div>
            <div className="flex gap-2 justify-end mt-2">
              <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} className="transition-all duration-200 hover:bg-red-500/10">
                Cancelar
              </Button>
              <Button variant="default" onClick={confirmDeletePlaylist} className="bg-gradient-to-r from-red-500 to-orange-400 text-white font-semibold shadow-lg hover:scale-105 active:scale-95 transition-all duration-200">
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
