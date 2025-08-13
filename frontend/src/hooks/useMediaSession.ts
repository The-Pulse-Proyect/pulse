
export function MediaSession({ title, artist, album, artwork, onPlay, onPause, onNext, onPrev}){
        if ('mediaSession' in navigator) {
            console.log("OK")
            navigator.mediaSession.metadata = new window.MediaMetadata({
                title,
                artist,
                album,
                artwork: artwork || []
            })

            navigator.mediaSession.setActionHandler('play', onPlay)
            navigator.mediaSession.setActionHandler('pause', onPause)
            navigator.mediaSession.setActionHandler('nexttrack', onNext)
            navigator.mediaSession.setActionHandler('previoustrack', onPrev)
        }
}