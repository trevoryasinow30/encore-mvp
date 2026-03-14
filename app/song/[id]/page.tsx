import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { prisma } from '@/lib/prisma';
import { TradeModule } from '@/components/TradeModule';
import { getTagExplanation } from '@/lib/signals';
import { PriceChart } from '@/components/PriceChart';
import { MusicPlayer } from '@/components/MusicPlayer';

interface ITunesSearchResponse {
  results?: Array<{
    artworkUrl100?: string;
    previewUrl?: string;
  }>;
}

async function getSongData(songId: string) {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: {
      marketState: true,
      lastfmMetric: true,
      priceHistory: {
        orderBy: {
          createdAt: 'asc',
        },
        take: 100, // Last 100 data points
      },
      trades: {
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      },
    },
  });

  return song;
}

async function getFallbackMedia(title: string, artistName: string) {
  try {
    const query = encodeURIComponent(`${title} ${artistName}`);
    const response = await fetch(
      `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`,
      {
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) {
      return {
        artworkUrl: null,
        previewUrl: null,
      };
    }

    const data = (await response.json()) as ITunesSearchResponse;
    const result = data.results?.[0];
    const artworkUrl = result?.artworkUrl100;

    return {
      artworkUrl: artworkUrl ? artworkUrl.replace('100x100bb', '600x600bb') : null,
      previewUrl: result?.previewUrl ?? null,
    };
  } catch (error) {
    console.error('Failed to fetch fallback media:', error);
    return {
      artworkUrl: null,
      previewUrl: null,
    };
  }
}

export default async function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin?callbackUrl=/');
  }

  const { id } = await params;
  const song = await getSongData(id);

  if (!song) {
    return <div>Song not found</div>;
  }

  const price = Number(song.marketState?.price || 0);
  const change = Number(song.marketState?.change24hPct || 0);
  const tags = song.marketState?.tags || [];
  const lastfmPlays = Number(song.lastfmMetric?.playcount || 0);
  const lastfmListeners = Number(song.lastfmMetric?.listeners || 0);
  const listeningDelta = Number(song.lastfmMetric?.playcountDelta || 0);
  const fallbackMedia =
    !song.albumImageUrl && !song.artistImageUrl
      ? await getFallbackMedia(song.title, song.artistName)
      : { artworkUrl: null, previewUrl: null };

  // Format price history for chart
  const priceHistory = song.priceHistory.map((ph: typeof song.priceHistory[number]) => ({
    time: new Date(ph.createdAt).toLocaleTimeString(),
    price: Number(ph.price),
    createdAt: ph.createdAt,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{song.title}</h1>
              <p className="text-xl text-gray-600 mb-4">{song.artistName}</p>
              {song.releaseYear && (
                <p className="text-sm text-gray-500">Released: {song.releaseYear}</p>
              )}
              {song.isCover && (
                <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded mt-2">
                  Cover Version
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-gray-900">${price.toFixed(2)}</p>
              <p
                className={`text-xl font-medium ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change >= 0 ? '+' : ''}
                {change.toFixed(2)}% (24h)
              </p>
              {song.lastfmMetric ? (
                <>
                  <p className="text-sm text-gray-600 mt-2">
                    Last.fm plays: {lastfmPlays.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Last.fm listeners: {lastfmListeners.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Recent listening delta: {listeningDelta.toLocaleString()}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-600 mt-2">
                  Last.fm data not synced yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Music Player */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🎵 Listen Now</h2>
            <MusicPlayer
              spotifyTrackId={song.spotifyTrackId}
              youtubeId={song.youtubeId}
              previewUrl={fallbackMedia.previewUrl}
              albumImageUrl={song.albumImageUrl || fallbackMedia.artworkUrl}
              artistImageUrl={song.artistImageUrl}
              title={song.title}
              artistName={song.artistName}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Chart and Why it's moving */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Price Chart</h2>
              <PriceChart data={priceHistory} />
            </div>

            {/* Why it's moving */}
            {tags.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Why It&apos;s Moving</h2>
                <div className="space-y-3">
                  {tags.map((tag: string) => (
                    <div
                      key={tag}
                      className="flex items-start p-3 bg-purple-50 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-2 h-2 mt-2 bg-purple-600 rounded-full"></div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">
                          {tag.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {getTagExplanation(tag)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Trades */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Encore Trades</h2>
              {song.trades.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No user trades yet</p>
              ) : (
                <div className="space-y-2">
                  {song.trades.map((trade: typeof song.trades[number]) => (
                    <div
                      key={trade.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded ${
                            trade.side === 'BUY'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {trade.side}
                        </span>
                        <span className="text-sm text-gray-600">
                          {trade.user.username}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {Number(trade.qty).toFixed(2)} @ ${Number(trade.price).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(trade.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column - Trade Module */}
          <div className="lg:col-span-1">
            <TradeModule songId={song.id} currentPrice={price} />
          </div>
        </div>
      </main>
    </div>
  );
}
