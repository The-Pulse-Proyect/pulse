interface MediaSessionProps {
  title: string;
  artist: string;
  album: string;
  artwork?: MediaImage[];
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export function useMediaSession({ title, artist, album, artwork, onPlay, onPause, onNext, onPrev }: MediaSessionProps) {
  if ('mediaSession' in navigator) {
    console.log("OK")
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album,
      artwork: artwork || []
    })

    if (onPlay) navigator.mediaSession.setActionHandler('play', onPlay)
    if (onPause) navigator.mediaSession.setActionHandler('pause', onPause)
    if (onNext) navigator.mediaSession.setActionHandler('nexttrack', onNext)
    if (onPrev) navigator.mediaSession.setActionHandler('previoustrack', onPrev)
  }
}