import type { Song } from '@/types/tauri'

type Props = {
  open: boolean
  onClose: () => void
  message?: string
  themeId?: string
  song?: Partial<Song> | null
}

export default function ErrorDialog({ open, onClose, message, themeId, song }: Props) {
  if (!open) return null

  const defaultMsg = themeId
    ? `El tema "${themeId}" no se ha encontrado.`
    : song && song.title
      ? `Error al cargar "${song.title}"${song.artist ? ` — ${song.artist}` : ''}`
      : 'Ha ocurrido un error.'

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
      <div className="w-[460px] bg-slate-800 rounded-lg shadow-lg p-5">
        <div className="flex items-start justify-between">
          <h4 className="text-white font-semibold">Error</h4>
          <button onClick={onClose} className="text-accent">✕</button>
        </div>

        <div className="mt-3 flex gap-3 items-center">
          {song?.coverUrl ? (
            <img src={song.coverUrl} alt={song.title ?? 'cover'} className="w-16 h-16 object-cover rounded" />
          ) : (
            <div className="w-16 h-16 bg-white/10 rounded flex items-center justify-center text-white/50">—</div>
          )}

          <div className="text-sm text-white/90">
            <div className="font-medium">{message ?? defaultMsg}</div>
            {song?.title && <div className="text-xs text-white/70 mt-1">{song.title}{song.artist ? ` — ${song.artist}` : ''}</div>}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 rounded text-white" style={{ backgroundColor: 'var(--color-accent)' }}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}