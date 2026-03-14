# Market Data Decisions

This repo intentionally separates pricing data from media metadata.

## Pricing Source

Encore prices are currently designed to use cached **Last.fm** listening data when
`LASTFM_API_KEY` is configured.

The app syncs, stores, and reuses:

- Total Last.fm `playcount`
- Total Last.fm `listeners`
- Incremental `playcountDelta` between syncs

These values are stored locally in the `LastfmMetric` table and then converted into
price anchors inside [`lib/lastfm-market.ts`](/Users/matthewpaley/encore-mvp/lib/lastfm-market.ts)
and [`lib/market-tick.ts`](/Users/matthewpaley/encore-mvp/lib/market-tick.ts).

## Why Not Spotify For Pricing

Spotify is not the pricing source anymore.

Reason:

- Spotify's public Web API no longer exposes the track-level `popularity` field we originally
  tried to use as a pricing anchor.
- That made Spotify unsuitable as a transparent, stable public pricing basis for this repo.

Spotify is still useful here for:

- Track IDs
- Embeds
- Artwork backfill

Those flows remain optional and are handled separately by `pnpm spotify:sync`.

## Current Pricing Model

The current model is intentionally simple and transparent:

1. Fetch Last.fm playcount and listener totals for each tracked song.
2. Compute a weighted listening score from those totals.
3. Rank songs within the tracked Encore catalog.
4. Map that rank into the local price band.
5. Apply bounded in-app trading impact only if actual Encore trades exist.

That means prices are:

- Grounded in real public listening data
- Still local fantasy-market prices, not a real-world monetary value
- Dependent on the tracked Encore song catalog, not the entire global music catalog

## Transparency Notes

- `MarketState.volume24h` is currently used as a cached listening-delta field, not dollar trade volume.
- "Recent Encore Trades" on the song page refers only to user trades inside Encore.
- If `LASTFM_API_KEY` is missing, the app falls back to demo pricing behavior.
- On the very first Last.fm sync, 24h change is initialized conservatively because there is no prior
  external snapshot yet.

## Required Env Vars

For Last.fm pricing:

```env
LASTFM_API_KEY="your_lastfm_api_key"
LASTFM_SYNC_SCHEDULE="15 * * * *"
```

For optional Spotify metadata:

```env
SPOTIFY_CLIENT_ID="your_spotify_client_id"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"
SPOTIFY_MARKET="US"
```
