import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '@/lib/prisma';

const LASTFM_API_ROOT = 'https://ws.audioscrobbler.com/2.0/';
const LASTFM_PRICE_FLOOR = 0.5;
const LASTFM_PRICE_CEILING = 10;
const LASTFM_CONCURRENCY = 4;

export const LASTFM_API_KEY_ERROR =
  'Last.fm API key is missing. Set LASTFM_API_KEY in .env first.';

interface LastfmMetricRecord {
  playcount: Decimal;
  listeners: Decimal;
  playcountDelta: Decimal;
  syncedAt: Date;
}

interface LastfmSongRecord {
  id: string;
  title: string;
  artistName: string;
  marketState: {
    id: string;
    price: Decimal;
  } | null;
  lastfmMetric: LastfmMetricRecord | null;
  priceHistory: Array<{ id: string }>;
}

interface LastfmTrackResponse {
  track?: {
    playcount?: string;
    listeners?: string;
  };
  error?: number;
  message?: string;
}

export interface LastfmPriceAnchor {
  songId: string;
  basePrice: number;
  playcount: number;
  listeners: number;
  playcountDelta: number;
  popularityPercentile: number;
  momentumPercentile: number;
}

function toNumber(value: Decimal | string | number | null | undefined) {
  return value == null ? 0 : Number(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function rankedPercentiles(values: Array<{ songId: string; score: number }>) {
  const sorted = [...values].sort((a, b) => a.score - b.score);
  const divisor = Math.max(sorted.length - 1, 1);
  const percentiles = new Map<string, number>();

  sorted.forEach((item, index) => {
    percentiles.set(item.songId, index / divisor);
  });

  return percentiles;
}

export function hasLastfmApiKey() {
  return Boolean(process.env.LASTFM_API_KEY?.trim());
}

function lastfmApiKey() {
  const apiKey = process.env.LASTFM_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(LASTFM_API_KEY_ERROR);
  }

  return apiKey;
}

async function fetchLastfmTrackInfo(song: Pick<LastfmSongRecord, 'title' | 'artistName'>) {
  const params = new URLSearchParams({
    method: 'track.getInfo',
    api_key: lastfmApiKey(),
    artist: song.artistName,
    track: song.title,
    autocorrect: '1',
    format: 'json',
  });

  const response = await fetch(`${LASTFM_API_ROOT}?${params.toString()}`, {
    headers: {
      'user-agent': 'EncoreMVP/1.0 (+https://encore.local)',
    },
  });

  if (!response.ok) {
    throw new Error(`Last.fm request failed with ${response.status}`);
  }

  const data = (await response.json()) as LastfmTrackResponse;

  if (data.error || !data.track?.playcount || !data.track?.listeners) {
    return null;
  }

  const playcount = Number(data.track.playcount);
  const listeners = Number(data.track.listeners);

  if (!Number.isFinite(playcount) || !Number.isFinite(listeners)) {
    return null;
  }

  return {
    playcount,
    listeners,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
) {
  const results = new Array<R>(items.length);
  let currentIndex = 0;

  async function runWorker() {
    while (true) {
      const index = currentIndex;
      currentIndex += 1;

      if (index >= items.length) {
        return;
      }

      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => runWorker())
  );

  return results;
}

async function getSongsForLastfmSync(): Promise<LastfmSongRecord[]> {
  return prisma.song.findMany({
    select: {
      id: true,
      title: true,
      artistName: true,
      marketState: {
        select: {
          id: true,
          price: true,
        },
      },
      lastfmMetric: {
        select: {
          playcount: true,
          listeners: true,
          playcountDelta: true,
          syncedAt: true,
        },
      },
      priceHistory: {
        select: {
          id: true,
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export function buildLastfmPriceAnchors(
  songs: Array<{
    id: string;
    lastfmMetric: LastfmMetricRecord | null;
  }>
) {
  const scoredSongs = songs
    .map((song) => {
      const playcount = toNumber(song.lastfmMetric?.playcount);
      const listeners = toNumber(song.lastfmMetric?.listeners);
      const playcountDelta = toNumber(song.lastfmMetric?.playcountDelta);

      if (playcount <= 0 || listeners <= 0) {
        return null;
      }

      const score = Math.log10(playcount + 1) * 0.75 + Math.log10(listeners + 1) * 0.25;
      const momentumScore = Math.log10(playcountDelta + 1);

      return {
        songId: song.id,
        playcount,
        listeners,
        playcountDelta,
        score,
        momentumScore,
      };
    })
    .filter((song): song is NonNullable<typeof song> => Boolean(song));

  if (scoredSongs.length === 0) {
    return new Map<string, LastfmPriceAnchor>();
  }

  const popularityPercentiles = rankedPercentiles(
    scoredSongs.map((song) => ({ songId: song.songId, score: song.score }))
  );
  const momentumPercentiles = rankedPercentiles(
    scoredSongs.map((song) => ({ songId: song.songId, score: song.momentumScore }))
  );
  const anchors = new Map<string, LastfmPriceAnchor>();

  for (const song of scoredSongs) {
    const popularityPercentile = popularityPercentiles.get(song.songId) ?? 0.5;
    const momentumPercentile = momentumPercentiles.get(song.songId) ?? 0;
    const basePrice =
      LASTFM_PRICE_FLOOR +
      popularityPercentile * (LASTFM_PRICE_CEILING - LASTFM_PRICE_FLOOR);

    anchors.set(song.songId, {
      songId: song.songId,
      basePrice: Number(basePrice.toFixed(2)),
      playcount: song.playcount,
      listeners: song.listeners,
      playcountDelta: song.playcountDelta,
      popularityPercentile,
      momentumPercentile,
    });
  }

  return anchors;
}

export async function syncLastfmMarketData() {
  if (!hasLastfmApiKey()) {
    throw new Error(LASTFM_API_KEY_ERROR);
  }

  const songs = await getSongsForLastfmSync();
  let syncedSongs = 0;
  let missingSongs = 0;

  await mapWithConcurrency(songs, LASTFM_CONCURRENCY, async (song) => {
    const info = await fetchLastfmTrackInfo(song);

    if (!info) {
      missingSongs += 1;
      return;
    }

    const previousPlaycount = toNumber(song.lastfmMetric?.playcount);
    const playcountDelta =
      previousPlaycount > 0 ? Math.max(info.playcount - previousPlaycount, 0) : 0;

    await prisma.lastfmMetric.upsert({
      where: {
        songId: song.id,
      },
      update: {
        playcount: new Decimal(info.playcount.toString()),
        listeners: new Decimal(info.listeners.toString()),
        playcountDelta: new Decimal(playcountDelta.toString()),
        syncedAt: new Date(),
      },
      create: {
        songId: song.id,
        playcount: new Decimal(info.playcount.toString()),
        listeners: new Decimal(info.listeners.toString()),
        playcountDelta: new Decimal(0),
        syncedAt: new Date(),
      },
    });

    syncedSongs += 1;
  });

  const refreshedSongs = await getSongsForLastfmSync();
  const anchors = buildLastfmPriceAnchors(refreshedSongs);
  let initializedPrices = 0;

  for (const song of refreshedSongs) {
    const anchor = anchors.get(song.id);

    if (!anchor) {
      continue;
    }

    const tags: string[] = [];
    const hasHistory = song.priceHistory.length > 0;
    const isPlaceholderPrice =
      song.marketState && (Number(song.marketState.price) === 1 || Number(song.marketState.price) === 0.5);

    if (!song.marketState || (!hasHistory && isPlaceholderPrice)) {
      const priceValue = new Decimal(anchor.basePrice.toFixed(2));
      const volumeValue = new Decimal(anchor.playcountDelta.toFixed(0));

      if (song.marketState) {
        await prisma.marketState.update({
          where: { id: song.marketState.id },
          data: {
            price: priceValue,
            change24hPct: new Decimal(0),
            volume24h: volumeValue,
            tags,
            lastUpdatedAt: new Date(),
          },
        });
      } else {
        await prisma.marketState.create({
          data: {
            songId: song.id,
            price: priceValue,
            change24hPct: new Decimal(0),
            volume24h: volumeValue,
            traders24h: 0,
            tags,
          },
        });
      }

      if (!hasHistory) {
        await prisma.priceHistory.create({
          data: {
            songId: song.id,
            price: priceValue,
            volume: volumeValue,
          },
        });
      }

      initializedPrices += 1;
    }
  }

  return {
    syncedSongs,
    missingSongs,
    initializedPrices,
  };
}
