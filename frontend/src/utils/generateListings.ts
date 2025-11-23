import { User, Listing, Event } from '../types';

// Extended pool of users for listing generation
const listingUsers: User[] = [
  { id: '1', name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', joinedDate: '2023-11-20', trustScore: 4.9, completedTrades: 47, bio: 'Theater lover and Broadway regular.', location: 'New York, NY', favoriteEvents: ['Theater', 'Music'], badges: ['Verified', 'Top Trader'], responseTime: '< 30 min', verifiedUser: true },
  { id: '2', name: 'Marcus Johnson', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop', joinedDate: '2024-02-10', trustScore: 4.7, completedTrades: 31, bio: 'Die-hard sports fan!', location: 'Los Angeles, CA', favoriteEvents: ['Sports'], badges: ['Verified'], responseTime: '< 2 hours', verifiedUser: true },
  { id: '3', name: 'Elena Rodriguez', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop', joinedDate: '2023-09-05', trustScore: 5.0, completedTrades: 62, bio: 'Music festival junkie', location: 'Austin, TX', favoriteEvents: ['Music'], badges: ['Verified', 'Top Trader'], responseTime: '< 15 min', verifiedUser: true },
  { id: '4', name: 'Alex Park', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop', joinedDate: '2024-03-12', trustScore: 4.6, completedTrades: 18, bio: 'New to ticket trading', location: 'Chicago, IL', favoriteEvents: ['Sports', 'Music'], badges: ['Verified'], responseTime: '< 3 hours', verifiedUser: true },
  { id: '5', name: 'Jessica Williams', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop', joinedDate: '2023-08-15', trustScore: 4.8, completedTrades: 42, bio: 'Love live music and sports. Always trading tickets!', location: 'Miami, FL', favoriteEvents: ['Music', 'Sports'], badges: ['Verified', 'Top Trader'], responseTime: '< 1 hour', verifiedUser: true },
  { id: '6', name: 'David Martinez', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop', joinedDate: '2024-01-20', trustScore: 4.5, completedTrades: 25, bio: 'Concert enthusiast and festival goer.', location: 'Houston, TX', favoriteEvents: ['Music', 'Festival'], badges: ['Verified'], responseTime: '< 2 hours', verifiedUser: true },
  { id: '7', name: 'Emily Taylor', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop', joinedDate: '2023-10-05', trustScore: 4.9, completedTrades: 55, bio: 'Theater and Broadway shows are my passion!', location: 'Boston, MA', favoriteEvents: ['Theater'], badges: ['Verified', 'Top Trader'], responseTime: '< 30 min', verifiedUser: true },
  { id: '8', name: 'Michael Brown', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', joinedDate: '2024-03-01', trustScore: 4.4, completedTrades: 15, bio: 'New to the platform. Love all types of events.', location: 'Seattle, WA', favoriteEvents: ['Music', 'Sports'], badges: [], responseTime: '< 4 hours', verifiedUser: false },
  { id: '9', name: 'Ashley Davis', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop', joinedDate: '2023-07-12', trustScore: 4.7, completedTrades: 38, bio: 'Sports fan and concert lover. Reliable trader.', location: 'Phoenix, AZ', favoriteEvents: ['Sports', 'Music'], badges: ['Verified'], responseTime: '< 1 hour', verifiedUser: true },
  { id: '10', name: 'Christopher Lee', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', joinedDate: '2024-02-14', trustScore: 4.6, completedTrades: 22, bio: 'Music festivals and live shows all summer!', location: 'Denver, CO', favoriteEvents: ['Music', 'Festival'], badges: ['Verified'], responseTime: '< 2 hours', verifiedUser: true },
  { id: '11', name: 'Amanda Garcia', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop', joinedDate: '2023-09-20', trustScore: 4.8, completedTrades: 48, bio: 'Active ticket trader. Fair prices always!', location: 'Dallas, TX', favoriteEvents: ['Music', 'Theater'], badges: ['Verified', 'Top Trader'], responseTime: '< 45 min', verifiedUser: true },
  { id: '12', name: 'Ryan Thompson', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop', joinedDate: '2024-01-08', trustScore: 4.3, completedTrades: 12, bio: 'Just getting started with ticket trading.', location: 'Philadelphia, PA', favoriteEvents: ['Sports'], badges: [], responseTime: '< 5 hours', verifiedUser: false },
  { id: '13', name: 'Lauren White', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop', joinedDate: '2023-11-30', trustScore: 4.9, completedTrades: 51, bio: 'Professional ticket trader. Quick and reliable!', location: 'Atlanta, GA', favoriteEvents: ['Music', 'Sports', 'Theater'], badges: ['Verified', 'Top Trader', 'Quick Responder'], responseTime: '< 20 min', verifiedUser: true },
  { id: '14', name: 'Brandon Clark', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop', joinedDate: '2024-04-02', trustScore: 4.2, completedTrades: 8, bio: 'Las Vegas local. Always looking for good shows.', location: 'Las Vegas, NV', favoriteEvents: ['Music', 'Comedy'], badges: [], responseTime: '< 6 hours', verifiedUser: false },
  { id: '15', name: 'Nicole Anderson', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop', joinedDate: '2023-06-18', trustScore: 5.0, completedTrades: 67, bio: 'Experienced trader with perfect track record!', location: 'San Francisco, CA', favoriteEvents: ['Music', 'Theater', 'Festival'], badges: ['Verified', 'Top Trader', 'Power User'], responseTime: '< 15 min', verifiedUser: true },
  { id: '16', name: 'Justin Rodriguez', avatar: 'https://images.unsplash.com/photo-1502378735452-bc7d86632805?w=150&h=150&fit=crop', joinedDate: '2024-02-28', trustScore: 4.5, completedTrades: 19, bio: 'San Diego sports and concert scene.', location: 'San Diego, CA', favoriteEvents: ['Sports', 'Music'], badges: ['Verified'], responseTime: '< 3 hours', verifiedUser: true },
  { id: '17', name: 'Stephanie Moore', avatar: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=150&h=150&fit=crop', joinedDate: '2023-12-10', trustScore: 4.7, completedTrades: 35, bio: 'Portland music lover. Indie shows and festivals!', location: 'Portland, OR', favoriteEvents: ['Music', 'Festival'], badges: ['Verified'], responseTime: '< 1 hour', verifiedUser: true },
  { id: '18', name: 'Kevin Jackson', avatar: 'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=150&h=150&fit=crop', joinedDate: '2024-03-15', trustScore: 4.4, completedTrades: 16, bio: 'Nashville resident. Country music and more!', location: 'Nashville, TN', favoriteEvents: ['Music'], badges: [], responseTime: '< 4 hours', verifiedUser: false },
  { id: '19', name: 'Rachel Miller', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop', joinedDate: '2023-08-25', trustScore: 4.8, completedTrades: 44, bio: 'Frequent trader. Love all live events!', location: 'Charlotte, NC', favoriteEvents: ['Music', 'Sports'], badges: ['Verified', 'Top Trader'], responseTime: '< 1 hour', verifiedUser: true },
  { id: '20', name: 'Tyler Wilson', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop', joinedDate: '2024-01-12', trustScore: 4.6, completedTrades: 21, bio: 'Indy sports fan. Colts and Pacers games!', location: 'Indianapolis, IN', favoriteEvents: ['Sports'], badges: ['Verified'], responseTime: '< 2 hours', verifiedUser: true },
];

// Description templates for different event categories
const offerDescriptions = [
  'Selling {count} tickets. Can no longer attend. Quick transfer via Ticketmaster.',
  'Have {count} extra tickets. Friend canceled last minute. Great seats!',
  '{count} tickets available. Work conflict came up. Price negotiable.',
  'Selling {count} tickets. Paid ${price} each, selling for ${selling}. Instant transfer.',
  'Can no longer make it to this event. {count} tickets, {section}. Fair price!',
  '{count} tickets for sale. Need to sell ASAP. Secure mobile transfer.',
  'Got {count} extra tickets. Looking for quick sale. Verified transfer only.',
  'Offering {count} tickets. Plans changed. These are great seats in {section}!',
  '{count} tickets available. Can meet locally or transfer digitally.',
  'Have {count} tickets to sell. Asking ${selling} each. Serious buyers only.',
];

const requestDescriptions = [
  'Looking for {count} tickets! Will pay fair market price. Need ASAP!',
  'Searching for {count} tickets to this event. Cash ready, can meet today.',
  'Need {count} tickets urgently! Birthday surprise for my partner.',
  'Looking for {count} good seats. Willing to pay up to ${max} total.',
  'Want {count} tickets. Prefer {section} but open to other sections.',
  'Seeking {count} tickets. Can do Venmo, Zelle, or PayPal instantly.',
  'Need {count} tickets for this show. Last minute but desperate!',
  'Looking for {count} tickets together. Will pay premium for good seats.',
  'Searching for {count} tickets. Missed the original sale, willing to pay extra.',
  'Need {count} tickets. Have verified payment ready. Please contact!',
];

const sections = [
  'Section 101', 'Section 102', 'Section 103', 'Section 104', 'Section 105',
  'Section 201', 'Section 202', 'Section 203', 'Section 204', 'Section 205',
  'Floor A', 'Floor B', 'Floor C', 'Lower Bowl', 'Upper Bowl',
  'Club Level', 'Suite Level', 'Orchestra', 'Mezzanine', 'Balcony',
];

// Seeded random number generator for consistent results
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Generate a random number between 0 and 1
  random(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // Generate a random integer between min and max (inclusive)
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  // Pick a random element from an array
  randomPick<T>(array: T[]): T {
    return array[this.randomInt(0, array.length - 1)];
  }
}

// Generate a seed from a string
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Generate listings for a specific event
export function generateListingsForEvent(event: Event): Listing[] {
  const listings: Listing[] = [];
  const targetCount = event.activeListings;

  // Create seeded random generator based on event ID for consistent results
  const rng = new SeededRandom(stringToSeed(event.id));

  // Ratio of offers to requests (roughly 60% offers, 40% requests)
  const offerCount = Math.floor(targetCount * 0.6);
  const requestCount = targetCount - offerCount;

  let listingId = 1000; // Start IDs from 1000 to avoid conflicts

  // Generate offer listings
  for (let i = 0; i < offerCount; i++) {
    const user = rng.randomPick(listingUsers);
    const ticketCount = rng.randomPick([1, 2, 2, 2, 3, 4]); // Favor 2 tickets
    const price = rng.randomInt(50, 800);
    const selling = Math.floor(price * rng.randomInt(80, 120) / 100);
    const section = rng.randomPick(sections);
    const row = rng.randomInt(1, 30);
    const daysAgo = rng.randomInt(1, 30);

    const desc = rng.randomPick(offerDescriptions)
      .replace('{count}', ticketCount.toString())
      .replace('{price}', price.toString())
      .replace('{selling}', selling.toString())
      .replace('{section}', `${section}, Row ${row}`);

    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - daysAgo);

    listings.push({
      id: `${event.id}-${listingId++}`,
      type: 'offer',
      userId: user.id,
      user: user,
      eventId: event.id,
      eventName: event.name,
      eventDate: event.date,
      eventVenue: event.venue,
      eventImage: event.image,
      ticketCount: ticketCount,
      sectionInfo: `${section}, Row ${row}`,
      description: desc,
      lookingFor: `$${selling * ticketCount} total - Venmo, Zelle, or PayPal`,
      createdAt: createdDate.toISOString(),
      status: 'active',
    });
  }

  // Generate request listings
  for (let i = 0; i < requestCount; i++) {
    const user = rng.randomPick(listingUsers);
    const ticketCount = rng.randomPick([1, 2, 2, 2, 3, 4]);
    const maxPrice = rng.randomInt(100, 1000);
    const section = rng.randomPick(sections);
    const daysAgo = rng.randomInt(1, 20);

    const desc = rng.randomPick(requestDescriptions)
      .replace('{count}', ticketCount.toString())
      .replace('{max}', maxPrice.toString())
      .replace('{section}', section);

    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - daysAgo);

    listings.push({
      id: `${event.id}-${listingId++}`,
      type: 'request',
      userId: user.id,
      user: user,
      eventId: event.id,
      eventName: event.name,
      eventDate: event.date,
      eventVenue: event.venue,
      eventImage: event.image,
      ticketCount: ticketCount,
      description: desc,
      lookingFor: `Up to $${maxPrice} per ticket - Cash or verified payment apps`,
      createdAt: createdDate.toISOString(),
      status: 'active',
    });
  }

  // Sort by creation date (newest first)
  listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return listings;
}
