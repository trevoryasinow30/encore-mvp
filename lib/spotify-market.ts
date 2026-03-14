import SpotifyWebApi from 'spotify-web-api-node';
import { prisma } from '@/lib/prisma';

const SEARCH_DELAY_MS = 150;
const DEFAULT_SPOTIFY_MARKET = 'US';
export const SPOTIFY_CREDENTIALS_ERROR =
  'Spotify credentials are missing. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env first.';

interface SpotifySongRecord {
  id: string;
  title: string;
  artistName: string;
  spotifyTrackId: string | null;
  albumImageUrl: string | null;
}

export interface SpotifyTrackSnapshot {
  songId: string;
  trackId: string;
  albumImageUrl: string | null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(ft|feat|featuring)\b.*$/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function titlesMatch(expected: string, actual: string) {
  const expectedNormalized = normalizeText(expected);
  const actualNormalized = normalizeText(actual);

  return (
    expectedNormalized === actualNormalized ||
    expectedNormalized.includes(actualNormalized) ||
    actualNormalized.includes(expectedNormalized)
  );
}

function artistsMatch(expected: string, actualArtists: string[]) {
  const expectedNormalized = normalizeText(expected);

  return actualArtists.some((artist) => {
    const actualNormalized = normalizeText(artist);

    return (
      expectedNormalized === actualNormalized ||
      expectedNormalized.includes(actualNormalized) ||
      actualNormalized.includes(expectedNormalized)
    );
  });
}

function createSpotifyClient() {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(SPOTIFY_CREDENTIALS_ERROR);
  }

  return new SpotifyWebApi({
    clientId,
    clientSecret,
  });
}

function getSpotifyMarket() {
  const market = process.env.SPOTIFY_MARKET?.trim().toUpperCase();
  return market || DEFAULT_SPOTIFY_MARKET;
}

async function findBestSpotifyMatch(client: SpotifyWebApi, song: SpotifySongRecord) {
  const queries = [
    `track:${song.title} artist:${song.artistName}`,
    `${song.title} ${song.artistName}`,
  ];

  for (const query of queries) {
    const response = await client.searchTracks(query, {
      limit: 5,
      market: getSpotifyMarket(),
    });
    const matches = response.body.tracks?.items ?? [];

    const bestMatch =
      matches.find((track) => track.id === song.spotifyTrackId) ??
      matches.find((track) =>
        titlesMatch(song.title, track.name) &&
        artistsMatch(song.artistName, track.artists.map((artist) => artist.name))
      ) ??
      matches.find((track) => titlesMatch(song.title, track.name)) ??
      null;

    if (bestMatch?.id) {
      return bestMatch;
    }
  }

  return null;
}

async function authenticateSpotify(client: SpotifyWebApi) {
  const authResponse = await client.clientCredentialsGrant();
  client.setAccessToken(authResponse.body.access_token);
}

async function getSpotifySongs(): Promise<SpotifySongRecord[]> {
  return prisma.song.findMany({
    select: {
      id: true,
      title: true,
      artistName: true,
      spotifyTrackId: true,
      albumImageUrl: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

async function resolveMissingTrackIds(client: SpotifyWebApi, songs: SpotifySongRecord[]) {
  let resolvedTrackIds = 0;
  let unresolvedTrackIds = 0;

  for (const song of songs) {
    if (song.spotifyTrackId) {
      continue;
    }

    const bestMatch = await findBestSpotifyMatch(client, song);

    if (bestMatch?.id) {
      const albumImageUrl = bestMatch.album.images[0]?.url ?? null;

      await prisma.song.update({
        where: { id: song.id },
        data: {
          spotifyTrackId: bestMatch.id,
          albumImageUrl: song.albumImageUrl || albumImageUrl,
        },
      });

      song.spotifyTrackId = bestMatch.id;
      song.albumImageUrl = song.albumImageUrl || albumImageUrl;
      resolvedTrackIds += 1;
    } else {
      unresolvedTrackIds += 1;
    }

    await sleep(SEARCH_DELAY_MS);
  }

  return {
    resolvedTrackIds,
    unresolvedTrackIds,
  };
}

async function fetchSpotifyTrackSnapshotsWithClient(
  client: SpotifyWebApi,
  songs: SpotifySongRecord[]
) {
  const snapshots = new Map<string, SpotifyTrackSnapshot>();

  for (const song of songs) {
    const match = await findBestSpotifyMatch(client, song);

    if (!match?.id) {
      await sleep(SEARCH_DELAY_MS);
      continue;
    }

    const popularity = match.popularity ?? 0;

    snapshots.set(song.id, {
      songId: song.id,
      trackId: match.id,
      albumImageUrl: match.album.images[0]?.url ?? song.albumImageUrl ?? null,
    });

    await sleep(SEARCH_DELAY_MS);
  }

  return snapshots;
}

export function hasSpotifyCredentials() {
  return Boolean(
    process.env.SPOTIFY_CLIENT_ID?.trim() &&
    process.env.SPOTIFY_CLIENT_SECRET?.trim()
  );
}

export async function fetchSpotifyTrackSnapshots(songs: SpotifySongRecord[]) {
  if (!hasSpotifyCredentials()) {
    return new Map<string, SpotifyTrackSnapshot>();
  }

  const client = createSpotifyClient();
  await authenticateSpotify(client);

  return fetchSpotifyTrackSnapshotsWithClient(client, songs);
}

export async function syncSpotifyMarketData() {
  const client = createSpotifyClient();
  await authenticateSpotify(client);

  const songs = await getSpotifySongs();
  const { resolvedTrackIds, unresolvedTrackIds } = await resolveMissingTrackIds(client, songs);
  const snapshots = await fetchSpotifyTrackSnapshotsWithClient(client, songs);
  let syncedSongs = 0;

  for (const song of songs) {
    const snapshot = snapshots.get(song.id);

    if (!snapshot) {
      continue;
    }

    await prisma.song.update({
      where: { id: song.id },
      data: {
        spotifyTrackId: snapshot.trackId,
        albumImageUrl: song.albumImageUrl || snapshot.albumImageUrl,
      },
    });
    syncedSongs += 1;
  }

  return {
    resolvedTrackIds,
    unresolvedTrackIds,
    syncedSongs,
    syncedSnapshots: snapshots.size,
  };
}
