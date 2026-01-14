import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const songs = [
  // Classic re-emergence candidates (older songs that could trend)
  { title: "Running Up That Hill", artistName: "Kate Bush", releaseYear: 1985, isCover: false },
  { title: "Dreams", artistName: "Fleetwood Mac", releaseYear: 1977, isCover: false },
  { title: "The Chain", artistName: "Fleetwood Mac", releaseYear: 1977, isCover: false },
  { title: "Mr. Blue Sky", artistName: "Electric Light Orchestra", releaseYear: 1977, isCover: false },
  { title: "Africa", artistName: "Toto", releaseYear: 1982, isCover: false },
  { title: "September", artistName: "Earth, Wind & Fire", releaseYear: 1978, isCover: false },
  { title: "Take On Me", artistName: "a-ha", releaseYear: 1985, isCover: false },
  { title: "Don't Stop Believin'", artistName: "Journey", releaseYear: 1981, isCover: false },
  { title: "Sweet Child O' Mine", artistName: "Guns N' Roses", releaseYear: 1987, isCover: false },
  { title: "Bohemian Rhapsody", artistName: "Queen", releaseYear: 1975, isCover: false },
  { title: "Under Pressure", artistName: "Queen & David Bowie", releaseYear: 1981, isCover: false },
  { title: "Everybody Wants to Rule the World", artistName: "Tears for Fears", releaseYear: 1985, isCover: false },
  { title: "Careless Whisper", artistName: "George Michael", releaseYear: 1984, isCover: false },
  { title: "Every Breath You Take", artistName: "The Police", releaseYear: 1983, isCover: false },
  { title: "Heart of Glass", artistName: "Blondie", releaseYear: 1978, isCover: false },

  // 2000s-2010s songs
  { title: "Hey Ya!", artistName: "OutKast", releaseYear: 2003, isCover: false },
  { title: "Mr. Brightside", artistName: "The Killers", releaseYear: 2003, isCover: false },
  { title: "Seven Nation Army", artistName: "The White Stripes", releaseYear: 2003, isCover: false },
  { title: "Rolling in the Deep", artistName: "Adele", releaseYear: 2010, isCover: false },
  { title: "Somebody That I Used to Know", artistName: "Gotye", releaseYear: 2011, isCover: false },
  { title: "Pumped Up Kicks", artistName: "Foster the People", releaseYear: 2010, isCover: false },
  { title: "Radioactive", artistName: "Imagine Dragons", releaseYear: 2012, isCover: false },
  { title: "Get Lucky", artistName: "Daft Punk", releaseYear: 2013, isCover: false },
  { title: "Uptown Funk", artistName: "Mark Ronson ft. Bruno Mars", releaseYear: 2014, isCover: false },
  { title: "Blinding Lights", artistName: "The Weeknd", releaseYear: 2019, isCover: false },

  // Recent/current songs (2020s)
  { title: "As It Was", artistName: "Harry Styles", releaseYear: 2022, isCover: false },
  { title: "Heat Waves", artistName: "Glass Animals", releaseYear: 2020, isCover: false },
  { title: "Levitating", artistName: "Dua Lipa", releaseYear: 2020, isCover: false },
  { title: "Anti-Hero", artistName: "Taylor Swift", releaseYear: 2022, isCover: false },
  { title: "Flowers", artistName: "Miley Cyrus", releaseYear: 2023, isCover: false },
  { title: "vampire", artistName: "Olivia Rodrigo", releaseYear: 2023, isCover: false },
  { title: "Cruel Summer", artistName: "Taylor Swift", releaseYear: 2019, isCover: false },
  { title: "Paint The Town Red", artistName: "Doja Cat", releaseYear: 2023, isCover: false },
  { title: "Kill Bill", artistName: "SZA", releaseYear: 2022, isCover: false },
  { title: "Snooze", artistName: "SZA", releaseYear: 2022, isCover: false },

  // Covers (popular cover versions)
  { title: "Hurt", artistName: "Johnny Cash", releaseYear: 2002, isCover: true },
  { title: "All Along the Watchtower", artistName: "Jimi Hendrix", releaseYear: 1968, isCover: true },
  { title: "Mad World", artistName: "Gary Jules", releaseYear: 2001, isCover: true },
  { title: "I Will Always Love You", artistName: "Whitney Houston", releaseYear: 1992, isCover: true },
  { title: "Respect", artistName: "Aretha Franklin", releaseYear: 1967, isCover: true },
  { title: "Hallelujah", artistName: "Jeff Buckley", releaseYear: 1994, isCover: true },
  { title: "The Man Who Sold The World", artistName: "Nirvana", releaseYear: 1994, isCover: true },
  { title: "Nothing Compares 2 U", artistName: "Sinéad O'Connor", releaseYear: 1990, isCover: true },

  // Additional variety
  { title: "Industry Baby", artistName: "Lil Nas X", releaseYear: 2021, isCover: false },
  { title: "good 4 u", artistName: "Olivia Rodrigo", releaseYear: 2021, isCover: false },
  { title: "Peaches", artistName: "Justin Bieber", releaseYear: 2021, isCover: false },
  { title: "Stay", artistName: "The Kid LAROI & Justin Bieber", releaseYear: 2021, isCover: false },
  { title: "Bad Habits", artistName: "Ed Sheeran", releaseYear: 2021, isCover: false },
  { title: "MONTERO (Call Me By Your Name)", artistName: "Lil Nas X", releaseYear: 2021, isCover: false },
  { title: "Savage Love", artistName: "Jawsh 685 & Jason Derulo", releaseYear: 2020, isCover: false },
  { title: "Watermelon Sugar", artistName: "Harry Styles", releaseYear: 2019, isCover: false },
  { title: "Say So", artistName: "Doja Cat", releaseYear: 2019, isCover: false },
  { title: "Positions", artistName: "Ariana Grande", releaseYear: 2020, isCover: false },

  // More classics
  { title: "Billie Jean", artistName: "Michael Jackson", releaseYear: 1982, isCover: false },
  { title: "Thriller", artistName: "Michael Jackson", releaseYear: 1982, isCover: false },
  { title: "Purple Rain", artistName: "Prince", releaseYear: 1984, isCover: false },
  { title: "Like a Prayer", artistName: "Madonna", releaseYear: 1989, isCover: false },
  { title: "Smells Like Teen Spirit", artistName: "Nirvana", releaseYear: 1991, isCover: false },
  { title: "Creep", artistName: "Radiohead", releaseYear: 1992, isCover: false },
  { title: "Wonderwall", artistName: "Oasis", releaseYear: 1995, isCover: false },
  { title: "Bitter Sweet Symphony", artistName: "The Verve", releaseYear: 1997, isCover: false },

  // Hip-hop/R&B classics
  { title: "Juicy", artistName: "The Notorious B.I.G.", releaseYear: 1994, isCover: false },
  { title: "California Love", artistName: "2Pac ft. Dr. Dre", releaseYear: 1995, isCover: false },
  { title: "Crazy in Love", artistName: "Beyoncé", releaseYear: 2003, isCover: false },
  { title: "In Da Club", artistName: "50 Cent", releaseYear: 2003, isCover: false },
  { title: "Gold Digger", artistName: "Kanye West", releaseYear: 2005, isCover: false },
  { title: "Stronger", artistName: "Kanye West", releaseYear: 2007, isCover: false },

  // Indie/Alternative
  { title: "Electric Feel", artistName: "MGMT", releaseYear: 2007, isCover: false },
  { title: "Take Me Out", artistName: "Franz Ferdinand", releaseYear: 2004, isCover: false },
  { title: "Float On", artistName: "Modest Mouse", releaseYear: 2004, isCover: false },
  { title: "1901", artistName: "Phoenix", releaseYear: 2009, isCover: false },
  { title: "Somebody Told Me", artistName: "The Killers", releaseYear: 2004, isCover: false },

  // EDM/Dance
  { title: "Lean On", artistName: "Major Lazer & DJ Snake", releaseYear: 2015, isCover: false },
  { title: "Wake Me Up", artistName: "Avicii", releaseYear: 2013, isCover: false },
  { title: "Titanium", artistName: "David Guetta ft. Sia", releaseYear: 2011, isCover: false },
  { title: "Clarity", artistName: "Zedd", releaseYear: 2012, isCover: false },
  { title: "Animals", artistName: "Martin Garrix", releaseYear: 2013, isCover: false },

  // More recent hits
  { title: "Shivers", artistName: "Ed Sheeran", releaseYear: 2021, isCover: false },
  { title: "Easy On Me", artistName: "Adele", releaseYear: 2021, isCover: false },
  { title: "abcdefu", artistName: "GAYLE", releaseYear: 2021, isCover: false },
  { title: "We Don't Talk About Bruno", artistName: "Encanto Cast", releaseYear: 2021, isCover: false },
  { title: "Surface Pressure", artistName: "Jessica Darrow", releaseYear: 2021, isCover: false },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Create demo users
  console.log('Creating demo users...');
  const demoUsers = await Promise.all([
    prisma.user.create({
      data: {
        username: 'demo',
        email: 'demo@encore.app',
        password: await hash('demo123', 10),
      },
    }),
    prisma.user.create({
      data: {
        username: 'trader1',
        email: 'trader1@encore.app',
        password: await hash('trader123', 10),
      },
    }),
    prisma.user.create({
      data: {
        username: 'musicfan',
        email: 'musicfan@encore.app',
        password: await hash('music123', 10),
      },
    }),
  ]);

  console.log(`✅ Created ${demoUsers.length} demo users`);

  // Give each user starting balance
  for (const user of demoUsers) {
    await prisma.ledger.create({
      data: {
        userId: user.id,
        type: 'DEPOSIT',
        amount: 10000,
        balanceAfter: 10000,
        description: 'Initial deposit',
      },
    });
  }

  console.log('💰 Deposited $10,000 to each user');

  // Create songs
  console.log('Creating songs...');
  const createdSongs = await Promise.all(
    songs.map((song) =>
      prisma.song.create({
        data: song,
      })
    )
  );

  console.log(`✅ Created ${createdSongs.length} songs`);

  // Create initial market states for all songs (all start at $1.00)
  console.log('Creating market states...');
  await Promise.all(
    createdSongs.map((song) =>
      prisma.marketState.create({
        data: {
          songId: song.id,
          price: 1.00,
          change24hPct: 0,
          volume24h: 0,
          traders24h: 0,
          tags: [],
        },
      })
    )
  );

  console.log(`✅ Created market states for ${createdSongs.length} songs`);

  console.log('🎉 Seed completed successfully!');
  console.log(`\n📊 Database summary:`);
  console.log(`   Users: ${demoUsers.length}`);
  console.log(`   Songs: ${createdSongs.length}`);
  console.log(`   Starting balance per user: $10,000`);
  console.log(`\n🔐 Demo credentials:`);
  console.log(`   Username: demo`);
  console.log(`   Password: demo123`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
