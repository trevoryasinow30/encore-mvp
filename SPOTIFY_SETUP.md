# Spotify API Setup Guide

This guide will help you set up Spotify API credentials to import thousands of songs automatically.

## Step 1: Create a Spotify App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account (create one if needed - it's free!)
3. Click **"Create app"**

## Step 2: Fill in App Details

- **App name**: `Encore Song Importer` (or any name you like)
- **App description**: `Import songs for Encore fantasy music trading`
- **Redirect URI**: `http://localhost:3000` (not used but required)
- **API/SDKs**: Check **"Web API"**
- Agree to terms and click **"Save"**

## Step 3: Get Your Credentials

1. On your app's page, click **"Settings"** in the top right
2. You'll see two important values:
   - **Client ID** - Copy this
   - **Client Secret** - Click "View client secret" and copy this

## Step 4: Add to Your .env File

1. Open your `.env` file (or create it by copying `.env.example`)
2. Add these lines (replace with your actual values):

```env
SPOTIFY_CLIENT_ID="paste_your_client_id_here"
SPOTIFY_CLIENT_SECRET="paste_your_client_secret_here"
SPOTIFY_MARKET="US"
```

`SPOTIFY_MARKET` should be a two-letter country code such as `US`. Spotify's track endpoints
need a market when you use app-only credentials.

## Step 5: Run the Importer

```bash
npx tsx spotify-importer.ts
```

This will import songs from popular Spotify playlists including:
- Today's Top Hits
- RapCaviar
- Rock Classics
- All Out 2010s, 2000s, 90s, 80s
- Dance Hits, R&B classics, Latin Hits
- And more!

## What Gets Imported

For each song, the importer fetches:
- ✓ Song title
- ✓ Artist name
- ✓ Release year
- ✓ Spotify track ID (for music playback)

All songs start at $1.00 and are ready to trade!

## Troubleshooting

**"Missing Spotify credentials" error:**
- Make sure you copied both CLIENT_ID and CLIENT_SECRET to .env
- Make sure there are no extra spaces or quotes
- Restart your terminal after editing .env

**"Failed to authenticate" error:**
- Double-check your credentials are correct
- Make sure your Spotify app is active (not deleted)

**Rate limiting:**
- The importer has built-in delays to avoid rate limits
- If you hit limits, just wait a minute and run it again

## Need Help?

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Spotify Dashboard](https://developer.spotify.com/dashboard)

---

Happy importing! 🎵
