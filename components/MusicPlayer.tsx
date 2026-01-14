'use client';

interface MusicPlayerProps {
  spotifyTrackId?: string | null;
  title: string;
  artistName: string;
}

export function MusicPlayer({ spotifyTrackId, title, artistName }: MusicPlayerProps) {
  if (!spotifyTrackId) {
    return (
      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-8 text-center">
        <div className="text-4xl mb-3">🎵</div>
        <p className="text-sm text-gray-700 font-medium mb-2">
          Music preview not available
        </p>
        <p className="text-xs text-gray-600">
          Search for &quot;{title} by {artistName}&quot; on Spotify or Apple Music
        </p>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-lg overflow-hidden">
      <iframe
        style={{ borderRadius: '12px' }}
        src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator`}
        width="100%"
        height="152"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="w-full"
      ></iframe>
    </div>
  );
}
