import { User, Listing, Event } from '../types';

export const currentUser: User = {
  id: 'current-user',
  name: 'You',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
  joinedDate: '2024-01-15',
  trustScore: 4.8,
  completedTrades: 23,
  bio: 'Concert enthusiast and sports fan. Always looking for good deals on tickets!',
  location: 'Los Angeles, CA',
  favoriteGenres: ['Music', 'Sports'],
  badges: ['Verified', 'Quick Responder'],
  responseTime: '< 1 hour',
  verifiedUser: true,
};

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    joinedDate: '2023-11-20',
    trustScore: 4.9,
    completedTrades: 47,
    bio: 'Theater lover and Broadway regular. I love trading tickets to see as many shows as possible! Always fair and honest in my trades.',
    location: 'New York, NY',
    favoriteGenres: ['Theater', 'Music'],
    badges: ['Verified', 'Top Trader', 'Quick Responder'],
    responseTime: '< 30 min',
    verifiedUser: true,
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop',
    joinedDate: '2024-02-10',
    trustScore: 4.7,
    completedTrades: 31,
    bio: 'Die-hard sports fan! Follow all the major leagues. Looking to trade tickets for games I can\'t attend. Lakers, Dodgers, Rams fan!',
    location: 'Los Angeles, CA',
    favoriteGenres: ['Sports'],
    badges: ['Verified'],
    responseTime: '< 2 hours',
    verifiedUser: true,
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    joinedDate: '2023-09-05',
    trustScore: 5.0,
    completedTrades: 62,
    bio: 'Music festival junkie and concert photographer. I attend 50+ shows a year! Love discovering new artists and helping fellow music lovers get great seats.',
    location: 'Austin, TX',
    favoriteGenres: ['Music', 'Festival'],
    badges: ['Verified', 'Top Trader', 'Power User', 'Quick Responder'],
    responseTime: '< 15 min',
    verifiedUser: true,
  },
  {
    id: '4',
    name: 'Alex Park',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    joinedDate: '2024-03-12',
    trustScore: 4.6,
    completedTrades: 18,
    bio: 'New to ticket trading but loving it! Big fan of live events - sports, concerts, comedy shows. Open to all trades!',
    location: 'Chicago, IL',
    favoriteGenres: ['Sports', 'Music', 'Comedy'],
    badges: ['Verified'],
    responseTime: '< 3 hours',
    verifiedUser: true,
  },
];

