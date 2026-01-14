import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

async function getMarketData() {
  const songs = await prisma.song.findMany({
    include: {
      marketState: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const songsWithMarket = songs.filter((s) => s.marketState);

  // Top Movers (by % change)
  const topMovers = songsWithMarket
    .sort((a, b) => Number(b.marketState!.change24hPct) - Number(a.marketState!.change24hPct))
    .slice(0, 10);

  // Re-Emerging (older songs with positive momentum)
  const currentYear = new Date().getFullYear();
  const reEmerging = songsWithMarket
    .filter((s) => {
      const age = s.releaseYear ? currentYear - s.releaseYear : 0;
      return age >= 5 && Number(s.marketState!.change24hPct) > 0;
    })
    .sort((a, b) => Number(b.marketState!.change24hPct) - Number(a.marketState!.change24hPct))
    .slice(0, 10);

  // Covers Heating Up
  const covers = songsWithMarket
    .filter((s) => s.isCover)
    .sort((a, b) => Number(b.marketState!.change24hPct) - Number(a.marketState!.change24hPct))
    .slice(0, 10);

  // Trending (most traded)
  const trending = songsWithMarket
    .sort((a, b) => Number(b.marketState!.volume24h) - Number(a.marketState!.volume24h))
    .slice(0, 10);

  return {
    topMovers,
    reEmerging,
    covers,
    trending,
  };
}

function SongCard({ song }: { song: any }) {
  const price = Number(song.marketState?.price || 0);
  const change = Number(song.marketState?.change24hPct || 0);
  const tags = song.marketState?.tags || [];

  return (
    <Link
      href={`/song/${song.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{song.title}</h3>
          <p className="text-sm text-gray-600 truncate">{song.artistName}</p>
        </div>
        <div className="text-right ml-4">
          <p className="font-bold text-gray-900">${price.toFixed(2)}</p>
          <p
            className={`text-sm font-medium ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change >= 0 ? '+' : ''}
            {change.toFixed(2)}%
          </p>
        </div>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded"
            >
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function MarketSection({ title, songs }: { title: string; songs: any[] }) {
  if (songs.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
    </div>
  );
}

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const marketData = await getMarketData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Markets</h1>
          <p className="text-gray-600">
            Trade the cultural momentum of music. All prices in fantasy currency.
          </p>
        </div>

        <MarketSection title="🔥 Top Movers Today" songs={marketData.topMovers} />
        <MarketSection title="⏮️ Re-Emerging Classics" songs={marketData.reEmerging} />
        <MarketSection title="🎤 Covers Heating Up" songs={marketData.covers} />
        <MarketSection title="📈 Trending (Most Traded)" songs={marketData.trending} />
      </main>
    </div>
  );
}
