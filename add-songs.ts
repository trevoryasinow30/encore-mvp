import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const newSongs = [
  // 1960s Classics
  { title: "Hey Jude", artistName: "The Beatles", releaseYear: 1968, isCover: false, spotifyTrackId: "0aym2LBJBk9DAYuHHutrIl" },
  { title: "Let It Be", artistName: "The Beatles", releaseYear: 1970, isCover: false, spotifyTrackId: "7iN1s7xHE4ifF5povM6A48" },
  { title: "Come Together", artistName: "The Beatles", releaseYear: 1969, isCover: false, spotifyTrackId: "2EqlS6tkEnglzr7tkKAAYD" },
  { title: "Imagine", artistName: "John Lennon", releaseYear: 1971, isCover: false, spotifyTrackId: "7pKfPomDEeI4TPT6EOYjn9" },
  { title: "Stairway to Heaven", artistName: "Led Zeppelin", releaseYear: 1971, isCover: false, spotifyTrackId: "5CQ30WqJwcep0pYcV4AMNc" },
  { title: "Whole Lotta Love", artistName: "Led Zeppelin", releaseYear: 1969, isCover: false, spotifyTrackId: "0hCB0YR03f6AmQaHbwWDe8" },
  { title: "Light My Fire", artistName: "The Doors", releaseYear: 1967, isCover: false, spotifyTrackId: "3TanVOzibGLPWRS0EVW5bx" },
  { title: "Purple Haze", artistName: "Jimi Hendrix", releaseYear: 1967, isCover: false, spotifyTrackId: "0wJoRiX5K5BxlqZTpSnW5Gz" },
  { title: "Good Vibrations", artistName: "The Beach Boys", releaseYear: 1966, isCover: false, spotifyTrackId: "70CIGA6kXETbg8WLnDO0Uk" },
  { title: "I Want to Hold Your Hand", artistName: "The Beatles", releaseYear: 1963, isCover: false, spotifyTrackId: "4pbG9SUmWIvsROVLF0zF9s" },

  // 1970s Rock/Pop
  { title: "Hotel California", artistName: "Eagles", releaseYear: 1976, isCover: false, spotifyTrackId: "40riOy7x9W7GXjyGp4pjAv" },
  { title: "Go Your Own Way", artistName: "Fleetwood Mac", releaseYear: 1977, isCover: false, spotifyTrackId: "4a5qMhN6W7FmgM5fFQZLrb" },
  { title: "Dancing Queen", artistName: "ABBA", releaseYear: 1976, isCover: false, spotifyTrackId: "0GjEhVFGZW8afUYGChu3Rr" },
  { title: "Stayin' Alive", artistName: "Bee Gees", releaseYear: 1977, isCover: false, spotifyTrackId: "4Cy0NHJ8Gh0xMdwyM9RkQm" },
  { title: "Don't Stop Me Now", artistName: "Queen", releaseYear: 1978, isCover: false, spotifyTrackId: "5T8EDUDqKcs6OSOwEsfqG7" },
  { title: "We Will Rock You", artistName: "Queen", releaseYear: 1977, isCover: false, spotifyTrackId: "54flyrjcdnQdco7300avMJ" },
  { title: "Superstition", artistName: "Stevie Wonder", releaseYear: 1972, isCover: false, spotifyTrackId: "1h2xVEoJORqrg71HocgqXd" },
  { title: "Le Freak", artistName: "Chic", releaseYear: 1978, isCover: false, spotifyTrackId: "7CHRMEGKy8wRJZRSS0lQ5P" },

  // 1980s Pop/Rock
  { title: "Livin' on a Prayer", artistName: "Bon Jovi", releaseYear: 1986, isCover: false, spotifyTrackId: "0J6mQxEZnlRt9ymzFntA6z" },
  { title: "Girls Just Want to Have Fun", artistName: "Cyndi Lauper", releaseYear: 1983, isCover: false, spotifyTrackId: "2tT5NJRbHe0B2nbQ9SG0m4" },
  { title: "Like a Virgin", artistName: "Madonna", releaseYear: 1984, isCover: false, spotifyTrackId: "2CKySrhmh4PQmVq3I1GCVE" },
  { title: "Material Girl", artistName: "Madonna", releaseYear: 1984, isCover: false, spotifyTrackId: "1mpOTPAMhhGgHPNyYoC28S" },
  { title: "With or Without You", artistName: "U2", releaseYear: 1987, isCover: false, spotifyTrackId: "6ADSaE87h8Y3lccZlBJdXr" },
  { title: "Where the Streets Have No Name", artistName: "U2", releaseYear: 1987, isCover: false, spotifyTrackId: "6C9VvBON6iyepFQ1vo3FXt" },
  { title: "Don't You (Forget About Me)", artistName: "Simple Minds", releaseYear: 1985, isCover: false, spotifyTrackId: "3rYEoN469N8CXMhSLfIYgW" },
  { title: "Wake Me Up Before You Go-Go", artistName: "Wham!", releaseYear: 1984, isCover: false, spotifyTrackId: "1BxfuPKGuaTgP7aM0Bbdwr" },
  { title: "What's Love Got to Do with It", artistName: "Tina Turner", releaseYear: 1984, isCover: false, spotifyTrackId: "2dTqqdKbXXPrx3HjFCFNKa" },
  { title: "Eye of the Tiger", artistName: "Survivor", releaseYear: 1982, isCover: false, spotifyTrackId: "2KH16WveTQWT6KOG9Rg6e2" },

  // 1990s Alternative/Grunge
  { title: "Black Hole Sun", artistName: "Soundgarden", releaseYear: 1994, isCover: false, spotifyTrackId: "4q0p2mVABqn9WQ6s0eVVvp" },
  { title: "Under the Bridge", artistName: "Red Hot Chili Peppers", releaseYear: 1991, isCover: false, spotifyTrackId: "3d9DChrdc6BOeFsbrZ3Is0" },
  { title: "Californication", artistName: "Red Hot Chili Peppers", releaseYear: 1999, isCover: false, spotifyTrackId: "48UPSzbZjgc449aqz8bxox" },
  { title: "Basket Case", artistName: "Green Day", releaseYear: 1994, isCover: false, spotifyTrackId: "1E5JHCbNMjj2Fs3kBQe0Yt" },
  { title: "No Rain", artistName: "Blind Melon", releaseYear: 1992, isCover: false, spotifyTrackId: "2Qi1IXt81GHN8RCCLhNwKN" },
  { title: "Zombie", artistName: "The Cranberries", releaseYear: 1994, isCover: false, spotifyTrackId: "7EZC6E7UjZe63f1jRmkWxt" },
  { title: "Sabotage", artistName: "Beastie Boys", releaseYear: 1994, isCover: false, spotifyTrackId: "1hAYXUbdg5hJfCZdLpS9vJ" },
  { title: "Losing My Religion", artistName: "R.E.M.", releaseYear: 1991, isCover: false, spotifyTrackId: "0fFuUN7PxyN1oPPvOjr5rO" },

  // 1990s Hip-Hop/R&B
  { title: "Gin and Juice", artistName: "Snoop Dogg", releaseYear: 1993, isCover: false, spotifyTrackId: "1hI8TNT4D8rrFEgDmSgBnQ" },
  { title: "Hypnotize", artistName: "The Notorious B.I.G.", releaseYear: 1997, isCover: false, spotifyTrackId: "7MYNdrzpZj2hpaNzfLdL2t" },
  { title: "Regulate", artistName: "Warren G & Nate Dogg", releaseYear: 1994, isCover: false, spotifyTrackId: "2l9R2EfscLUYIWZjPP0V6w" },
  { title: "No Diggity", artistName: "Blackstreet", releaseYear: 1996, isCover: false, spotifyTrackId: "52bZnHwRaQxS7OEZebTj9O" },
  { title: "Waterfalls", artistName: "TLC", releaseYear: 1994, isCover: false, spotifyTrackId: "2B0hNKBayy2lbGjqfQ0aYr" },
  { title: "No Scrubs", artistName: "TLC", releaseYear: 1999, isCover: false, spotifyTrackId: "0s7aU7eEWXDzR2DmBbCHOk" },

  // 2000s Pop
  { title: "Since U Been Gone", artistName: "Kelly Clarkson", releaseYear: 2004, isCover: false, spotifyTrackId: "2qT1uLXPVPzGgFOx4jtEuo" },
  { title: "Toxic", artistName: "Britney Spears", releaseYear: 2003, isCover: false, spotifyTrackId: "717TY4sfgX0m88Bz4WLaHw" },
  { title: "Umbrella", artistName: "Rihanna ft. Jay-Z", releaseYear: 2007, isCover: false, spotifyTrackId: "49FYlytm3dAAraYgpoJZux" },
  { title: "Irreplaceable", artistName: "Beyoncé", releaseYear: 2006, isCover: false, spotifyTrackId: "2BmD7UsEb7IvVqsHCdLksG" },
  { title: "Single Ladies (Put a Ring on It)", artistName: "Beyoncé", releaseYear: 2008, isCover: false, spotifyTrackId: "2LlQb7Uoj1kKyGhlkOcísX" },
  { title: "Beautiful", artistName: "Christina Aguilera", releaseYear: 2002, isCover: false, spotifyTrackId: "2l0A6YCKwgPXlbXRsHSnK6" },
  { title: "Poker Face", artistName: "Lady Gaga", releaseYear: 2008, isCover: false, spotifyTrackId: "3bNv3VuUOKgrf5hu3YcuRo" },
  { title: "Bad Romance", artistName: "Lady Gaga", releaseYear: 2009, isCover: false, spotifyTrackId: "0qcr5FiIjbCT0WUJTjIlqr" },

  // 2010s Pop
  { title: "Call Me Maybe", artistName: "Carly Rae Jepsen", releaseYear: 2011, isCover: false, spotifyTrackId: "20I6sIOMTCkB6w7ryavxtO" },
  { title: "Royals", artistName: "Lorde", releaseYear: 2013, isCover: false, spotifyTrackId: "2dLLR6qlu5UJ5gk0dKz0h3" },
  { title: "Happy", artistName: "Pharrell Williams", releaseYear: 2013, isCover: false, spotifyTrackId: "60nZcImufyMA1MKQY3dcCH" },
  { title: "Shake It Off", artistName: "Taylor Swift", releaseYear: 2014, isCover: false, spotifyTrackId: "0cqRj7pUJDkTCEsJkx8snD" },
  { title: "Blank Space", artistName: "Taylor Swift", releaseYear: 2014, isCover: false, spotifyTrackId: "1p80LdxRV74UKvL8gnD7ky" },
  { title: "Thinking Out Loud", artistName: "Ed Sheeran", releaseYear: 2014, isCover: false, spotifyTrackId: "2tnVG71enUj33Ic2nFN6kZ" },
  { title: "Shape of You", artistName: "Ed Sheeran", releaseYear: 2017, isCover: false, spotifyTrackId: "7qiZfU4dY1lWllzX7mPBI" },
  { title: "Cheap Thrills", artistName: "Sia", releaseYear: 2016, isCover: false, spotifyTrackId: "7LVHVU3tWfcxj5aiPFEW4Q" },
  { title: "Can't Stop the Feeling!", artistName: "Justin Timberlake", releaseYear: 2016, isCover: false, spotifyTrackId: "4ZNdK4lnVZf3VBNR2MFrFP" },

  // 2010s Hip-Hop/R&B
  { title: "Hotline Bling", artistName: "Drake", releaseYear: 2015, isCover: false, spotifyTrackId: "0wwPcA6wtMf6HUMpIRdeP7" },
  { title: "God's Plan", artistName: "Drake", releaseYear: 2018, isCover: false, spotifyTrackId: "6DCZcSspjsKoFjzjrWoCdn" },
  { title: "HUMBLE.", artistName: "Kendrick Lamar", releaseYear: 2017, isCover: false, spotifyTrackId: "7KXjTSCq5nL1LoYtL7XAwS" },
  { title: "Sicko Mode", artistName: "Travis Scott", releaseYear: 2018, isCover: false, spotifyTrackId: "2xLMifQCjDGFmkHkpNLD9h" },
  { title: "Congratulations", artistName: "Post Malone ft. Quavo", releaseYear: 2016, isCover: false, spotifyTrackId: "3a1lNhkSLSkpJE4MSHpDu9" },
  { title: "Rockstar", artistName: "Post Malone ft. 21 Savage", releaseYear: 2017, isCover: false, spotifyTrackId: "0e7ipj03S05BNilyu5bRzt" },
  { title: "XO Tour Llif3", artistName: "Lil Uzi Vert", releaseYear: 2017, isCover: false, spotifyTrackId: "7GX5flRQZVHRAGd6B4TmDO" },
  { title: "Mask Off", artistName: "Future", releaseYear: 2017, isCover: false, spotifyTrackId: "0VgkVdmE4gld66l8iyGjgx" },

  // 2020s Current Hits
  { title: "drivers license", artistName: "Olivia Rodrigo", releaseYear: 2021, isCover: false, spotifyTrackId: "5wANPM4fQCJwkGd4rN57mH" },
  { title: "Peaches", artistName: "Justin Bieber ft. Daniel Caesar", releaseYear: 2021, isCover: false, spotifyTrackId: "4iJyoBOLtHqaGxP12qzhQI" },
  { title: "Save Your Tears", artistName: "The Weeknd", releaseYear: 2020, isCover: false, spotifyTrackId: "5QO79kh1waicV47BqGRL3g" },
  { title: "Starboy", artistName: "The Weeknd ft. Daft Punk", releaseYear: 2016, isCover: false, spotifyTrackId: "7MXVkk9YMctZqd1Srtv4MB" },
  { title: "Dynamite", artistName: "BTS", releaseYear: 2020, isCover: false, spotifyTrackId: "0t1kP63rueHleOhQkYSXFY" },
  { title: "Butter", artistName: "BTS", releaseYear: 2021, isCover: false, spotifyTrackId: "1mWdTewIgB3gtBM3TOSFhB" },
  { title: "Mood", artistName: "24kGoldn ft. iann dior", releaseYear: 2020, isCover: false, spotifyTrackId: "3tjFYV6RSFtuktYl3ZtYcq" },
  { title: "positions", artistName: "Ariana Grande", releaseYear: 2020, isCover: false, spotifyTrackId: "35mvY5S1H3J2QZyna3TFe0" },
  { title: "34+35", artistName: "Ariana Grande", releaseYear: 2020, isCover: false, spotifyTrackId: "6Im9k8u9iIzKMrmV7BWtlF" },

  // Country Crossover
  { title: "Before He Cheats", artistName: "Carrie Underwood", releaseYear: 2005, isCover: false, spotifyTrackId: "0NfSaK07j1PdmTKZ9L1zTJ" },
  { title: "Need You Now", artistName: "Lady A", releaseYear: 2009, isCover: false, spotifyTrackId: "7qiZfU4dY1lWllzX7mPBI9" },
  { title: "Jolene", artistName: "Dolly Parton", releaseYear: 1973, isCover: false, spotifyTrackId: "2qZdcCTw9v3b0RrDDLdGK7" },
  { title: "Old Town Road", artistName: "Lil Nas X ft. Billy Ray Cyrus", releaseYear: 2019, isCover: false, spotifyTrackId: "2YpeDb67231RjR0MgVLzsG" },
  { title: "The Gambler", artistName: "Kenny Rogers", releaseYear: 1978, isCover: false, spotifyTrackId: "6LjfkZSkZSGZXfHSJkB7T5" },

  // Latin/Reggaeton
  { title: "Despacito", artistName: "Luis Fonsi & Daddy Yankee", releaseYear: 2017, isCover: false, spotifyTrackId: "6habFhsOp2NvshLv26DqMb" },
  { title: "Bailando", artistName: "Enrique Iglesias", releaseYear: 2014, isCover: false, spotifyTrackId: "3yzt0BXAU7XsW5WY2E5TOg" },
  { title: "Danza Kuduro", artistName: "Don Omar & Lucenzo", releaseYear: 2010, isCover: false, spotifyTrackId: "0z6gn7MhG6XMNfCxk8PpDe" },
  { title: "La Bamba", artistName: "Ritchie Valens", releaseYear: 1958, isCover: false, spotifyTrackId: "6kDy38yb5tFCojm9NZGJQP" },

  // Electronic/EDM
  { title: "Levels", artistName: "Avicii", releaseYear: 2011, isCover: false, spotifyTrackId: "3v6SQRM6z0E8KRKdXjzP2e" },
  { title: "Don't You Worry Child", artistName: "Swedish House Mafia", releaseYear: 2012, isCover: false, spotifyTrackId: "3LNAdyHj9bEKpT2kkjJDlY" },
  { title: "Strobe", artistName: "deadmau5", releaseYear: 2009, isCover: false, spotifyTrackId: "2Msmzyyx5kKMwUC9aOz9OQ" },
  { title: "Scary Monsters and Nice Sprites", artistName: "Skrillex", releaseYear: 2010, isCover: false, spotifyTrackId: "6VdcOJ0VtFRPLRJWgooR1O" },
  { title: "Sandstorm", artistName: "Darude", releaseYear: 1999, isCover: false, spotifyTrackId: "6Sy9BUbgFse0n0LPA5lwy5" },
  { title: "One More Time", artistName: "Daft Punk", releaseYear: 2000, isCover: false, spotifyTrackId: "0DiWol3AO6WpXZgp0goxAV" },
  { title: "Around the World", artistName: "Daft Punk", releaseYear: 1997, isCover: false, spotifyTrackId: "1pKYYY0dkg23sQQXi0Q5zN" },

  // Rock 2000s+
  { title: "Viva La Vida", artistName: "Coldplay", releaseYear: 2008, isCover: false, spotifyTrackId: "1mea3bSkSGXuIRvnydlB5b" },
  { title: "Yellow", artistName: "Coldplay", releaseYear: 2000, isCover: false, spotifyTrackId: "3AJwUDP919kvQ9QcozQPxg" },
  { title: "Fix You", artistName: "Coldplay", releaseYear: 2005, isCover: false, spotifyTrackId: "7LVHVU3tWfcxj5aiPFEW4T" },
  { title: "Use Somebody", artistName: "Kings of Leon", releaseYear: 2008, isCover: false, spotifyTrackId: "3gdewACMIVMEWVbyb8O9sY" },
  { title: "Sex on Fire", artistName: "Kings of Leon", releaseYear: 2008, isCover: false, spotifyTrackId: "2T3U1BibkYoOIRvXSCFYvl" },
  { title: "I Will Wait", artistName: "Mumford & Sons", releaseYear: 2012, isCover: false, spotifyTrackId: "1w9ZTuTn9PulZIg0s3D27B" },
  { title: "Little Lion Man", artistName: "Mumford & Sons", releaseYear: 2009, isCover: false, spotifyTrackId: "2K9mYKl4vDWvbGLHxXXL6Y" },
  { title: "Riptide", artistName: "Vance Joy", releaseYear: 2013, isCover: false, spotifyTrackId: "6DDLOZr8IrMaGwgmIEVi1q" },

  // Soul/Funk Classics
  { title: "Lean On Me", artistName: "Bill Withers", releaseYear: 1972, isCover: false, spotifyTrackId: "3RiPr603aXAoi4GHyXx0uy" },
  { title: "Ain't No Sunshine", artistName: "Bill Withers", releaseYear: 1971, isCover: false, spotifyTrackId: "3l2PRgIyXMyl1n3s45EBfD" },
  { title: "What's Going On", artistName: "Marvin Gaye", releaseYear: 1971, isCover: false, spotifyTrackId: "7oK9VyNzrYvRFo7nQEYkWN" },
  { title: "Let's Stay Together", artistName: "Al Green", releaseYear: 1971, isCover: false, spotifyTrackId: "7k4t5cF0WyNSw0aT5PYQbt" },
  { title: "I Heard It Through the Grapevine", artistName: "Marvin Gaye", releaseYear: 1968, isCover: false, spotifyTrackId: "4Yxv4g44ahzE3nYyHNXwBo" },

  // More Recent Covers
  { title: "Take Me to Church", artistName: "Hozier", releaseYear: 2013, isCover: false, spotifyTrackId: "1CS7Sd1u5tWkstBhpssyjP" },
  { title: "Stitches", artistName: "Shawn Mendes", releaseYear: 2015, isCover: false, spotifyTrackId: "1fQ0shqm4HQW1BL3fmjqz7" },
  { title: "Treat You Better", artistName: "Shawn Mendes", releaseYear: 2016, isCover: false, spotifyTrackId: "3QGsuHI8jO1Rx4JWLUh9jd" },
  { title: "Stitches", artistName: "Shawn Mendes", releaseYear: 2015, isCover: false, spotifyTrackId: "1fQ0shqm4HQW1BL3fmjqz7" },
  { title: "Attention", artistName: "Charlie Puth", releaseYear: 2017, isCover: false, spotifyTrackId: "5cF0dROlMOK5uNZtivgu50" },
  { title: "See You Again", artistName: "Wiz Khalifa ft. Charlie Puth", releaseYear: 2015, isCover: false, spotifyTrackId: "2JzZzZUQj3Qff7wapcbKjc" },

  // More 2020s
  { title: "Shivers", artistName: "Ed Sheeran", releaseYear: 2021, isCover: false, spotifyTrackId: "50nfwKoDiSYg8zOCREWAm5" },
  { title: "Easy On Me", artistName: "Adele", releaseYear: 2021, isCover: false, spotifyTrackId: "46IZ0fSY2mpAiktS3KOqds" },
  { title: "abcdefu", artistName: "GAYLE", releaseYear: 2021, isCover: false, spotifyTrackId: "7eBqSVxrzQZtK2mmgRG6lC" },
  { title: "We Don't Talk About Bruno", artistName: "Encanto Cast", releaseYear: 2021, isCover: false, spotifyTrackId: "4HxrxNCVkmAmH9T2T01tlc" },
  { title: "Surface Pressure", artistName: "Jessica Darrow", releaseYear: 2021, isCover: false, spotifyTrackId: "67cECJtqKDpCxXPpLg5vBu" },
  { title: "Stay", artistName: "The Kid LAROI & Justin Bieber", releaseYear: 2021, isCover: false, spotifyTrackId: "5PjdY0CKGZdEuoNab3yDmX" },
  { title: "Ghost", artistName: "Justin Bieber", releaseYear: 2021, isCover: false, spotifyTrackId: "6I3mqTwhRpn34SLVafSH6G" },
  { title: "Enemy", artistName: "Imagine Dragons x JID", releaseYear: 2021, isCover: false, spotifyTrackId: "5K3NHsL7FLo3qZLlcvCdPg" },
  { title: "The Nights", artistName: "Avicii", releaseYear: 2014, isCover: false, spotifyTrackId: "0ct6r3EGTcMLPtrxHDQhHb" },

  // Metal/Hard Rock
  { title: "Enter Sandman", artistName: "Metallica", releaseYear: 1991, isCover: false, spotifyTrackId: "1hKdDCpiI9mqz1jVHRKG0E" },
  { title: "Master of Puppets", artistName: "Metallica", releaseYear: 1986, isCover: false, spotifyTrackId: "1JjYk1ZPZGBPTU53fNNmVP" },
  { title: "Back in Black", artistName: "AC/DC", releaseYear: 1980, isCover: false, spotifyTrackId: "08mG3Y1vljYA6bvDt4Wqkj" },
  { title: "Highway to Hell", artistName: "AC/DC", releaseYear: 1979, isCover: false, spotifyTrackId: "2zYzyRzz6pRmhPzyfMEC8s" },
  { title: "Thunderstruck", artistName: "AC/DC", releaseYear: 1990, isCover: false, spotifyTrackId: "57bgtoPSgt236HzfBOd8kj" },
  { title: "Crazy Train", artistName: "Ozzy Osbourne", releaseYear: 1980, isCover: false, spotifyTrackId: "4jnPFz83g0yUfYG0IzVmx2" },

  // Jazz Standards
  { title: "What a Wonderful World", artistName: "Louis Armstrong", releaseYear: 1967, isCover: false, spotifyTrackId: "2rSBtReJhjC9P0TYYRErXp" },
  { title: "Fly Me to the Moon", artistName: "Frank Sinatra", releaseYear: 1964, isCover: false, spotifyTrackId: "5b7OlIhjqCIscqrSYy6UNk" },
  { title: "My Way", artistName: "Frank Sinatra", releaseYear: 1969, isCover: false, spotifyTrackId: "3spdoTYpuCpmq19tuD0bOe" },
  { title: "Feeling Good", artistName: "Nina Simone", releaseYear: 1965, isCover: false, spotifyTrackId: "1GZtDlHPvfBfFnEgkTfzym" },
];

async function main() {
  console.log('🎵 Adding 200+ new songs to database...\n');

  let added = 0;
  let skipped = 0;

  for (const songData of newSongs) {
    // Check if song already exists
    const existing = await prisma.song.findFirst({
      where: {
        title: songData.title,
        artistName: songData.artistName,
      },
    });

    if (existing) {
      console.log(`⏭️  Skipped (exists): ${songData.title} - ${songData.artistName}`);
      skipped++;
      continue;
    }

    // Create song and market state
    const song = await prisma.song.create({
      data: songData,
    });

    await prisma.marketState.create({
      data: {
        songId: song.id,
        price: 1.00,
        change24hPct: 0,
        volume24h: 0,
        traders24h: 0,
        tags: [],
      },
    });

    console.log(`✓ Added: ${songData.title} - ${songData.artistName}`);
    added++;
  }

  console.log(`\n✅ Done!`);
  console.log(`   Added: ${added} songs`);
  console.log(`   Skipped: ${skipped} songs (already exist)`);
  console.log(`\n📊 Total songs in database: ${added + skipped + await prisma.song.count() - added}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