export const mockEvents: Event[] = [
  // Taylor Swift - Multiple Cities
  { id: 'ts1', name: 'Taylor Swift | The Eras Tour', date: '2024-12-15', venue: 'SoFi Stadium', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 156 },
  { id: 'ts2', name: 'Taylor Swift | The Eras Tour', date: '2024-12-18', venue: 'MetLife Stadium', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 189 },
  { id: 'ts3', name: 'Taylor Swift | The Eras Tour', date: '2024-12-22', venue: 'Soldier Field', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 142 },
  { id: 'ts4', name: 'Taylor Swift | The Eras Tour', date: '2024-12-28', venue: 'AT&T Stadium', location: 'Dallas, TX', city: 'Dallas', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 134 },
  { id: 'ts5', name: 'Taylor Swift | The Eras Tour', date: '2025-01-03', venue: 'Lincoln Financial Field', location: 'Philadelphia, PA', city: 'Philadelphia', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 127 },

  // Drake - Multiple Cities
  { id: 'drake1', name: 'Drake - It\'s All a Blur Tour', date: '2024-12-16', venue: 'Mercedes-Benz Stadium', location: 'Atlanta, GA', city: 'Atlanta', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop', category: 'Music', activeListings: 142 },
  { id: 'drake2', name: 'Drake - It\'s All a Blur Tour', date: '2024-12-20', venue: 'TD Garden', location: 'Boston, MA', city: 'Boston', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop', category: 'Music', activeListings: 98 },
  { id: 'drake3', name: 'Drake - It\'s All a Blur Tour', date: '2024-12-27', venue: 'Scotiabank Arena', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop', category: 'Music', activeListings: 156 },

  // Beyoncé - Multiple Cities
  { id: 'bey1', name: 'Beyoncé - Renaissance World Tour', date: '2024-12-14', venue: 'NRG Stadium', location: 'Houston, TX', city: 'Houston', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 203 },
  { id: 'bey2', name: 'Beyoncé - Renaissance World Tour', date: '2024-12-19', venue: 'State Farm Arena', location: 'Phoenix, AZ', city: 'Phoenix', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 167 },
  { id: 'bey3', name: 'Beyoncé - Renaissance World Tour', date: '2024-12-26', venue: 'Allegiant Stadium', location: 'Las Vegas, NV', city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 198 },

  // Ed Sheeran - Multiple Cities
  { id: 'ed1', name: 'Ed Sheeran - Mathematics Tour', date: '2024-12-31', venue: 'Climate Pledge Arena', location: 'Seattle, WA', city: 'Seattle', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 95 },
  { id: 'ed2', name: 'Ed Sheeran - Mathematics Tour', date: '2025-01-05', venue: 'Ball Arena', location: 'Denver, CO', city: 'Denver', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 78 },
  { id: 'ed3', name: 'Ed Sheeran - Mathematics Tour', date: '2025-01-10', venue: 'Moda Center', location: 'Portland, OR', city: 'Portland', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 82 },

  // Coldplay - Multiple Cities
  { id: 'cold1', name: 'Coldplay - Music of the Spheres', date: '2024-12-29', venue: 'Levi\'s Stadium', location: 'San Francisco, CA', city: 'San Francisco', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 124 },
  { id: 'cold2', name: 'Coldplay - Music of the Spheres', date: '2025-01-02', venue: 'Petco Park', location: 'San Diego, CA', city: 'San Diego', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 101 },
  { id: 'cold3', name: 'Coldplay - Music of the Spheres', date: '2025-01-08', venue: 'Soldier Field', location: 'Indianapolis, IN', city: 'Indianapolis', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 89 },

  // The Weeknd
  { id: 'week1', name: 'The Weeknd - After Hours Tour', date: '2024-12-28', venue: 'United Center', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 73 },
  { id: 'week2', name: 'The Weeknd - After Hours Tour', date: '2025-01-04', venue: 'Little Caesars Arena', location: 'Detroit, MI', city: 'Detroit', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 65 },

  // NBA Games - Multiple Cities
  { id: 'nba1', name: 'NBA Finals - Game 3', date: '2024-12-20', venue: 'Madison Square Garden', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 89 },
  { id: 'nba2', name: 'Lakers vs Warriors', date: '2024-12-25', venue: 'Crypto.com Arena', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop', category: 'Sports', activeListings: 92 },
  { id: 'nba3', name: 'Chicago Bulls vs Miami Heat', date: '2024-12-18', venue: 'United Center', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 54 },
  { id: 'nba4', name: 'Houston Rockets vs Lakers', date: '2024-12-21', venue: 'Toyota Center', location: 'Houston, TX', city: 'Houston', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 42 },
  { id: 'nba5', name: 'Miami Heat vs Celtics', date: '2024-12-24', venue: 'FTX Arena', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 61 },
  { id: 'nba6', name: 'Boston Celtics vs Lakers', date: '2024-12-19', venue: 'TD Garden', location: 'Boston, MA', city: 'Boston', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 77 },
  { id: 'nba7', name: 'Golden State Warriors vs Suns', date: '2024-12-26', venue: 'Chase Center', location: 'San Francisco, CA', city: 'San Francisco', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 83 },
  { id: 'nba8', name: 'Atlanta Hawks vs Knicks', date: '2024-12-17', venue: 'State Farm Arena', location: 'Atlanta, GA', city: 'Atlanta', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 48 },
  { id: 'nba9', name: 'Phoenix Suns vs Nuggets', date: '2024-12-23', venue: 'Footprint Center', location: 'Phoenix, AZ', city: 'Phoenix', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 56 },
  { id: 'nba10', name: 'Dallas Mavericks vs Clippers', date: '2024-12-27', venue: 'American Airlines Center', location: 'Dallas, TX', city: 'Dallas', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 49 },
  { id: 'nba11', name: 'Philadelphia 76ers vs Heat', date: '2024-12-30', venue: 'Wells Fargo Center', location: 'Philadelphia, PA', city: 'Philadelphia', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 52 },
  { id: 'nba12', name: 'Denver Nuggets vs Lakers', date: '2025-01-02', venue: 'Ball Arena', location: 'Denver, CO', city: 'Denver', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 68 },

  // Broadway/Theater - Multiple Cities
  { id: 'ham1', name: 'Hamilton', date: '2024-12-08', venue: 'Richard Rodgers Theatre', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=400&fit=crop', category: 'Theater', activeListings: 34 },
  { id: 'ham2', name: 'Hamilton', date: '2024-12-15', venue: 'Orpheum Theatre', location: 'San Francisco, CA', city: 'San Francisco', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=400&fit=crop', category: 'Theater', activeListings: 28 },
  { id: 'lion1', name: 'The Lion King', date: '2024-12-12', venue: 'Pantages Theatre', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=400&fit=crop', category: 'Theater', activeListings: 28 },
  { id: 'chic1', name: 'Chicago - The Musical', date: '2024-12-10', venue: 'Cadillac Palace Theatre', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=400&fit=crop', category: 'Theater', activeListings: 31 },
  { id: 'cirq1', name: 'Cirque du Soleil - O', date: '2024-12-11', venue: 'Bellagio', location: 'Las Vegas, NV', city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=400&fit=crop', category: 'Theater', activeListings: 52 },

  // Country Music
  { id: 'luke1', name: 'Luke Combs - World Tour', date: '2024-12-13', venue: 'Nissan Stadium', location: 'Nashville, TN', city: 'Nashville', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 87 },
  { id: 'luke2', name: 'Luke Combs - World Tour', date: '2024-12-20', venue: 'Bridgestone Arena', location: 'Charlotte, NC', city: 'Charlotte', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 72 },

  // Latin Music
  { id: 'bad1', name: 'Bad Bunny - Most Wanted Tour', date: '2024-12-27', venue: 'NRG Stadium', location: 'Houston, TX', city: 'Houston', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 98 },
  { id: 'bad2', name: 'Bad Bunny - Most Wanted Tour', date: '2025-01-03', venue: 'Hard Rock Stadium', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 145 },
  { id: 'bad3', name: 'Bad Bunny - Most Wanted Tour', date: '2025-01-10', venue: 'SoFi Stadium', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 178 },

  // Adele
  { id: 'adele1', name: 'Adele - Weekends with Adele', date: '2024-12-21', venue: 'The Colosseum at Caesars Palace', location: 'Las Vegas, NV', city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 118 },

  // NFL Games
  { id: 'nfl1', name: 'Seattle Seahawks vs 49ers', date: '2024-12-23', venue: 'Lumen Field', location: 'Seattle, WA', city: 'Seattle', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 56 },
  { id: 'nfl2', name: 'Dallas Cowboys vs Eagles', date: '2024-12-29', venue: 'AT&T Stadium', location: 'Dallas, TX', city: 'Dallas', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 73 },

  // NHL Games
  { id: 'nhl1', name: 'New York Rangers vs Boston Bruins', date: '2024-12-22', venue: 'Madison Square Garden', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 45 },
  { id: 'nhl2', name: 'Nashville Predators vs Blues', date: '2024-12-20', venue: 'Bridgestone Arena', location: 'Nashville, TN', city: 'Nashville', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 39 },

  // Additional Events for Other Cities
  { id: 'billy1', name: 'Billy Joel at MSG', date: '2024-12-30', venue: 'Madison Square Garden', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 67 },
  { id: 'bso1', name: 'Boston Symphony Orchestra', date: '2024-12-14', venue: 'Symphony Hall', location: 'Boston, MA', city: 'Boston', image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=400&fit=crop', category: 'Music', activeListings: 23 },
  { id: 'ultra1', name: 'Ultra Music Festival', date: '2025-03-28', venue: 'Bayfront Park', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=400&fit=crop', category: 'Music', activeListings: 234 },

  // San Antonio
  { id: 'sa1', name: 'San Antonio Spurs vs Lakers', date: '2024-12-28', venue: 'AT&T Center', location: 'San Antonio, TX', city: 'San Antonio', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 41 },
  { id: 'sa2', name: 'George Strait Concert', date: '2025-01-12', venue: 'Alamodome', location: 'San Antonio, TX', city: 'San Antonio', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 95 },

  // San Jose
  { id: 'sj1', name: 'San Jose Sharks vs Avalanche', date: '2024-12-16', venue: 'SAP Center', location: 'San Jose, CA', city: 'San Jose', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 38 },
  { id: 'sj2', name: 'Shakira - Las Mujeres Ya No Lloran Tour', date: '2024-12-21', venue: 'SAP Center', location: 'San Jose, CA', city: 'San Jose', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 86 },

  // Austin
  { id: 'aus1', name: 'Austin City Limits Music Festival', date: '2025-03-15', venue: 'Zilker Park', location: 'Austin, TX', city: 'Austin', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=400&fit=crop', category: 'Music', activeListings: 189 },
  { id: 'aus2', name: 'UT Longhorns Football', date: '2024-12-18', venue: 'Darrell K Royal Stadium', location: 'Austin, TX', city: 'Austin', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 67 },

  // Jacksonville
  { id: 'jax1', name: 'Jacksonville Jaguars vs Colts', date: '2024-12-22', venue: 'TIAA Bank Field', location: 'Jacksonville, FL', city: 'Jacksonville', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 43 },

  // Fort Worth
  { id: 'fw1', name: 'Fort Worth Stock Show Rodeo', date: '2025-01-25', venue: 'Dickies Arena', location: 'Fort Worth, TX', city: 'Fort Worth', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 52 },

  // Columbus
  { id: 'col1', name: 'Columbus Blue Jackets vs Penguins', date: '2024-12-19', venue: 'Nationwide Arena', location: 'Columbus, OH', city: 'Columbus', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 36 },
  { id: 'col2', name: 'Imagine Dragons - Loom Tour', date: '2024-12-27', venue: 'Nationwide Arena', location: 'Columbus, OH', city: 'Columbus', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 74 },

  // Indianapolis
  { id: 'ind1', name: 'Indiana Pacers vs Bulls', date: '2024-12-17', venue: 'Gainbridge Fieldhouse', location: 'Indianapolis, IN', city: 'Indianapolis', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 39 },

  // Charlotte
  { id: 'char1', name: 'Charlotte Hornets vs Knicks', date: '2024-12-23', venue: 'Spectrum Center', location: 'Charlotte, NC', city: 'Charlotte', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 44 },

  // Oklahoma City
  { id: 'okc1', name: 'Oklahoma City Thunder vs Mavericks', date: '2024-12-26', venue: 'Paycom Center', location: 'Oklahoma City, OK', city: 'Oklahoma City', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 51 },

  // Memphis
  { id: 'mem1', name: 'Memphis Grizzlies vs Suns', date: '2024-12-24', venue: 'FedExForum', location: 'Memphis, TN', city: 'Memphis', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 37 },

  // Louisville
  { id: 'lou1', name: 'Louisville Cardinals Basketball', date: '2024-12-20', venue: 'KFC Yum! Center', location: 'Louisville, KY', city: 'Louisville', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 48 },

  // Baltimore
  { id: 'bal1', name: 'Baltimore Ravens vs Steelers', date: '2024-12-21', venue: 'M&T Bank Stadium', location: 'Baltimore, MD', city: 'Baltimore', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 65 },

  // Milwaukee
  { id: 'mil1', name: 'Milwaukee Bucks vs Heat', date: '2024-12-18', venue: 'Fiserv Forum', location: 'Milwaukee, WI', city: 'Milwaukee', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 53 },

  // Albuquerque
  { id: 'abq1', name: 'New Mexico Lobos Basketball', date: '2024-12-19', venue: 'The Pit', location: 'Albuquerque, NM', city: 'Albuquerque', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 31 },

  // Tucson
  { id: 'tuc1', name: 'Arizona Wildcats Basketball', date: '2024-12-22', venue: 'McKale Center', location: 'Tucson, AZ', city: 'Tucson', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 42 },

  // Fresno
  { id: 'fre1', name: 'Fresno State Football', date: '2024-12-16', venue: 'Bulldog Stadium', location: 'Fresno, CA', city: 'Fresno', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 29 },

  // Mesa
  { id: 'mes1', name: 'Spring Training Baseball', date: '2025-02-22', venue: 'Sloan Park', location: 'Mesa, AZ', city: 'Mesa', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 38 },

  // Sacramento
  { id: 'sac1', name: 'Sacramento Kings vs Warriors', date: '2024-12-28', venue: 'Golden 1 Center', location: 'Sacramento, CA', city: 'Sacramento', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 58 },

  // Kansas City
  { id: 'kc1', name: 'Kansas City Chiefs vs Broncos', date: '2024-12-25', venue: 'Arrowhead Stadium', location: 'Kansas City, MO', city: 'Kansas City', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 89 },

  // Colorado Springs
  { id: 'cs1', name: 'Air Force Academy Football', date: '2024-12-14', venue: 'Falcon Stadium', location: 'Colorado Springs, CO', city: 'Colorado Springs', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 35 },

  // Raleigh
  { id: 'ral1', name: 'Carolina Hurricanes vs Rangers', date: '2024-12-17', venue: 'PNC Arena', location: 'Raleigh, NC', city: 'Raleigh', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 46 },

  // Omaha
  { id: 'oma1', name: 'Creighton Bluejays Basketball', date: '2024-12-21', venue: 'CHI Health Center', location: 'Omaha, NE', city: 'Omaha', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 33 },

  // Long Beach
  { id: 'lb1', name: 'Snoop Dogg Concert', date: '2024-12-29', venue: 'The Queen Mary', location: 'Long Beach, CA', city: 'Long Beach', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 71 },

  // Virginia Beach
  { id: 'vb1', name: 'Pharrell Williams Concert', date: '2025-01-15', venue: 'Veterans United Home Loans Amphitheater', location: 'Virginia Beach, VA', city: 'Virginia Beach', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 64 },

  // Oakland
  { id: 'oak1', name: 'Oakland Roots Soccer', date: '2025-03-08', venue: 'Oakland Arena', location: 'Oakland, CA', city: 'Oakland', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 27 },

  // Minneapolis
  { id: 'min1', name: 'Minnesota Timberwolves vs Lakers', date: '2024-12-23', venue: 'Target Center', location: 'Minneapolis, MN', city: 'Minneapolis', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 59 },

  // Tulsa
  { id: 'tul1', name: 'Tulsa Golden Hurricane Basketball', date: '2024-12-18', venue: 'Reynolds Center', location: 'Tulsa, OK', city: 'Tulsa', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 24 },

  // Tampa
  { id: 'tam1', name: 'Tampa Bay Buccaneers vs Saints', date: '2024-12-29', venue: 'Raymond James Stadium', location: 'Tampa, FL', city: 'Tampa', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 71 },

  // Arlington
  { id: 'arl1', name: 'Texas Rangers Baseball', date: '2025-04-01', venue: 'Globe Life Field', location: 'Arlington, TX', city: 'Arlington', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 54 },

  // New Orleans
  { id: 'no1', name: 'New Orleans Pelicans vs Lakers', date: '2024-12-26', venue: 'Smoothie King Center', location: 'New Orleans, LA', city: 'New Orleans', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 47 },
  { id: 'no2', name: 'Jazz Fest Preview', date: '2025-04-25', venue: 'Fair Grounds', location: 'New Orleans, LA', city: 'New Orleans', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=400&fit=crop', category: 'Music', activeListings: 156 },

  // Cleveland
  { id: 'cle1', name: 'Cleveland Cavaliers vs Bulls', date: '2024-12-24', venue: 'Rocket Mortgage FieldHouse', location: 'Cleveland, OH', city: 'Cleveland', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 51 },

  // Pittsburgh
  { id: 'pit1', name: 'Pittsburgh Penguins vs Capitals', date: '2024-12-27', venue: 'PPG Paints Arena', location: 'Pittsburgh, PA', city: 'Pittsburgh', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 55 },

  // Cincinnati
  { id: 'cin1', name: 'Cincinnati Bengals vs Browns', date: '2024-12-31', venue: 'Paycor Stadium', location: 'Cincinnati, OH', city: 'Cincinnati', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 62 },

  // Orlando
  { id: 'orl1', name: 'Orlando Magic vs Hawks', date: '2024-12-19', venue: 'Amway Center', location: 'Orlando, FL', city: 'Orlando', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 43 },
  { id: 'orl2', name: 'Disney on Ice', date: '2024-12-26', venue: 'Amway Center', location: 'Orlando, FL', city: 'Orlando', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=400&fit=crop', category: 'Theater', activeListings: 78 },

  // St. Louis
  { id: 'stl1', name: 'St. Louis Blues vs Blackhawks', date: '2024-12-28', venue: 'Enterprise Center', location: 'St. Louis, MO', city: 'St. Louis', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 48 },

  // Salt Lake City
  { id: 'slc1', name: 'Utah Jazz vs Clippers', date: '2024-12-30', venue: 'Delta Center', location: 'Salt Lake City, UT', city: 'Salt Lake City', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 52 },

  // Richmond
  { id: 'ric1', name: 'VCU Rams Basketball', date: '2024-12-20', venue: 'Siegel Center', location: 'Richmond, VA', city: 'Richmond', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 31 },

  // Buffalo
  { id: 'buf1', name: 'Buffalo Bills vs Patriots', date: '2024-12-22', venue: 'Highmark Stadium', location: 'Buffalo, NY', city: 'Buffalo', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 76 },
  { id: 'buf2', name: 'Buffalo Sabres vs Maple Leafs', date: '2024-12-27', venue: 'KeyBank Center', location: 'Buffalo, NY', city: 'Buffalo', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 49 },

  // Washington DC
  { id: 'dc1', name: 'Washington Wizards vs Celtics', date: '2024-12-21', venue: 'Capital One Arena', location: 'Washington, DC', city: 'Washington', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 63 },
  { id: 'dc2', name: 'National Symphony Orchestra', date: '2024-12-24', venue: 'Kennedy Center', location: 'Washington, DC', city: 'Washington', image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=400&fit=crop', category: 'Music', activeListings: 34 },
];

export const mockListings: Listing[] = [
  {
    id: '1',
    type: 'offer',
    userId: '1',
    user: mockUsers[0],
    eventId: 'ts1',
    eventName: 'Taylor Swift | The Eras Tour',
    eventDate: '2024-12-15',
    eventVenue: 'SoFi Stadium',
    eventImage: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop',
    ticketCount: 2,
    sectionInfo: 'Section 104, Row 15',
    description: 'Selling 2 tickets for $800 each. Can no longer attend due to work conflict. Tickets will transfer via Ticketmaster.',
    lookingFor: '$1600 total - accepting PayPal or Venmo',
    createdAt: '2024-11-20T14:30:00Z',
    status: 'active',
  },
  {
    id: '2',
    type: 'request',
    userId: '2',
    user: mockUsers[1],
    eventId: 'nba1',
    eventName: 'NBA Finals - Game 3',
    eventDate: '2024-12-20',
    eventVenue: 'Madison Square Garden',
    eventImage: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop',
    ticketCount: 2,
    description: 'Desperate Knicks fan looking for 2 tickets! Have Taylor Swift or Beyoncé tickets to trade.',
    lookingFor: 'Any 2 tickets together, willing to trade premium concert tickets',
    createdAt: '2024-11-21T09:15:00Z',
    status: 'active',
  },
  {
    id: '3',
    type: 'offer',
    userId: '3',
    user: mockUsers[2],
    eventId: 'ham1',
    eventName: 'Hamilton',
    eventDate: '2024-12-08',
    eventVenue: 'Richard Rodgers Theatre',
    eventImage: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=400&fit=crop',
    ticketCount: 4,
    sectionInfo: 'Orchestra, Row K',
    description: 'Have 4 tickets but can only use 2. Happy to split or trade 2 for other Broadway shows.',
    lookingFor: 'Other Broadway shows or partial trade',
    createdAt: '2024-11-21T16:45:00Z',
    status: 'active',
  },
  {
    id: '4',
    type: 'request',
    userId: '4',
    user: mockUsers[3],
    eventId: 'bey1',
    eventName: 'Beyoncé - Renaissance World Tour',
    eventDate: '2024-12-14',
    eventVenue: 'NRG Stadium',
    eventImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop',
    ticketCount: 3,
    description: 'Last-minute birthday surprise for my wife! Paying up to $1500 total. Need them ASAP!',
    lookingFor: '3 tickets anywhere in the stadium - cash ready',
    createdAt: '2024-11-22T10:20:00Z',
    status: 'active',
  },
  {
    id: '5',
    type: 'offer',
    userId: '1',
    user: mockUsers[0],
    eventId: 'bey2',
    eventName: 'Beyoncé - Renaissance World Tour',
    eventDate: '2024-12-19',
    eventVenue: 'State Farm Arena',
    eventImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop',
    ticketCount: 2,
    sectionInfo: 'Section 211, Row 8',
    description: 'Friend backed out. Asking $600 per ticket. These are great seats!',
    lookingFor: '$1200 total via Zelle or cash',
    createdAt: '2024-11-19T11:30:00Z',
    status: 'active',
  },
  {
    id: '6',
    type: 'offer',
    userId: '2',
    user: mockUsers[1],
    eventId: 'drake1',
    eventName: 'Drake - It\'s All a Blur Tour',
    eventDate: '2024-12-16',
    eventVenue: 'Mercedes-Benz Stadium',
    eventImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
    ticketCount: 4,
    sectionInfo: 'Floor Section A',
    description: 'Selling 4 floor seats for $400 each. Can\'t make it anymore. Serious buyers only.',
    lookingFor: '$1600 total - PayPal, Venmo, or Zelle',
    createdAt: '2024-11-22T13:20:00Z',
    status: 'active',
  },
  {
    id: '7',
    type: 'request',
    userId: '3',
    user: mockUsers[2],
    eventId: 'ts2',
    eventName: 'Taylor Swift | The Eras Tour',
    eventDate: '2024-12-18',
    eventVenue: 'MetLife Stadium',
    eventImage: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop',
    ticketCount: 2,
    description: 'Looking for 2 tickets! Will pay fair price or trade NBA Finals tickets.',
    lookingFor: 'Cash or NBA Finals Game 3 tickets',
    createdAt: '2024-11-23T08:15:00Z',
    status: 'active',
  },
];
