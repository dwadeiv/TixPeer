import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';
import { Listing } from '../../listings/entities/listing.entity';

// Helper functions to generate realistic data
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa', 'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Edward', 'Rebecca', 'Jason', 'Sharon', 'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy', 'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna', 'Stephen', 'Brenda', 'Larry', 'Pamela', 'Justin', 'Emma', 'Scott', 'Nicole', 'Brandon', 'Helen', 'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Raymond', 'Christine', 'Gregory', 'Debra', 'Alexander', 'Rachel', 'Patrick', 'Carolyn', 'Frank', 'Janet', 'Jack', 'Catherine', 'Dennis', 'Maria', 'Jerry', 'Heather'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

const cities = [
  { name: 'New York', state: 'NY' },
  { name: 'Los Angeles', state: 'CA' },
  { name: 'Chicago', state: 'IL' },
  { name: 'Houston', state: 'TX' },
  { name: 'Phoenix', state: 'AZ' },
  { name: 'Philadelphia', state: 'PA' },
  { name: 'San Antonio', state: 'TX' },
  { name: 'San Diego', state: 'CA' },
  { name: 'Dallas', state: 'TX' },
  { name: 'San Jose', state: 'CA' },
  { name: 'Austin', state: 'TX' },
  { name: 'Jacksonville', state: 'FL' },
  { name: 'Fort Worth', state: 'TX' },
  { name: 'Columbus', state: 'OH' },
  { name: 'Charlotte', state: 'NC' },
  { name: 'San Francisco', state: 'CA' },
  { name: 'Indianapolis', state: 'IN' },
  { name: 'Seattle', state: 'WA' },
  { name: 'Denver', state: 'CO' },
  { name: 'Boston', state: 'MA' },
  { name: 'Nashville', state: 'TN' },
  { name: 'Detroit', state: 'MI' },
  { name: 'Portland', state: 'OR' },
  { name: 'Las Vegas', state: 'NV' },
  { name: 'Miami', state: 'FL' },
  { name: 'Atlanta', state: 'GA' },
];

const eventCategories = ['Music', 'Sports', 'Theater', 'Comedy', 'Festival'];
const badges = [
  ['Verified', 'Top Trader'],
  ['Verified', 'Quick Responder'],
  ['Verified', 'Top Trader', 'Power User'],
  ['Verified'],
  ['Verified', 'Quick Responder', 'Top Trader'],
  [],
];

const responseTimes = ['< 15 min', '< 30 min', '< 1 hour', '< 2 hours', '< 3 hours', '< 4 hours', '< 6 hours'];

const bios = [
  'Love live music and sports. Always trading tickets!',
  'Concert enthusiast and festival goer.',
  'Theater and Broadway shows are my passion!',
  'New to ticket trading but loving it!',
  'Sports fan and concert lover. Reliable trader.',
  'Music festivals and live shows all summer!',
  'Active ticket trader. Fair prices always!',
  'Professional ticket trader. Quick and reliable!',
  'Frequent trader. Love all live events!',
  'Big fan of live events. Always looking for good deals!',
];

const sections = ['Section 101', 'Section 102', 'Section 103', 'Section 104', 'Section 105', 'Section 201', 'Section 202', 'Section 203', 'Floor A', 'Floor B', 'Floor C', 'VIP', 'Lower Bowl', 'Upper Bowl'];
const rows = ['Row 1', 'Row 2', 'Row 3', 'Row 4', 'Row 5', 'Row 10', 'Row 15', 'Row 20', 'Row 25'];

const descriptions = [
  'Have extra tickets and looking to trade or sell. Great seats!',
  'Can\'t make it to this event anymore. Hoping to trade for another date.',
  'Amazing seats! Willing to trade for similar value tickets.',
  'Looking to trade these tickets for a different show.',
  'Great view! Message me if interested.',
  'Face value tickets, just want to recoup my cost.',
  'Selling below face value, need to sell quickly!',
  'Premium seats, willing to negotiate.',
  'Last minute cancellation, need to sell ASAP.',
  'Perfect seats for this show! Don\'t miss out.',
];

const lookingForOptions = [
  'Open to any reasonable offers',
  'Looking for similar value tickets to other shows',
  'Cash only',
  'Willing to trade for sports tickets',
  'Interested in theater tickets',
  'Open to trades or cash',
  'Prefer face value trades',
  'Looking for weekend shows',
  'Any music festival tickets',
  'NBA or NFL tickets preferred',
];

function generateUser(index: number) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const favoriteEvents = eventCategories.slice(0, Math.floor(Math.random() * 3) + 1);
  const userBadges = badges[Math.floor(Math.random() * badges.length)];
  const isVerified = userBadges.includes('Verified');

  return {
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`,
    avatar: `https://i.pravatar.cc/150?img=${(index % 70) + 1}`,
    joinedDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    trustScore: (3.5 + Math.random() * 1.5).toFixed(1),
    completedTrades: Math.floor(Math.random() * 75),
    bio: bios[Math.floor(Math.random() * bios.length)],
    location: `${city.name}, ${city.state}`,
    favoriteEvents,
    badges: userBadges,
    responseTime: responseTimes[Math.floor(Math.random() * responseTimes.length)],
    verifiedUser: isVerified,
  };
}

