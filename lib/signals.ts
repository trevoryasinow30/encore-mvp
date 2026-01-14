// Signal engine for generating mock market signals
// In production, this would integrate with real data sources (Spotify, TikTok, etc.)

interface SongSignals {
  tiktokVelocity: number; // -1 to 1 (rate of change)
  spotifyPopularityDelta: number; // -1 to 1
  youtubeViewsDelta: number; // -1 to 1
  socialMentionsTrend: number; // -1 to 1
}

// Deterministic pseudo-random generator seeded by song ID and timestamp
function seededRandom(seed: string, timestamp: number): number {
  const combined = seed + Math.floor(timestamp / (1000 * 60 * 30)); // Change every 30 min
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(Math.sin(hash));
}

// Generate signals for a song (deterministic but time-varying)
export function generateSignals(songId: string, releaseYear?: number | null): SongSignals {
  const now = Date.now();

  // Base randomness
  const r1 = seededRandom(songId + 'tiktok', now);
  const r2 = seededRandom(songId + 'spotify', now);
  const r3 = seededRandom(songId + 'youtube', now);
  const r4 = seededRandom(songId + 'social', now);

  // Map to -1 to 1 range
  const tiktokVelocity = (r1 * 2 - 1) * 0.8;
  const spotifyPopularityDelta = (r2 * 2 - 1) * 0.6;
  const youtubeViewsDelta = (r3 * 2 - 1) * 0.5;
  const socialMentionsTrend = (r4 * 2 - 1) * 0.7;

  // Boost for older songs occasionally (re-emergence)
  const currentYear = new Date().getFullYear();
  const age = releaseYear ? currentYear - releaseYear : 0;

  if (age >= 5 && r1 > 0.7) {
    // Simulate re-emergence spike
    return {
      tiktokVelocity: Math.min(tiktokVelocity + 0.5, 1),
      spotifyPopularityDelta: Math.min(spotifyPopularityDelta + 0.3, 1),
      youtubeViewsDelta: Math.min(youtubeViewsDelta + 0.2, 1),
      socialMentionsTrend: Math.min(socialMentionsTrend + 0.4, 1),
    };
  }

  return {
    tiktokVelocity,
    spotifyPopularityDelta,
    youtubeViewsDelta,
    socialMentionsTrend,
  };
}

// Generate tags based on signals and price movement
export function generateTags(
  signals: SongSignals,
  change24hPct: number,
  releaseYear?: number | null,
  isCover?: boolean
): string[] {
  const tags: string[] = [];

  const currentYear = new Date().getFullYear();
  const age = releaseYear ? currentYear - releaseYear : 0;

  // Re-emerging classics
  if (age >= 5 && signals.tiktokVelocity > 0.3) {
    tags.push('RE-EMERGING');
  }

  // TikTok spike
  if (signals.tiktokVelocity > 0.4) {
    tags.push('TIKTOK_SPIKE');
  }

  // Spotify momentum
  if (signals.spotifyPopularityDelta > 0.3) {
    tags.push('SPOTIFY_MOMENTUM');
  }

  // YouTube trending
  if (signals.youtubeViewsDelta > 0.35) {
    tags.push('YOUTUBE_TRENDING');
  }

  // Social media buzz
  if (signals.socialMentionsTrend > 0.4) {
    tags.push('SOCIAL_BUZZ');
  }

  // Top mover (based on price change)
  if (change24hPct > 20) {
    tags.push('TOP_MOVER');
  } else if (change24hPct < -20) {
    tags.push('FALLING');
  }

  // Hot cover
  if (isCover && (signals.tiktokVelocity > 0.25 || signals.socialMentionsTrend > 0.25)) {
    tags.push('HOT_COVER');
  }

  // Volume spike
  if (signals.tiktokVelocity > 0.5 || signals.spotifyPopularityDelta > 0.5) {
    tags.push('VOLUME_SPIKE');
  }

  return tags;
}

// Get human-readable explanation for tags
export function getTagExplanation(tag: string): string {
  const explanations: Record<string, string> = {
    RE_EMERGING: 'Classic track gaining renewed attention',
    TIKTOK_SPIKE: 'Viral momentum on TikTok',
    SPOTIFY_MOMENTUM: 'Climbing Spotify charts',
    YOUTUBE_TRENDING: 'Trending on YouTube',
    SOCIAL_BUZZ: 'High social media engagement',
    TOP_MOVER: 'Significant price increase',
    FALLING: 'Sharp price decline',
    HOT_COVER: 'Cover version gaining traction',
    VOLUME_SPIKE: 'Unusually high trading activity',
  };

  return explanations[tag] || tag;
}
