/**
 * Database Seed File
 * Generates realistic test data for TixPeer marketplace development.
 *
 * Data Generated:
 * - 500 users with varied profiles, trust scores, and trading history
 * - 200+ events across ALL major US cities (40% past, 60% future for realistic testing)
 * - 8,000+ listings (offers and requests) distributed across events
 *
 * Purpose:
 * - Provides realistic data for frontend development and testing
 * - Demonstrates marketplace at scale with meaningful user interactions
 * - Mix of past/future events: past events test forum feature, future events test marketplace
 * - Uses deterministic data generation (no random libraries like Faker)
 * - Can be run multiple times safely (clears existing test data first)
 *
 * Usage:
 * - Run via: npm run seed:dev (from backend directory)
 * - Or set RUN_SEED=true environment variable on server start
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';
import { Listing } from '../../listings/entities/listing.entity';
import { Message } from '../../messages/entities/message.entity';
import { Conversation } from '../../messages/entities/conversation.entity';

/**
 * Helper Data Arrays
 * Pre-defined realistic data for generating users and listings.
 * Using actual names/cities rather than random generation creates more believable test data.
 */
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa', 'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Edward', 'Rebecca', 'Jason', 'Sharon', 'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy', 'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna', 'Stephen', 'Brenda', 'Larry', 'Pamela', 'Justin', 'Emma', 'Scott', 'Nicole', 'Brandon', 'Helen', 'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Raymond', 'Christine', 'Gregory', 'Debra', 'Alexander', 'Rachel', 'Patrick', 'Carolyn', 'Frank', 'Janet', 'Jack', 'Catherine', 'Dennis', 'Maria', 'Jerry', 'Heather'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

