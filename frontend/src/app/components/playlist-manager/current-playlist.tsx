interface Song {
  id: string
  title: string
  artist: string
  duration: string
  isPlaying?: boolean
  coverUrl?: string
}

import { Music } from 'lucide-react'

export function CurrentPlaylist() {
  const mockSongs: Song[] = [
    { 
      id: '1', 
      title: 'Bohemian Rhapsody', 
      artist: 'Queen', 
      duration: '5:55',
      coverUrl: 'https://upload.wikimedia.org/wikipedia/en/4/4d/Queen_A_Night_at_the_Opera.png'
    },
    { 
      id: '2', 
      title: 'Stairway to Heaven', 
      artist: 'Led Zeppelin', 
      duration: '8:02',
      coverUrl: 'https://upload.wikimedia.org/wikipedia/en/2/26/Led_Zeppelin_-_Led_Zeppelin_IV.jpg'
    },
    { 
      id: '3', 
      title: 'Hotel California', 
      artist: 'Eagles', 
      duration: '6:30', 
      isPlaying: true,
      coverUrl: 'https://upload.wikimedia.org/wikipedia/en/4/49/Hotelcalifornia.jpg'
    },
    { 
      id: '4', 
      title: 'Sweet Child O\' Mine', 
      artist: 'Guns N\' Roses', 
      duration: '5:56' 
    },
    { 
      id: '5', 
      title: 'Smells Like Teen Spirit', 
      artist: 'Nirvana', 
      duration: '5:01',
      coverUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b7/NirvanaNevermindalbumcover.jpg'
    },
  ]

  return (
    <div className="bg-gray-900/95 backdrop-blur-md border-t border-gray-800">
      <div className="max-w-7xl mx-auto p-4">
        <h3 className="text-orange-400/80 text-sm font-medium mb-4">Cola actual</h3>
        <div className="space-y-2 h-[168px] overflow-y-auto custom-scrollbar pr-2">
          {mockSongs.map((song) => (
            <div 
              key={song.id}
              className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors
                ${song.isPlaying ? 'bg-orange-500/10 border border-orange-500/20' : ''}`}
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

              {/* Duration */}
              <div className="text-sm text-gray-500 flex-shrink-0">
                {song.duration}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
