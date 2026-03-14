'use client';

interface MusicPlayerProps {
  spotifyTrackId?: string | null;
  youtubeId?: string | null;
  previewUrl?: string | null;
  albumImageUrl?: string | null;
  artistImageUrl?: string | null;
  title: string;
  artistName: string;
}

export function MusicPlayer({
  spotifyTrackId,
  youtubeId,
  previewUrl,
  albumImageUrl,
  artistImageUrl,
  title,
  artistName,
}: MusicPlayerProps) {
  const artworkUrl =
    albumImageUrl ||
    artistImageUrl ||
    (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null);
  const searchQuery = encodeURIComponent(`${title} ${artistName}`);
  const spotifySearchUrl = `https://open.spotify.com/search/${searchQuery}`;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
  const hasPlayer = Boolean(spotifyTrackId || youtubeId || previewUrl);
  const playerLabel = hasPlayer ? 'Listen' : 'Search';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-white sm:flex-row sm:items-center">
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-white/10">
          {artworkUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artworkUrl}
                alt={`${title} artwork`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">
              🎵
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
            {playerLabel}
          </div>
          <h3 className="truncate text-2xl font-bold">{title}</h3>
          <p className="mt-1 truncate text-sm text-white/70">{artistName}</p>
          <p className="mt-3 text-sm text-white/80">
            {hasPlayer
              ? 'Press play to listen.'
              : 'Preview not available right now.'}
          </p>
        </div>
      </div>

      {spotifyTrackId ? (
        <div className="overflow-hidden rounded-lg bg-black">
          <iframe
            title={`${title} by ${artistName} on Spotify`}
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
      ) : youtubeId ? (
        <div className="overflow-hidden rounded-lg bg-black">
          <iframe
            title={`${title} by ${artistName} on YouTube`}
            src={`https://www.youtube.com/embed/${youtubeId}`}
            width="100%"
            height="315"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="w-full"
          ></iframe>
        </div>
      ) : previewUrl ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="mb-3 text-sm font-medium text-gray-700">
            Preview
          </p>
          <audio controls preload="none" className="w-full">
            <source src={previewUrl} type="audio/mp4" />
            Your browser does not support audio playback.
          </audio>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={spotifySearchUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Find Track
            </a>
            <a
              href={youtubeSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Watch Video
            </a>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 p-6 text-center">
          <div className="text-4xl mb-3">🎵</div>
          <p className="text-sm text-gray-700 font-medium mb-3">
            Preview not available right now.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={spotifySearchUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Find Track
            </a>
            <a
              href={youtubeSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Watch Video
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
