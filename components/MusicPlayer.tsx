'use client';

interface MusicPlayerProps {
  youtubeId?: string | null;
  title: string;
  artistName: string;
}

export function MusicPlayer({ youtubeId, title, artistName }: MusicPlayerProps) {
  if (!youtubeId) {
    return (
      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-8 text-center">
        <div className="text-gray-600 mb-2">🎵</div>
        <p className="text-sm text-gray-600">
          Music preview not available for this song
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Search for &quot;{title} by {artistName}&quot; on your favorite streaming platform
        </p>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-lg overflow-hidden">
      <div className="aspect-video">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
          title={`${title} - ${artistName}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
    </div>
  );
}
