interface MarketTagContext {
  change24hPct: number;
  releaseYear?: number | null;
  isCover?: boolean;
  popularityPercentile: number;
  momentumPercentile: number;
  playcountDelta: number;
}

export function generateTags(context: MarketTagContext): string[] {
  const {
    change24hPct,
    releaseYear,
    isCover,
    popularityPercentile,
    momentumPercentile,
    playcountDelta,
  } = context;
  const tags: string[] = [];
  const currentYear = new Date().getFullYear();
  const age = releaseYear ? currentYear - releaseYear : 0;

  if (popularityPercentile >= 0.85) {
    tags.push('LASTFM_LEADER');
  }

  if (momentumPercentile >= 0.85 && playcountDelta > 0) {
    tags.push('LISTENING_MOMENTUM');
  }

  if (age >= 5 && momentumPercentile >= 0.6 && playcountDelta > 0) {
    tags.push('RE-EMERGING');
  }

  if (playcountDelta >= 1000) {
    tags.push('VOLUME_SPIKE');
  }

  if (change24hPct > 10) {
    tags.push('TOP_MOVER');
  } else if (change24hPct < -10) {
    tags.push('FALLING');
  }

  if (isCover && momentumPercentile >= 0.55 && playcountDelta > 0) {
    tags.push('HOT_COVER');
  }

  return tags;
}

export function getTagExplanation(tag: string): string {
  const explanations: Record<string, string> = {
    LASTFM_LEADER: 'High total listener volume on Last.fm across the tracked catalog',
    LISTENING_MOMENTUM: 'Recent Last.fm playcount growth is outpacing most tracked songs',
    RE_EMERGING: 'Classic track gaining renewed attention on Last.fm',
    TOP_MOVER: 'Significant price increase',
    FALLING: 'Sharp price decline',
    HOT_COVER: 'Cover version gaining traction',
    VOLUME_SPIKE: 'Recent Last.fm playcount is materially above the catalog baseline',
  };

  return explanations[tag] || tag;
}