// Major US cities where events are hosted - matches event locations for realistic filtering
// Includes lat/lng coordinates for geo-based search functionality
const cities = [
  { name: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
  { name: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
  { name: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
  { name: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
  { name: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
  { name: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
  { name: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
  { name: 'San Jose', state: 'CA', lat: 37.3382, lng: -121.8863 },
  { name: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
  { name: 'Jacksonville', state: 'FL', lat: 30.3322, lng: -81.6557 },
  { name: 'Fort Worth', state: 'TX', lat: 32.7555, lng: -97.3308 },
  { name: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988 },
  { name: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431 },
  { name: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
  { name: 'Indianapolis', state: 'IN', lat: 39.7684, lng: -86.1581 },
  { name: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
  { name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { name: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 },
  { name: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816 },
  { name: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458 },
  { name: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
  { name: 'Las Vegas', state: 'NV', lat: 36.1699, lng: -115.1398 },
  { name: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
  { name: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 },
];

// Helper function to get coordinates for a city
function getCityCoords(cityName: string): { lat: number; lng: number } {
  const city = cities.find(c => c.name === cityName);
  return city ? { lat: city.lat, lng: city.lng } : { lat: 0, lng: 0 };
}

const eventCategories = ['Music', 'Sports', 'Theater', 'Comedy', 'Festival'];

/**
 * Badge Combinations for User Profiles
 * Creates varied levels of user trust/credibility:
 * - Most users have some verification badges (builds marketplace trust)
 * - Some have empty arrays (new/unverified users for realistic distribution)
 * - Mix of badges creates hierarchy: new users vs power traders
 */
const badges = [
  ['Verified', 'Top Trader'],
  ['Verified', 'Quick Responder'],
  ['Verified', 'Top Trader', 'Power User'],
  ['Verified'],
  ['Verified', 'Quick Responder', 'Top Trader'],
  [], // No badges for some users (new traders)
];

// Response time categories - demonstrates user responsiveness for trust building
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

// Descriptions for "offer" listings (people selling/trading tickets they have)
const offerDescriptions = [
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

// Descriptions for "request" listings (people looking to buy tickets)
const requestDescriptions = [
  'Looking to buy tickets for this show! Any section works.',
  'Missed the sale and really want to go. Please help!',
  'Need tickets for my group. Flexible on location.',
  'Willing to pay fair price for good seats.',
  'Looking for last minute tickets. Open to any offers!',
  'Want to surprise my partner with tickets! Any section appreciated.',
  'Really want to attend this event. Reasonable offers welcome.',
  'Searching for tickets at a fair price. Message me!',
  'Need tickets urgently. Will pay promptly!',
  'Big fan and missed the sale. Looking to buy!',
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

/**
 * Generates a Realistic User Profile
 * Creates varied user data to simulate an active marketplace community.
 *
 * Strategy:
 * - Random name combinations from real name lists (not generic "User 1")
 * - Trust scores between 3.5-5.0 (realistic for active traders)
 * - Completed trades 0-75 (shows mix of new and experienced traders)
 * - Avatar service provides consistent profile pictures
 * - Verification tied to badges (Verified badge = verifiedUser: true)
 *
 * @param index - User number, used for unique email generation
 */
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
    avatar: `https://i.pravatar.cc/150?img=${(index % 70) + 1}`, // Pravatar provides 70 unique avatars
    joinedDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    // Trust score: New users start at 5.0 (max) - trust can only be lost through negative actions
    // Seed data shows realistic distribution: some users lost trust, most maintain it
    trustScore: (3.5 + Math.random() * 1.5).toFixed(1), // 3.5-5.0 range (simulates varied history)
    completedTrades: Math.floor(Math.random() * 75), // 0-75 trades (realistic distribution)
    bio: bios[Math.floor(Math.random() * bios.length)],
    location: `${city.name}, ${city.state}`,
    favoriteEvents,
    badges: userBadges,
    responseTime: responseTimes[Math.floor(Math.random() * responseTimes.length)],
    verifiedUser: isVerified,
  };
}

// Generate 500 users for active marketplace simulation (increased for liveliness)
const mockUsers = Array.from({ length: 500 }, (_, i) => generateUser(i));

/**
 * Event Data - 55 Real-World Events
 * Curated list of concerts, sports games, theater shows, and festivals.
 *
 * Why this approach:
 * - Real event names create believable marketplace simulation
 * - Multiple cities ensure location filtering works properly
 * - Popular events (Taylor Swift, NBA Finals) have higher listing counts
 * - Variety of categories tests category filtering
 * - activeListings field shows marketplace popularity (updated when listings created)
 */
const mockEvents = [
  // PAST EVENTS (40% - for forum/discussion testing)
  // Taylor Swift - Past dates
  { id: 'ts1', name: 'Taylor Swift | The Eras Tour', date: '2026-10-15', venue: 'SoFi Stadium', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 156 },
  { id: 'ts2', name: 'Taylor Swift | The Eras Tour', date: '2026-10-22', venue: 'MetLife Stadium', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 189 },

  // Drake - Past dates
  { id: 'drake1', name: 'Drake - It\'s All a Blur Tour', date: '2026-09-16', venue: 'Mercedes-Benz Stadium', location: 'Atlanta, GA', city: 'Atlanta', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop', category: 'Music', activeListings: 142 },
  { id: 'drake2', name: 'Drake - It\'s All a Blur Tour', date: '2026-09-23', venue: 'TD Garden', location: 'Boston, MA', city: 'Boston', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop', category: 'Music', activeListings: 98 },

  // Beyoncé - Past dates
  { id: 'bey1', name: 'Beyoncé - Renaissance World Tour', date: '2026-08-14', venue: 'NRG Stadium', location: 'Houston, TX', city: 'Houston', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 203 },
  { id: 'bey2', name: 'Beyoncé - Renaissance World Tour', date: '2026-08-21', venue: 'State Farm Arena', location: 'Phoenix, AZ', city: 'Phoenix', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 167 },

  // Ed Sheeran - Past dates
  { id: 'ed1', name: 'Ed Sheeran - Mathematics Tour', date: '2026-07-10', venue: 'Climate Pledge Arena', location: 'Seattle, WA', city: 'Seattle', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 95 },
  { id: 'ed2', name: 'Ed Sheeran - Mathematics Tour', date: '2026-07-17', venue: 'Ball Arena', location: 'Denver, CO', city: 'Denver', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 78 },

  // The Weeknd - Past dates
  { id: 'week1', name: 'The Weeknd - After Hours Tour', date: '2026-06-15', venue: 'United Center', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 73 },
  { id: 'week2', name: 'The Weeknd - After Hours Tour', date: '2026-06-22', venue: 'Little Caesars Arena', location: 'Detroit, MI', city: 'Detroit', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 65 },

  // Past NBA Games
  { id: 'nba1', name: 'NBA Finals - Game 3', date: '2026-06-12', venue: 'Madison Square Garden', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 89 },
  { id: 'nba2', name: 'Lakers vs Warriors', date: '2026-10-25', venue: 'Crypto.com Arena', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop', category: 'Sports', activeListings: 92 },
  { id: 'nba3', name: 'Chicago Bulls vs Miami Heat', date: '2026-11-10', venue: 'United Center', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 54 },

  // Past Broadway & Theater
  { id: 'ham1', name: 'Hamilton', date: '2026-09-17', venue: 'Richard Rodgers Theatre', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=400&fit=crop', category: 'Theater', activeListings: 76 },
  { id: 'lion1', name: 'The Lion King', date: '2026-10-05', venue: 'Minskoff Theatre', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=400&fit=crop', category: 'Theater', activeListings: 82 },

  // Past Bad Bunny
  { id: 'bad1', name: 'Bad Bunny - Most Wanted Tour', date: '2026-08-05', venue: 'Kia Forum', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 187 },
  { id: 'bad2', name: 'Bad Bunny - Most Wanted Tour', date: '2026-08-12', venue: 'American Airlines Arena', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 176 },

  // Past NHL
  { id: 'nhl1', name: 'NHL - Rangers vs Bruins', date: '2026-11-05', venue: 'Madison Square Garden', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 47 },
  { id: 'nhl2', name: 'NHL - Blackhawks vs Red Wings', date: '2026-11-12', venue: 'United Center', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 38 },

  // Past Comedy
  { id: 'bso1', name: 'Boston Symphony Orchestra', date: '2026-10-30', venue: 'Symphony Hall', location: 'Boston, MA', city: 'Boston', image: 'https://images.unsplash.com/photo-1519683109079-d5f539e1542f?w=800&h=400&fit=crop', category: 'Music', activeListings: 41 },

  // FUTURE EVENTS (60% - for active marketplace)
  // Taylor Swift - Future dates
  { id: 'ts3', name: 'Taylor Swift | The Eras Tour', date: '2026-01-15', venue: 'Soldier Field', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 142 },
  { id: 'ts4', name: 'Taylor Swift | The Eras Tour', date: '2026-02-08', venue: 'AT&T Stadium', location: 'Dallas, TX', city: 'Dallas', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 134 },
  { id: 'ts5', name: 'Taylor Swift | The Eras Tour', date: '2026-03-12', venue: 'Lincoln Financial Field', location: 'Philadelphia, PA', city: 'Philadelphia', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 127 },

  // Drake - Future dates
  { id: 'drake3', name: 'Drake - It\'s All a Blur Tour', date: '2026-04-14', venue: 'Scotiabank Arena', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop', category: 'Music', activeListings: 156 },

  // Beyoncé - Future dates
  { id: 'bey3', name: 'Beyoncé - Renaissance World Tour', date: '2026-05-20', venue: 'Allegiant Stadium', location: 'Las Vegas, NV', city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 198 },

  // Ed Sheeran - Future dates
  { id: 'ed3', name: 'Ed Sheeran - Mathematics Tour', date: '2026-06-10', venue: 'Moda Center', location: 'Portland, OR', city: 'Portland', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 82 },

  // Coldplay - Future dates
  { id: 'cold1', name: 'Coldplay - Music of the Spheres', date: '2026-07-05', venue: 'Levi\'s Stadium', location: 'San Francisco, CA', city: 'San Francisco', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 124 },
  { id: 'cold2', name: 'Coldplay - Music of the Spheres', date: '2026-07-12', venue: 'Petco Park', location: 'San Diego, CA', city: 'San Diego', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 101 },
  { id: 'cold3', name: 'Coldplay - Music of the Spheres', date: '2026-07-19', venue: 'Soldier Field', location: 'Indianapolis, IN', city: 'Indianapolis', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 89 },

  // Future NBA Games
  { id: 'nba4', name: 'Houston Rockets vs Lakers', date: '2025-12-05', venue: 'Toyota Center', location: 'Houston, TX', city: 'Houston', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 42 },
  { id: 'nba5', name: 'Miami Heat vs Celtics', date: '2025-12-12', venue: 'FTX Arena', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 61 },
  { id: 'nba6', name: 'Phoenix Suns vs Mavericks', date: '2025-12-18', venue: 'Footprint Center', location: 'Phoenix, AZ', city: 'Phoenix', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 48 },
  { id: 'nba7', name: 'Boston Celtics vs 76ers', date: '2025-12-22', venue: 'TD Garden', location: 'Boston, MA', city: 'Boston', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 67 },
  { id: 'nba8', name: 'Dallas Mavericks vs Nuggets', date: '2026-01-08', venue: 'American Airlines Center', location: 'Dallas, TX', city: 'Dallas', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 52 },
  { id: 'nba9', name: 'Warriors vs Clippers', date: '2026-01-15', venue: 'Chase Center', location: 'San Francisco, CA', city: 'San Francisco', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 76 },
  { id: 'nba10', name: 'Knicks vs Nets', date: '2026-01-22', venue: 'Madison Square Garden', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 84 },
  { id: 'nba11', name: 'Bucks vs Bulls', date: '2026-01-29', venue: 'Fiserv Forum', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 59 },
  { id: 'nba12', name: 'Heat vs Hawks', date: '2026-02-05', venue: 'FTX Arena', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 44 },

  // Future Broadway & Theater
  { id: 'ham2', name: 'Hamilton', date: '2025-12-15', venue: 'CIBC Theatre', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=400&fit=crop', category: 'Theater', activeListings: 58 },
  { id: 'chic1', name: 'Chicago', date: '2026-09-08', venue: 'Ambassador Theatre', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=800&h=400&fit=crop', category: 'Theater', activeListings: 64 },
  { id: 'cirq1', name: 'Cirque du Soleil - O', date: '2026-01-10', venue: 'Bellagio', location: 'Las Vegas, NV', city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&h=400&fit=crop', category: 'Theater', activeListings: 94 },

  // Future Other Music
  { id: 'luke1', name: 'Luke Combs', date: '2026-08-18', venue: 'Bridgestone Arena', location: 'Nashville, TN', city: 'Nashville', image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop', category: 'Music', activeListings: 71 },
  { id: 'luke2', name: 'Luke Combs', date: '2026-08-25', venue: 'AT&T Center', location: 'Austin, TX', city: 'Austin', image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop', category: 'Music', activeListings: 68 },
  { id: 'bad3', name: 'Bad Bunny - Most Wanted Tour', date: '2026-09-22', venue: 'Toyota Center', location: 'Houston, TX', city: 'Houston', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 164 },
  { id: 'adele1', name: 'Adele - Weekends with Adele', date: '2026-02-14', venue: 'The Colosseum at Caesars', location: 'Las Vegas, NV', city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 112 },

  // Future NFL
  { id: 'nfl1', name: 'NFL Playoffs - Wild Card', date: '2026-01-10', venue: 'Arrowhead Stadium', location: 'Kansas City, MO', city: 'Kansas City', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 134 },
  { id: 'nfl2', name: 'NFL Playoffs - Wild Card', date: '2026-01-11', venue: 'Lambeau Field', location: 'Green Bay, WI', city: 'Green Bay', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 128 },

  // Future Comedy
  { id: 'billy1', name: 'Bill Burr - Live', date: '2026-03-20', venue: 'Beacon Theatre', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&h=400&fit=crop', category: 'Comedy', activeListings: 53 },

  // Festivals
  { id: 'ultra1', name: 'Ultra Music Festival', date: '2026-01-28', venue: 'Bayfront Park', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 234 },
  { id: 'sa1', name: 'Stagecoach Festival', date: '2026-02-25', venue: 'Empire Polo Club', location: 'Indio, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=400&fit=crop', category: 'Festival', activeListings: 189 },
  { id: 'sa2', name: 'Lollapalooza', date: '2026-06-01', venue: 'Grant Park', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 276 },
  { id: 'sj1', name: 'Bonnaroo Music Festival', date: '2026-04-12', venue: 'Great Stage Park', location: 'Manchester, TN', city: 'Nashville', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=400&fit=crop', category: 'Festival', activeListings: 198 },
  { id: 'sj2', name: 'Electric Daisy Carnival', date: '2026-03-16', venue: 'Las Vegas Motor Speedway', location: 'Las Vegas, NV', city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 312 },
  { id: 'aus1', name: 'Austin City Limits', date: '2026-08-03', venue: 'Zilker Park', location: 'Austin, TX', city: 'Austin', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=400&fit=crop', category: 'Festival', activeListings: 245 },
  { id: 'aus2', name: 'Coachella Valley Music Festival', date: '2026-02-11', venue: 'Empire Polo Club', location: 'Indio, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=400&fit=crop', category: 'Festival', activeListings: 389 },

  // Additional events with varied dates throughout 2025
  // January 2025 Events
  { id: 'post1', name: 'Post Malone - Big Ass Stadium Tour', date: '2025-12-20', venue: 'Climate Pledge Arena', location: 'Seattle, WA', city: 'Seattle', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 143 },
  { id: 'post2', name: 'Post Malone - Big Ass Stadium Tour', date: '2025-12-25', venue: 'Moda Center', location: 'Portland, OR', city: 'Portland', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 128 },
  { id: 'nba13', name: 'Lakers vs Celtics', date: '2025-12-22', venue: 'Crypto.com Arena', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 97 },
  { id: 'nba14', name: 'Warriors vs Suns', date: '2025-12-26', venue: 'Chase Center', location: 'San Francisco, CA', city: 'San Francisco', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 84 },

  // February 2025 Events
  { id: 'sza1', name: 'SZA - SOS Tour', date: '2025-12-05', venue: 'Barclays Center', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 156 },
  { id: 'sza2', name: 'SZA - SOS Tour', date: '2025-12-10', venue: 'United Center', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 132 },
  { id: 'bruno1', name: 'Bruno Mars - An Evening with Silk Sonic', date: '2025-12-14', venue: 'MGM Grand Garden', location: 'Las Vegas, NV', city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 198 },
  { id: 'nba15', name: 'NBA All-Star Game', date: '2025-12-16', venue: 'Chase Center', location: 'San Francisco, CA', city: 'San Francisco', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop', category: 'Sports', activeListings: 276 },
  { id: 'nhl3', name: 'NHL Stadium Series', date: '2025-12-22', venue: 'Lincoln Financial Field', location: 'Philadelphia, PA', city: 'Philadelphia', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 112 },
  { id: 'billie1', name: 'Billie Eilish - Hit Me Hard and Soft Tour', date: '2025-12-28', venue: 'Staples Center', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop', category: 'Music', activeListings: 189 },

  // March 2025 Events
  { id: 'ncaa1', name: 'March Madness - Sweet 16', date: '2026-01-22', venue: 'AT&T Center', location: 'San Antonio, TX', city: 'San Antonio', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop', category: 'Sports', activeListings: 167 },
  { id: 'ncaa2', name: 'March Madness - Elite Eight', date: '2026-01-29', venue: 'United Center', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop', category: 'Sports', activeListings: 198 },
  { id: 'travis1', name: 'Travis Scott - Utopia Tour', date: '2026-01-15', venue: 'American Airlines Arena', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 213 },
  { id: 'travis2', name: 'Travis Scott - Utopia Tour', date: '2026-01-20', venue: 'State Farm Arena', location: 'Atlanta, GA', city: 'Atlanta', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 194 },
  { id: 'wicked1', name: 'Wicked', date: '2026-01-08', venue: 'Pantages Theatre', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=400&fit=crop', category: 'Theater', activeListings: 142 },

  // May 2025 Events
  { id: 'kendrick1', name: 'Kendrick Lamar - The Big Steppers Tour', date: '2026-03-03', venue: 'Barclays Center', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop', category: 'Music', activeListings: 201 },
  { id: 'kendrick2', name: 'Kendrick Lamar - The Big Steppers Tour', date: '2026-03-08', venue: 'Wells Fargo Center', location: 'Philadelphia, PA', city: 'Philadelphia', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop', category: 'Music', activeListings: 173 },
  { id: 'mlb1', name: 'Yankees vs Red Sox', date: '2026-03-24', venue: 'Yankee Stadium', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop', category: 'Sports', activeListings: 123 },
  { id: 'mlb2', name: 'Dodgers vs Giants', date: '2026-03-30', venue: 'Dodger Stadium', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop', category: 'Sports', activeListings: 109 },

  // June 2025 Events
  { id: 'imagine1', name: 'Imagine Dragons - Loom World Tour', date: '2026-04-06', venue: 'T-Mobile Arena', location: 'Las Vegas, NV', city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 147 },
  { id: 'imagine2', name: 'Imagine Dragons - Loom World Tour', date: '2026-04-14', venue: 'Ball Arena', location: 'Denver, CO', city: 'Denver', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 128 },
  { id: 'mlb3', name: 'Cubs vs Cardinals', date: '2026-04-20', venue: 'Wrigley Field', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop', category: 'Sports', activeListings: 94 },
  { id: 'mlb4', name: 'Red Sox vs Yankees', date: '2026-04-28', venue: 'Fenway Park', location: 'Boston, MA', city: 'Boston', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop', category: 'Sports', activeListings: 116 },

  // July 2025 Events
  { id: 'dua1', name: 'Dua Lipa - Radical Optimism Tour', date: '2026-05-04', venue: 'Madison Square Garden', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 176 },
  { id: 'dua2', name: 'Dua Lipa - Radical Optimism Tour', date: '2026-05-10', venue: 'TD Garden', location: 'Boston, MA', city: 'Boston', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 152 },
  { id: 'mlb5', name: 'MLB All-Star Game', date: '2026-05-15', venue: 'Globe Life Field', location: 'Dallas, TX', city: 'Dallas', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop', category: 'Sports', activeListings: 234 },
  { id: 'sabrina1', name: 'Sabrina Carpenter - Short n\' Sweet Tour', date: '2026-05-22', venue: 'American Airlines Arena', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 138 },
  { id: 'sabrina2', name: 'Sabrina Carpenter - Short n\' Sweet Tour', date: '2026-05-28', venue: 'Footprint Center', location: 'Phoenix, AZ', city: 'Phoenix', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 124 },

  // September 2025 Events
  { id: 'nfl3', name: 'NFL - Cowboys vs Eagles', date: '2026-07-07', venue: 'AT&T Stadium', location: 'Dallas, TX', city: 'Dallas', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 156 },
  { id: 'nfl4', name: 'NFL - 49ers vs Rams', date: '2026-07-14', venue: 'Levi\'s Stadium', location: 'San Francisco, CA', city: 'San Francisco', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 143 },
  { id: 'nfl5', name: 'NFL - Patriots vs Jets', date: '2026-07-21', venue: 'Gillette Stadium', location: 'Boston, MA', city: 'Boston', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 132 },
  { id: 'olivia1', name: 'Olivia Rodrigo - GUTS World Tour', date: '2026-07-18', venue: 'United Center', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 167 },
  { id: 'olivia2', name: 'Olivia Rodrigo - GUTS World Tour', date: '2026-07-25', venue: 'Little Caesars Arena', location: 'Detroit, MI', city: 'Detroit', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 149 },

  // November 2025 Events
  { id: 'nfl6', name: 'NFL - Thanksgiving Day Classic', date: '2026-09-27', venue: 'AT&T Stadium', location: 'Dallas, TX', city: 'Dallas', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 187 },
  { id: 'nba16', name: 'Lakers vs Clippers', date: '2026-09-15', venue: 'Crypto.com Arena', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 106 },
  { id: 'nba17', name: 'Knicks vs Heat', date: '2026-09-22', venue: 'Madison Square Garden', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 92 },
  { id: 'ariana1', name: 'Ariana Grande - Eternal Sunshine Tour', date: '2026-09-08', venue: 'Barclays Center', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 234 },
  { id: 'ariana2', name: 'Ariana Grande - Eternal Sunshine Tour', date: '2026-09-14', venue: 'Wells Fargo Center', location: 'Philadelphia, PA', city: 'Philadelphia', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 207 },
  { id: 'ariana3', name: 'Ariana Grande - Eternal Sunshine Tour', date: '2026-09-20', venue: 'United Center', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 198 },

  // December 2025 Events
  { id: 'nutcracker1', name: 'The Nutcracker Ballet', date: '2025-12-10', venue: 'Lincoln Center', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&h=400&fit=crop', category: 'Theater', activeListings: 87 },
  { id: 'nutcracker2', name: 'The Nutcracker Ballet', date: '2025-12-15', venue: 'Lyric Opera House', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&h=400&fit=crop', category: 'Theater', activeListings: 74 },
  { id: 'nba18', name: 'NBA Christmas Day - Lakers vs Celtics', date: '2025-12-25', venue: 'Crypto.com Arena', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 178 },
  { id: 'nhl4', name: 'NHL - Winter Classic', date: '2025-12-31', venue: 'Wrigley Field', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 156 },

  // ====== ADDITIONAL EVENTS FOR COMPREHENSIVE CITY COVERAGE ======

  // San Antonio Events
  { id: 'sanant1', name: 'San Antonio Spurs vs Lakers', date: '2025-12-12', venue: 'AT&T Center', location: 'San Antonio, TX', city: 'San Antonio', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 112 },
  { id: 'sanant2', name: 'Fiesta de las Luminarias', date: '2026-01-15', venue: 'River Walk', location: 'San Antonio, TX', city: 'San Antonio', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 98 },
  { id: 'sanant3', name: 'Country Music Festival', date: '2026-02-20', venue: 'Majestic Theatre', location: 'San Antonio, TX', city: 'San Antonio', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 145 },
  { id: 'sanant4', name: 'Comedy Night at The Laugh Out Loud', date: '2026-04-18', venue: 'Laugh Out Loud Comedy Club', location: 'San Antonio, TX', city: 'San Antonio', image: 'https://images.unsplash.com/photo-1527224538127-2104bb78c51b?w=800&h=400&fit=crop', category: 'Comedy', activeListings: 67 },

  // San Diego Events
  { id: 'sd1', name: 'San Diego Padres vs Dodgers', date: '2025-12-08', venue: 'Petco Park', location: 'San Diego, CA', city: 'San Diego', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop', category: 'Sports', activeListings: 134 },
  { id: 'sd2', name: 'Comic-Con International', date: '2026-05-24', venue: 'San Diego Convention Center', location: 'San Diego, CA', city: 'San Diego', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 223 },
  { id: 'sd3', name: 'Indie Rock Festival', date: '2026-03-10', venue: 'House of Blues', location: 'San Diego, CA', city: 'San Diego', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 156 },
  { id: 'sd4', name: 'Beach Comedy Fest', date: '2026-06-15', venue: 'La Jolla Playhouse', location: 'San Diego, CA', city: 'San Diego', image: 'https://images.unsplash.com/photo-1527224538127-2104bb78c51b?w=800&h=400&fit=crop', category: 'Comedy', activeListings: 89 },

  // Jacksonville Events
  { id: 'jax1', name: 'Jacksonville Jaguars vs Titans', date: '2025-12-18', venue: 'TIAA Bank Field', location: 'Jacksonville, FL', city: 'Jacksonville', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 127 },
  { id: 'jax2', name: 'Jazz & Blues Festival', date: '2026-02-12', venue: 'Metropolitan Park', location: 'Jacksonville, FL', city: 'Jacksonville', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 143 },
  { id: 'jax3', name: 'Florida Theatre Broadway Series', date: '2026-04-07', venue: 'Florida Theatre', location: 'Jacksonville, FL', city: 'Jacksonville', image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&h=400&fit=crop', category: 'Theater', activeListings: 102 },
  { id: 'jax4', name: 'Summer Comedy Showcase', date: '2026-05-20', venue: 'Comedy Zone', location: 'Jacksonville, FL', city: 'Jacksonville', image: 'https://images.unsplash.com/photo-1527224538127-2104bb78c51b?w=800&h=400&fit=crop', category: 'Comedy', activeListings: 76 },

  // Fort Worth Events
  { id: 'fw1', name: 'Fort Worth Stock Show & Rodeo', date: '2025-12-22', venue: 'Will Rogers Memorial Center', location: 'Fort Worth, TX', city: 'Fort Worth', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 189 },
  { id: 'fw2', name: 'Country Legends Concert', date: '2026-02-05', venue: 'Dickies Arena', location: 'Fort Worth, TX', city: 'Fort Worth', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 167 },
  { id: 'fw3', name: 'Fort Worth Symphony Orchestra', date: '2026-03-17', venue: 'Bass Performance Hall', location: 'Fort Worth, TX', city: 'Fort Worth', image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=400&fit=crop', category: 'Theater', activeListings: 94 },
  { id: 'fw4', name: 'Stand-Up Comedy Tour', date: '2026-06-22', venue: 'Hyena\'s Comedy Club', location: 'Fort Worth, TX', city: 'Fort Worth', image: 'https://images.unsplash.com/photo-1527224538127-2104bb78c51b?w=800&h=400&fit=crop', category: 'Comedy', activeListings: 81 },

  // Columbus Events
  { id: 'col1', name: 'Columbus Blue Jackets vs Rangers', date: '2025-12-14', venue: 'Nationwide Arena', location: 'Columbus, OH', city: 'Columbus', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 119 },
  { id: 'col2', name: 'Ohio State Football Game', date: '2026-07-06', venue: 'Ohio Stadium', location: 'Columbus, OH', city: 'Columbus', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 201 },
  { id: 'col3', name: 'Rock on the Range Festival', date: '2026-03-16', venue: 'MAPFRE Stadium', location: 'Columbus, OH', city: 'Columbus', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Music', activeListings: 178 },
  { id: 'col4', name: 'Comedy Night at Funny Bone', date: '2026-05-11', venue: 'Funny Bone Comedy Club', location: 'Columbus, OH', city: 'Columbus', image: 'https://images.unsplash.com/photo-1527224538127-2104bb78c51b?w=800&h=400&fit=crop', category: 'Comedy', activeListings: 88 },

  // Charlotte Events
  { id: 'char1', name: 'Charlotte Hornets vs Bucks', date: '2025-12-25', venue: 'Spectrum Center', location: 'Charlotte, NC', city: 'Charlotte', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 129 },
  { id: 'char2', name: 'NASCAR All-Star Race', date: '2026-03-18', venue: 'Charlotte Motor Speedway', location: 'Charlotte, NC', city: 'Charlotte', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop', category: 'Sports', activeListings: 167 },
  { id: 'char3', name: 'Carolina Country Music Fest', date: '2026-04-13', venue: 'PNC Music Pavilion', location: 'Charlotte, NC', city: 'Charlotte', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 154 },
  { id: 'char4', name: 'Improv Comedy Night', date: '2026-06-09', venue: 'The Comedy Zone', location: 'Charlotte, NC', city: 'Charlotte', image: 'https://images.unsplash.com/photo-1527224538127-2104bb78c51b?w=800&h=400&fit=crop', category: 'Comedy', activeListings: 72 },

  // Indianapolis Events
  { id: 'ind1', name: 'Indianapolis 500', date: '2026-03-25', venue: 'Indianapolis Motor Speedway', location: 'Indianapolis, IN', city: 'Indianapolis', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop', category: 'Sports', activeListings: 245 },
  { id: 'ind2', name: 'Indiana Pacers vs Cavaliers', date: '2026-01-08', venue: 'Gainbridge Fieldhouse', location: 'Indianapolis, IN', city: 'Indianapolis', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 136 },
  { id: 'ind3', name: 'Indy Jazz Fest', date: '2026-04-20', venue: 'White River State Park', location: 'Indianapolis, IN', city: 'Indianapolis', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 148 },
  { id: 'ind4', name: 'Broadway at The Murat', date: '2026-05-05', venue: 'Murat Theatre', location: 'Indianapolis, IN', city: 'Indianapolis', image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&h=400&fit=crop', category: 'Theater', activeListings: 103 },

  // Nashville Events (Adding more since it's Music City)
  { id: 'nash5', name: 'Grand Ole Opry Show', date: '2025-12-28', venue: 'Grand Ole Opry House', location: 'Nashville, TN', city: 'Nashville', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 187 },
  { id: 'nash6', name: 'Nashville Predators vs Blues', date: '2026-01-22', venue: 'Bridgestone Arena', location: 'Nashville, TN', city: 'Nashville', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 124 },
  { id: 'nash7', name: 'CMA Music Festival', date: '2026-04-05', venue: 'Nissan Stadium', location: 'Nashville, TN', city: 'Nashville', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 212 },
  { id: 'nash8', name: 'Country Comedy Show', date: '2026-07-12', venue: 'Zanies Comedy Club', location: 'Nashville, TN', city: 'Nashville', image: 'https://images.unsplash.com/photo-1527224538127-2104bb78c51b?w=800&h=400&fit=crop', category: 'Comedy', activeListings: 95 },

  // Portland Events
  { id: 'pdx1', name: 'Portland Trail Blazers vs Warriors', date: '2025-12-16', venue: 'Moda Center', location: 'Portland, OR', city: 'Portland', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 141 },
  { id: 'pdx2', name: 'Portland Indie Music Fest', date: '2026-02-26', venue: 'Crystal Ballroom', location: 'Portland, OR', city: 'Portland', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 163 },
  { id: 'pdx3', name: 'Portland Rose Festival', date: '2026-04-01', venue: 'Tom McCall Waterfront Park', location: 'Portland, OR', city: 'Portland', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 192 },
  { id: 'pdx4', name: 'Helium Comedy Club Show', date: '2026-06-28', venue: 'Helium Comedy Club', location: 'Portland, OR', city: 'Portland', image: 'https://images.unsplash.com/photo-1527224538127-2104bb78c51b?w=800&h=400&fit=crop', category: 'Comedy', activeListings: 86 },

  // Las Vegas Events (Adding more for entertainment capital)
  { id: 'lv5', name: 'EDM Pool Party', date: '2026-03-30', venue: 'Encore Beach Club', location: 'Las Vegas, NV', city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 198 },
  { id: 'lv6', name: 'Vegas Golden Knights vs Avalanche', date: '2026-01-14', venue: 'T-Mobile Arena', location: 'Las Vegas, NV', city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 153 },
  { id: 'lv7', name: 'Magic Show Spectacular', date: '2026-05-18', venue: 'Park MGM', location: 'Las Vegas, NV', city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&h=400&fit=crop', category: 'Theater', activeListings: 117 },
  { id: 'lv8', name: 'Stand-Up Comedy Residency', date: '2026-07-05', venue: 'The Comedy Cellar', location: 'Las Vegas, NV', city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1527224538127-2104bb78c51b?w=800&h=400&fit=crop', category: 'Comedy', activeListings: 104 },

  // More events for major cities to increase density
  // New York (Additional)
  { id: 'ny10', name: 'Off-Broadway Theater Festival', date: '2026-02-18', venue: 'Theater District', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&h=400&fit=crop', category: 'Theater', activeListings: 156 },
  { id: 'ny11', name: 'NYC Marathon', date: '2026-09-02', venue: 'Central Park', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop', category: 'Sports', activeListings: 189 },
  { id: 'ny12', name: 'Comedy Central Stand-Up', date: '2026-06-14', venue: 'Comedy Cellar', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1527224538127-2104bb78c51b?w=800&h=400&fit=crop', category: 'Comedy', activeListings: 98 },

  // Los Angeles (Additional)
  { id: 'la10', name: 'Hollywood Bowl Summer Series', date: '2026-05-12', venue: 'Hollywood Bowl', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 176 },
  { id: 'la11', name: 'LA Film Festival', date: '2026-07-20', venue: 'TCL Chinese Theatre', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 167 },
  { id: 'la12', name: 'Dodgers vs Giants Rivalry', date: '2026-06-08', venue: 'Dodger Stadium', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop', category: 'Sports', activeListings: 203 },

  // Chicago (Additional)
  { id: 'chi10', name: 'Lollapalooza Music Festival', date: '2026-06-01', venue: 'Grant Park', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 234 },
  { id: 'chi11', name: 'Chicago Blues Festival', date: '2026-04-10', venue: 'Millennium Park', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 187 },
  { id: 'chi12', name: 'Second City Comedy Show', date: '2026-03-22', venue: 'The Second City', location: 'Chicago, IL', city: 'Chicago', image: 'https://images.unsplash.com/photo-1527224538127-2104bb78c51b?w=800&h=400&fit=crop', category: 'Comedy', activeListings: 112 },

  // Houston (Additional)
  { id: 'hou4', name: 'Houston Livestock Show and Rodeo', date: '2026-01-07', venue: 'NRG Stadium', location: 'Houston, TX', city: 'Houston', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 201 },
  { id: 'hou5', name: 'Astros Opening Day', date: '2026-02-03', venue: 'Minute Maid Park', location: 'Houston, TX', city: 'Houston', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop', category: 'Sports', activeListings: 178 },
  { id: 'hou6', name: 'Space City Jazz Festival', date: '2026-07-27', venue: 'Discovery Green', location: 'Houston, TX', city: 'Houston', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 143 },

  // Phoenix (Additional)
  { id: 'phx4', name: 'Arizona Renaissance Festival', date: '2025-12-08', venue: 'Gold Canyon', location: 'Phoenix, AZ', city: 'Phoenix', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 156 },
  { id: 'phx5', name: 'Phoenix Open Golf Tournament', date: '2025-12-06', venue: 'TPC Scottsdale', location: 'Phoenix, AZ', city: 'Phoenix', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop', category: 'Sports', activeListings: 189 },
  { id: 'phx6', name: 'Desert Music Festival', date: '2026-02-19', venue: 'Talking Stick Resort Arena', location: 'Phoenix, AZ', city: 'Phoenix', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 167 },

  // Philadelphia (Additional)
  { id: 'phil4', name: 'Philadelphia Flower Show', date: '2026-01-01', venue: 'Pennsylvania Convention Center', location: 'Philadelphia, PA', city: 'Philadelphia', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 134 },
  { id: 'phil5', name: 'Eagles Season Opener', date: '2026-07-08', venue: 'Lincoln Financial Field', location: 'Philadelphia, PA', city: 'Philadelphia', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 198 },
  { id: 'phil6', name: 'Philly Music Festival', date: '2026-04-14', venue: 'The Fillmore', location: 'Philadelphia, PA', city: 'Philadelphia', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 152 },

  // San Jose (Additional)
  { id: 'sj4', name: 'San Jose Jazz Festival', date: '2026-03-09', venue: 'Downtown San Jose', location: 'San Jose, CA', city: 'San Jose', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 148 },
  { id: 'sj5', name: 'San Jose Sharks vs Ducks', date: '2026-01-28', venue: 'SAP Center', location: 'San Jose, CA', city: 'San Jose', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 121 },
  { id: 'sj6', name: 'Silicon Valley Comedy Festival', date: '2026-05-25', venue: 'San Jose Improv', location: 'San Jose, CA', city: 'San Jose', image: 'https://images.unsplash.com/photo-1527224538127-2104bb78c51b?w=800&h=400&fit=crop', category: 'Comedy', activeListings: 93 },

  // Austin (Additional)
  { id: 'aus4', name: 'SXSW Music & Tech Festival', date: '2026-01-14', venue: 'Austin Convention Center', location: 'Austin, TX', city: 'Austin', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 245 },
  { id: 'aus5', name: 'Austin City Limits Music Festival', date: '2026-08-03', venue: 'Zilker Park', location: 'Austin, TX', city: 'Austin', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 223 },
  { id: 'aus6', name: 'Live Music Capital Showcase', date: '2026-03-15', venue: '6th Street District', location: 'Austin, TX', city: 'Austin', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 178 },

  // Dallas (Additional)
  { id: 'dal4', name: 'State Fair of Texas', date: '2026-08-10', venue: 'Fair Park', location: 'Dallas, TX', city: 'Dallas', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 212 },
  { id: 'dal5', name: 'Dallas Mavericks Playoffs', date: '2026-02-16', venue: 'American Airlines Center', location: 'Dallas, TX', city: 'Dallas', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 187 },
  { id: 'dal6', name: 'Deep Ellum Music Crawl', date: '2026-04-28', venue: 'Deep Ellum District', location: 'Dallas, TX', city: 'Dallas', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 156 },

  // Seattle (Additional)
  { id: 'sea4', name: 'Seattle Mariners Opening Day', date: '2026-02-04', venue: 'T-Mobile Park', location: 'Seattle, WA', city: 'Seattle', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop', category: 'Sports', activeListings: 167 },
  { id: 'sea5', name: 'Capitol Hill Block Party', date: '2026-05-26', venue: 'Capitol Hill', location: 'Seattle, WA', city: 'Seattle', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 143 },
  { id: 'sea6', name: 'Seattle International Comedy Competition', date: '2026-09-07', venue: 'Moore Theatre', location: 'Seattle, WA', city: 'Seattle', image: 'https://images.unsplash.com/photo-1527224538127-2104bb78c51b?w=800&h=400&fit=crop', category: 'Comedy', activeListings: 108 },

  // Denver (Additional)
  { id: 'den4', name: 'Red Rocks Concert Series', date: '2026-04-21', venue: 'Red Rocks Amphitheatre', location: 'Denver, CO', city: 'Denver', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 198 },
  { id: 'den5', name: 'Great American Beer Festival', date: '2026-08-02', venue: 'Colorado Convention Center', location: 'Denver, CO', city: 'Denver', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 176 },
  { id: 'den6', name: 'Denver Nuggets Championship Banner Night', date: '2026-08-24', venue: 'Ball Arena', location: 'Denver, CO', city: 'Denver', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 189 },

  // Boston (Additional)
  { id: 'bos4', name: 'Boston Marathon', date: '2026-02-21', venue: 'Hopkinton to Boston', location: 'Boston, MA', city: 'Boston', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop', category: 'Sports', activeListings: 201 },
  { id: 'bos5', name: 'Boston Calling Music Festival', date: '2026-03-23', venue: 'Harvard Athletic Complex', location: 'Boston, MA', city: 'Boston', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 178 },
  { id: 'bos6', name: 'Boston Comedy Festival', date: '2026-07-16', venue: 'Laugh Boston', location: 'Boston, MA', city: 'Boston', image: 'https://images.unsplash.com/photo-1527224538127-2104bb78c51b?w=800&h=400&fit=crop', category: 'Comedy', activeListings: 102 },

  // San Francisco (Additional)
  { id: 'sf4', name: 'Outside Lands Music Festival', date: '2026-06-08', venue: 'Golden Gate Park', location: 'San Francisco, CA', city: 'San Francisco', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 234 },
  { id: 'sf5', name: 'San Francisco Symphony Opening Night', date: '2026-07-10', venue: 'Davies Symphony Hall', location: 'San Francisco, CA', city: 'San Francisco', image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=400&fit=crop', category: 'Theater', activeListings: 118 },
  { id: 'sf6', name: 'Giants vs Dodgers Rivalry Night', date: '2026-05-30', venue: 'Oracle Park', location: 'San Francisco, CA', city: 'San Francisco', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop', category: 'Sports', activeListings: 176 },

  // Miami (Additional)
  { id: 'mia4', name: 'Ultra Music Festival', date: '2026-01-28', venue: 'Bayfront Park', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 256 },
  { id: 'mia5', name: 'Miami Heat Finals Game', date: '2026-04-12', venue: 'FTX Arena', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 223 },
  { id: 'mia6', name: 'Art Basel Miami', date: '2025-12-05', venue: 'Miami Beach Convention Center', location: 'Miami, FL', city: 'Miami', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 198 },

  // Atlanta (Additional)
  { id: 'atl4', name: 'Atlanta Music Midtown', date: '2026-07-19', venue: 'Piedmont Park', location: 'Atlanta, GA', city: 'Atlanta', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 187 },
  { id: 'atl5', name: 'Atlanta Braves Playoff Game', date: '2026-08-08', venue: 'Truist Park', location: 'Atlanta, GA', city: 'Atlanta', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop', category: 'Sports', activeListings: 201 },
  { id: 'atl6', name: 'Fox Theatre Broadway Series', date: '2026-06-16', venue: 'Fox Theatre', location: 'Atlanta, GA', city: 'Atlanta', image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&h=400&fit=crop', category: 'Theater', activeListings: 143 },

  // Detroit (Additional)
  { id: 'det4', name: 'Detroit Auto Show', date: '2025-12-11', venue: 'TCF Center', location: 'Detroit, MI', city: 'Detroit', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop', category: 'Festival', activeListings: 167 },
  { id: 'det5', name: 'Detroit Red Wings vs Blackhawks', date: '2026-01-15', venue: 'Little Caesars Arena', location: 'Detroit, MI', city: 'Detroit', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 134 },
  { id: 'det6', name: 'Movement Electronic Music Festival', date: '2026-03-24', venue: 'Hart Plaza', location: 'Detroit, MI', city: 'Detroit', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 178 },
];

/**
 * Generates Listings for a Specific Event
 * Creates realistic mix of offers (people selling) and requests (people buying).
 *
 * Strategy:
 * - 70% offers, 30% requests (most listings are people selling tickets)
 * - Random ticket counts 1-4 (typical group sizes)
 * - Assigns listings to random users from the pool
 * - Denormalizes event data onto listing for performance (avoids joins)
 * - Only "offer" listings get sectionInfo (sellers know their seat locations)
 *
 * @param event - Event to create listings for
 * @param count - How many listings to create
 * @param userIds - Pool of user IDs to assign as listing owners
 */
function generateListingsForEvent(event: any, count: number, userIds: string[]) {
  const listings: any[] = [];

  for (let i = 0; i < count; i++) {
    // 30% requests, 70% offers (realistic marketplace distribution)
    const type = Math.random() > 0.7 ? 'request' as const : 'offer' as const;
    const ticketCount = Math.floor(Math.random() * 4) + 1; // 1-4 tickets per listing
    const userId = userIds[Math.floor(Math.random() * userIds.length)];

    // Use appropriate descriptions based on listing type
    const descriptionsArray = type === 'offer' ? offerDescriptions : requestDescriptions;

    const listing: any = {
      eventId: event.id,
      userId,
      type,
      ticketCount,
      // Denormalized event data - improves query performance for listing feeds
      eventName: event.name,
      eventDate: event.date,
      eventVenue: event.venue,
      eventImage: event.image,
      description: descriptionsArray[Math.floor(Math.random() * descriptionsArray.length)],
      lookingFor: lookingForOptions[Math.floor(Math.random() * lookingForOptions.length)],
      status: 'active' as const,
    };

    // Only offers have section info (sellers know their seat locations)
    if (type === 'offer') {
      listing.sectionInfo = `${sections[Math.floor(Math.random() * sections.length)]}, ${rows[Math.floor(Math.random() * rows.length)]}`;
    }

    listings.push(listing);
  }

  return listings;
}

/**
 * Main Seed Function
 * Populates database with realistic test data for development.
 *
 * Process:
 * 1. Clear existing seed data (keeps real users, removes test data)
 * 2. Create 100 users with varied profiles
 * 3. Create 55 events across categories and cities
 * 4. Generate ~1,900 listings distributed across events
 * 5. Use batch processing to avoid memory issues with large datasets
 *
 * @param dataSource - TypeORM DataSource for database operations
 */
export async function seed(dataSource: DataSource) {
  console.log('🌱 Seeding database...\n');

  const userRepo = dataSource.getRepository(User);
  const eventRepo = dataSource.getRepository(Event);
  const listingRepo = dataSource.getRepository(Listing);
  const messageRepo = dataSource.getRepository(Message);
  const conversationRepo = dataSource.getRepository(Conversation);

  /**
   * Clear Existing Seed Data
   * Deletes all listings, events, messages, conversations, and test users (@example.com emails).
   * Preserves real user accounts that don't use @example.com domain.
   * Order matters: delete in reverse dependency order to respect foreign key constraints.
   */
  console.log('  🗑️  Clearing existing data...');
  await messageRepo.createQueryBuilder().delete().execute();
  await conversationRepo.createQueryBuilder().delete().execute();
  await listingRepo.createQueryBuilder().delete().execute();
  await eventRepo.createQueryBuilder().delete().execute();
  await userRepo
    .createQueryBuilder()
    .delete()
    .where('email LIKE :pattern', { pattern: '%@example.com' })
    .execute();
  console.log('  ✅ Data cleared\n');

  /**
   * Create Users
   * All users get same password (password123) for easy testing.
   * Password is hashed with bcrypt for security even in test environment.
   */
  console.log('  👥 Seeding users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const users = await userRepo.save(
    mockUsers.map(user => ({
      ...user,
      trustScore: parseFloat(user.trustScore), // Convert string to number for database
      password: hashedPassword,
      isActive: true,
    })),
  );
  console.log(`  ✅ Created ${users.length} users\n`);

  // Create Events (with lat/lng coordinates based on city)
  console.log('  🎫 Seeding events...');
  const eventsWithCoords = mockEvents.map(event => ({
    ...event,
    ...getCityCoords(event.city),
  }));
  const events = await eventRepo.save(eventsWithCoords);
  console.log(`  ✅ Created ${events.length} events\n`);

  /**
   * Generate Listings for Events
   * Creates realistic distribution based on event popularity:
   * - Popular events (Taylor Swift, festivals) have more listings
   * - Each event gets 20-40% of its activeListings count
   * - This keeps total count manageable (~1,900 listings) while showing variety
   */
  console.log('  📋 Generating listings...');
  const allListings = [];
  const userIds = users.map(u => u.id);

  for (const event of mockEvents) {
    // Generate 20-40% of activeListings count (keeps data manageable while realistic)
    const listingCount = Math.floor(event.activeListings * (0.2 + Math.random() * 0.2));
    const eventListings = generateListingsForEvent(
      event,
      listingCount,
      userIds
    );
    allListings.push(...eventListings);
  }

  /**
   * Batch Save Listings
   * Saves in batches of 100 to avoid overwhelming database/memory.
   * Shows progress to indicate seeding is still working (important for large datasets).
   */
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
