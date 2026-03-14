import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const spotifyIds: Record<string, string> = {
  "Running Up That Hill": "75FEaRjZTKLhTrFGsfMUXR",
  "Dreams": "0ofHAoxe9vBkTCp2UQIavz",
  "The Chain": "5e9TFTbltYBg2xThimr0rU",
  "Mr. Blue Sky": "2RlgNHKcydI9sayD2Df2xp",
  "Africa": "2374M0fQpWi3dLnB54qaLX",
  "September": "5nNmj1cLQ3r4K1W4X1hnJD",
  "Take On Me": "2WfaOiMkCvy7F5fcp2zZ8L",
  "Don't Stop Believin'": "4bHsxqR3GMrXTxEPLuK5ue",
  "Sweet Child O' Mine": "7o2CTH4ctstm8TNelqjb51",
  "Bohemian Rhapsody": "4u7EnebtmKWzUH433cf5Qv",
  "Under Pressure": "2fuCquhmrzHpu5xcA1ci9x",
  "Everybody Wants to Rule the World": "4RvWPyQ5RL0ao9LPZeSouE",
  "Careless Whisper": "5XVwJy0q0woPqJKzP0vzYR",
  "Every Breath You Take": "1JSTJqkT5qHq8MDJnJbRE1",
  "Heart of Glass": "6JFdRu9GqIv2qurVIoHMfT",
  "Hey Ya!": "2PpruBYCo4H7WOBJ7Q2EwM",
  "Mr. Brightside": "003vvx7Niy0yvhvHt4a68B",
  "Seven Nation Army": "3dPQuX8Gs42Y7b454ybpJI",
  "Rolling in the Deep": "4OSBTYWVwsQhGLF9NHvIbR",
  "Somebody That I Used to Know": "4qDHtBZZw8oZBLLCjYD9qh",
  "Pumped Up Kicks": "7w87IxuO7BDcJ3YUqCyMTT",
  "Radioactive": "5qaEfEh1AtSdrdrByCP7qR",
  "Get Lucky": "2Foc5Q5nqNiosCNqttzHof",
  "Uptown Funk": "32OlwWuMpZ6b0aN2RZOeMS",
  "Blinding Lights": "0VjIjW4GlUZAMYd2vXMi3b",
  "As It Was": "4Dvkj6JhhA12EX05fT7y2e",
  "Heat Waves": "02MWAaffLxlfxAUY7c5dvx",
  "Levitating": "39LLxExYz6ewLAcYrzQQyP",
  "Anti-Hero": "0V3wPSX9ygBnCm8psDIegu",
  "Flowers": "0yLdNVWF3Srea0uzk55zFn",
  "vampire": "1kuGVB7EU95pJObxwvfwKS",
  "Cruel Summer": "1BxfuPKGuaTgP7aM0Bbdwr",
  "Paint The Town Red": "3J3vR1LkqUNPfKW7rZsVU3",
  "Kill Bill": "1Qrg8KqiBpW07V7PNxwwwL",
  "Snooze": "4iZ4pt7kvcaH6Yo8UoZ4s2",
};

async function main() {
  console.log('🎵 Updating Spotify track IDs...\n');

  let updated = 0;
  for (const [title, spotifyTrackId] of Object.entries(spotifyIds)) {
    const result = await prisma.song.updateMany({
      where: { title },
      data: { spotifyTrackId },
    });
    if (result.count > 0) {
      console.log(`✓ Updated: ${title}`);
      updated++;
    }
  }

  console.log(`\n✅ Done! Updated ${updated} songs with Spotify IDs`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