// Generate 100 users
const mockUsers = Array.from({ length: 100 }, (_, i) => generateUser(i));

// All events from frontend mockData
const mockEvents = [
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
  { id: 'nba6', name: 'Phoenix Suns vs Mavericks', date: '2024-12-26', venue: 'Footprint Center', location: 'Phoenix, AZ', city: 'Phoenix', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 48 },
  { id: 'nba7', name: 'Boston Celtics vs 76ers', date: '2024-12-30', venue: 'TD Garden', location: 'Boston, MA', city: 'Boston', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 67 },
  { id: 'nba8', name: 'Dallas Mavericks vs Nuggets', date: '2025-01-02', venue: 'American Airlines Center', location: 'Dallas, TX', city: 'Dallas', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 52 },
  { id: 'nba9', name: 'Warriors vs Clippers', date: '2025-01-06', venue: 'Chase Center', location: 'San Francisco, CA', city: 'San Francisco', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 76 },
  { id: 'nba10', name: 'Knicks vs Nets', date: '2025-01-08', venue: 'Madison Square Garden', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 84 },
  { id: 'nba11', name: 'Bucks vs Bulls', date: '2025-01-11', venue: 'Fiserv Forum', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 59 },
  { id: 'nba12', name: 'Heat vs Hawks', date: '2025-01-14', venue: 'FTX Arena', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 44 },

  // Broadway & Theater
  { id: 'ham1', name: 'Hamilton', date: '2024-12-17', venue: 'Richard Rodgers Theatre', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=400&fit=crop', category: 'Theater', activeListings: 76 },
  { id: 'ham2', name: 'Hamilton', date: '2024-12-24', venue: 'CIBC Theatre', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=400&fit=crop', category: 'Theater', activeListings: 58 },
  { id: 'lion1', name: 'The Lion King', date: '2024-12-19', venue: 'Minskoff Theatre', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=400&fit=crop', category: 'Theater', activeListings: 82 },
  { id: 'chic1', name: 'Chicago', date: '2024-12-23', venue: 'Ambassador Theatre', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=800&h=400&fit=crop', category: 'Theater', activeListings: 64 },
  { id: 'cirq1', name: 'Cirque du Soleil - O', date: '2024-12-30', venue: 'Bellagio', location: 'Las Vegas, NV', city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&h=400&fit=crop', category: 'Theater', activeListings: 94 },

  // Other Music
  { id: 'luke1', name: 'Luke Combs', date: '2025-01-12', venue: 'Bridgestone Arena', location: 'Nashville, TN', city: 'Nashville', image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop', category: 'Music', activeListings: 71 },
  { id: 'luke2', name: 'Luke Combs', date: '2025-01-15', venue: 'AT&T Center', location: 'Austin, TX', city: 'Austin', image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop', category: 'Music', activeListings: 68 },
  { id: 'bad1', name: 'Bad Bunny - Most Wanted Tour', date: '2024-12-21', venue: 'Kia Forum', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 187 },
  { id: 'bad2', name: 'Bad Bunny - Most Wanted Tour', date: '2024-12-27', venue: 'American Airlines Arena', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 176 },
  { id: 'bad3', name: 'Bad Bunny - Most Wanted Tour', date: '2025-01-09', venue: 'Toyota Center', location: 'Houston, TX', city: 'Houston', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 164 },
  { id: 'adele1', name: 'Adele - Weekends with Adele', date: '2025-01-17', venue: 'The Colosseum at Caesars', location: 'Las Vegas, NV', city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 112 },

  // NFL
  { id: 'nfl1', name: 'NFL Playoffs - Wild Card', date: '2025-01-13', venue: 'Arrowhead Stadium', location: 'Kansas City, MO', city: 'Kansas City', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 134 },
  { id: 'nfl2', name: 'NFL Playoffs - Wild Card', date: '2025-01-14', venue: 'Lambeau Field', location: 'Green Bay, WI', city: 'Green Bay', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 128 },

  // NHL
  { id: 'nhl1', name: 'NHL - Rangers vs Bruins', date: '2024-12-23', venue: 'Madison Square Garden', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 47 },
  { id: 'nhl2', name: 'NHL - Blackhawks vs Red Wings', date: '2024-12-29', venue: 'United Center', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 38 },

  // Comedy
  { id: 'billy1', name: 'Bill Burr - Live', date: '2025-01-18', venue: 'Beacon Theatre', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&h=400&fit=crop', category: 'Comedy', activeListings: 53 },
  { id: 'bso1', name: 'Boston Symphony Orchestra', date: '2024-12-31', venue: 'Symphony Hall', location: 'Boston, MA', city: 'Boston', image: 'https://images.unsplash.com/photo-1519683109079-d5f539e1542f?w=800&h=400&fit=crop', category: 'Music', activeListings: 41 },

  // Festivals
  { id: 'ultra1', name: 'Ultra Music Festival', date: '2025-03-28', venue: 'Bayfront Park', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 234 },
  { id: 'sa1', name: 'Stagecoach Festival', date: '2025-04-25', venue: 'Empire Polo Club', location: 'Indio, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=400&fit=crop', category: 'Festival', activeListings: 189 },
  { id: 'sa2', name: 'Lollapalooza', date: '2025-08-01', venue: 'Grant Park', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 276 },
  { id: 'sj1', name: 'Bonnaroo Music Festival', date: '2025-06-12', venue: 'Great Stage Park', location: 'Manchester, TN', city: 'Nashville', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=400&fit=crop', category: 'Festival', activeListings: 198 },
  { id: 'sj2', name: 'Electric Daisy Carnival', date: '2025-05-16', venue: 'Las Vegas Motor Speedway', location: 'Las Vegas, NV', city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 312 },
  { id: 'aus1', name: 'Austin City Limits', date: '2025-10-03', venue: 'Zilker Park', location: 'Austin, TX', city: 'Austin', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=400&fit=crop', category: 'Festival', activeListings: 245 },
  { id: 'aus2', name: 'Coachella Valley Music Festival', date: '2025-04-11', venue: 'Empire Polo Club', location: 'Indio, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=400&fit=crop', category: 'Festival', activeListings: 389 },
];

function generateListingsForEvent(event: any, count: number, userIds: string[]) {
  const listings: any[] = [];

  for (let i = 0; i < count; i++) {
    const type = Math.random() > 0.7 ? 'request' as const : 'offer' as const;
    const ticketCount = Math.floor(Math.random() * 4) + 1; // 1-4 tickets
    const userId = userIds[Math.floor(Math.random() * userIds.length)];

    const listing: any = {
      eventId: event.id,
      userId,
      type,
      ticketCount,
      eventName: event.name,
      eventDate: event.date,
      eventVenue: event.venue,
      eventImage: event.image,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      lookingFor: lookingForOptions[Math.floor(Math.random() * lookingForOptions.length)],
      status: 'active' as const,
    };

    if (type === 'offer') {
      listing.sectionInfo = `${sections[Math.floor(Math.random() * sections.length)]}, ${rows[Math.floor(Math.random() * rows.length)]}`;
    }

    listings.push(listing);
  }

  return listings;
}

export async function seed(dataSource: DataSource) {
  console.log('🌱 Seeding database...\n');

  const userRepo = dataSource.getRepository(User);
  const eventRepo = dataSource.getRepository(Event);
  const listingRepo = dataSource.getRepository(Listing);

  // Clear existing data
  console.log('  🗑️  Clearing existing data...');
  await listingRepo.createQueryBuilder().delete().execute();
  await eventRepo.createQueryBuilder().delete().execute();
  await userRepo
    .createQueryBuilder()
    .delete()
    .where('email LIKE :pattern', { pattern: '%@example.com' })
    .execute();
  console.log('  ✅ Data cleared\n');

  // Seed users
  console.log('  👥 Seeding users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const users = await userRepo.save(
    mockUsers.map(user => ({
      ...user,
      trustScore: parseFloat(user.trustScore),
      password: hashedPassword,
      isActive: true,
    })),
  );
  console.log(`  ✅ Created ${users.length} users\n`);

  // Seed events
  console.log('  🎫 Seeding events...');
  const events = await eventRepo.save(mockEvents);
  console.log(`  ✅ Created ${events.length} events\n`);

  // Generate listings for each event
  console.log('  📋 Generating listings...');
  const allListings = [];
  const userIds = users.map(u => u.id);

  for (const event of mockEvents) {
    // Generate a percentage of the activeListings count (20-40%) to keep it manageable
    const listingCount = Math.floor(event.activeListings * (0.2 + Math.random() * 0.2));
    const eventListings = generateListingsForEvent(
      event,
      listingCount,
      userIds
    );
    allListings.push(...eventListings);
  }

  // Save all listings in batches to avoid memory issues
  const batchSize = 100;
  let savedCount = 0;

  for (let i = 0; i < allListings.length; i += batchSize) {
    const batch = allListings.slice(i, i + batchSize);
    await listingRepo.save(batch);
    savedCount += batch.length;
    console.log(`  📝 Saved ${savedCount}/${allListings.length} listings...`);
  }

  console.log(`  ✅ Created ${allListings.length} listings\n`);

  console.log('✅ Seeding completed successfully!\n');
}
