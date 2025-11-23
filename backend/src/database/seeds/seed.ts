import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';
import { Listing } from '../../listings/entities/listing.entity';

// All 20 mock users from frontend
const mockUsers = [
  { name: 'Sarah Chen', email: 'sarah.chen@example.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', joinedDate: '2023-11-20', trustScore: '4.9', completedTrades: 47, bio: 'Theater lover and Broadway regular. I love trading tickets to see as many shows as possible! Always fair and honest in my trades.', location: 'New York, NY', favoriteEvents: ['Theater', 'Music'], badges: ['Verified', 'Top Trader', 'Quick Responder'], responseTime: '< 30 min', verifiedUser: true },
  { name: 'Marcus Johnson', email: 'marcus.johnson@example.com', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop', joinedDate: '2024-02-10', trustScore: '4.7', completedTrades: 31, bio: 'Die-hard sports fan! Follow all the major leagues. Looking to trade tickets for games I can\'t attend. Lakers, Dodgers, Rams fan!', location: 'Los Angeles, CA', favoriteEvents: ['Sports'], badges: ['Verified'], responseTime: '< 2 hours', verifiedUser: true },
  { name: 'Elena Rodriguez', email: 'elena.rodriguez@example.com', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop', joinedDate: '2023-09-05', trustScore: '5.0', completedTrades: 62, bio: 'Music festival junkie and concert photographer. I attend 50+ shows a year! Love discovering new artists and helping fellow music lovers get great seats.', location: 'Austin, TX', favoriteEvents: ['Music', 'Festival'], badges: ['Verified', 'Top Trader', 'Power User', 'Quick Responder'], responseTime: '< 15 min', verifiedUser: true },
  { name: 'Alex Park', email: 'alex.park@example.com', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop', joinedDate: '2024-03-12', trustScore: '4.6', completedTrades: 18, bio: 'New to ticket trading but loving it! Big fan of live events - sports, concerts, comedy shows. Open to all trades!', location: 'Chicago, IL', favoriteEvents: ['Sports', 'Music', 'Comedy'], badges: ['Verified'], responseTime: '< 3 hours', verifiedUser: true },
  { name: 'Jessica Williams', email: 'jessica.williams@example.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop', joinedDate: '2023-08-15', trustScore: '4.8', completedTrades: 42, bio: 'Love live music and sports. Always trading tickets!', location: 'Miami, FL', favoriteEvents: ['Music', 'Sports'], badges: ['Verified', 'Top Trader'], responseTime: '< 1 hour', verifiedUser: true },
  { name: 'David Martinez', email: 'david.martinez@example.com', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop', joinedDate: '2024-01-20', trustScore: '4.5', completedTrades: 25, bio: 'Concert enthusiast and festival goer.', location: 'Houston, TX', favoriteEvents: ['Music', 'Festival'], badges: ['Verified'], responseTime: '< 2 hours', verifiedUser: true },
  { name: 'Emily Taylor', email: 'emily.taylor@example.com', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop', joinedDate: '2023-10-05', trustScore: '4.9', completedTrades: 55, bio: 'Theater and Broadway shows are my passion!', location: 'Boston, MA', favoriteEvents: ['Theater'], badges: ['Verified', 'Top Trader'], responseTime: '< 30 min', verifiedUser: true },
  { name: 'Michael Brown', email: 'michael.brown@example.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', joinedDate: '2024-03-01', trustScore: '4.4', completedTrades: 15, bio: 'New to the platform. Love all types of events.', location: 'Seattle, WA', favoriteEvents: ['Music', 'Sports'], badges: [], responseTime: '< 4 hours', verifiedUser: false },
  { name: 'Ashley Davis', email: 'ashley.davis@example.com', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop', joinedDate: '2023-07-12', trustScore: '4.7', completedTrades: 38, bio: 'Sports fan and concert lover. Reliable trader.', location: 'Phoenix, AZ', favoriteEvents: ['Sports', 'Music'], badges: ['Verified'], responseTime: '< 1 hour', verifiedUser: true },
  { name: 'Christopher Lee', email: 'christopher.lee@example.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', joinedDate: '2024-02-14', trustScore: '4.6', completedTrades: 22, bio: 'Music festivals and live shows all summer!', location: 'Denver, CO', favoriteEvents: ['Music', 'Festival'], badges: ['Verified'], responseTime: '< 2 hours', verifiedUser: true },
  { name: 'Amanda Garcia', email: 'amanda.garcia@example.com', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop', joinedDate: '2023-09-20', trustScore: '4.8', completedTrades: 48, bio: 'Active ticket trader. Fair prices always!', location: 'Dallas, TX', favoriteEvents: ['Music', 'Theater'], badges: ['Verified', 'Top Trader'], responseTime: '< 45 min', verifiedUser: true },
  { name: 'Ryan Thompson', email: 'ryan.thompson@example.com', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop', joinedDate: '2024-01-08', trustScore: '4.3', completedTrades: 12, bio: 'Just getting started with ticket trading.', location: 'Philadelphia, PA', favoriteEvents: ['Sports'], badges: [], responseTime: '< 5 hours', verifiedUser: false },
  { name: 'Lauren White', email: 'lauren.white@example.com', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop', joinedDate: '2023-11-30', trustScore: '4.9', completedTrades: 51, bio: 'Professional ticket trader. Quick and reliable!', location: 'Atlanta, GA', favoriteEvents: ['Music', 'Sports', 'Theater'], badges: ['Verified', 'Top Trader', 'Quick Responder'], responseTime: '< 20 min', verifiedUser: true },
  { name: 'Brandon Clark', email: 'brandon.clark@example.com', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop', joinedDate: '2024-04-02', trustScore: '4.2', completedTrades: 8, bio: 'Las Vegas local. Always looking for good shows.', location: 'Las Vegas, NV', favoriteEvents: ['Music', 'Comedy'], badges: [], responseTime: '< 6 hours', verifiedUser: false },
  { name: 'Nicole Anderson', email: 'nicole.anderson@example.com', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop', joinedDate: '2023-06-18', trustScore: '5.0', completedTrades: 67, bio: 'Experienced trader with perfect track record!', location: 'San Francisco, CA', favoriteEvents: ['Music', 'Theater', 'Festival'], badges: ['Verified', 'Top Trader', 'Power User'], responseTime: '< 15 min', verifiedUser: true },
  { name: 'Justin Rodriguez', email: 'justin.rodriguez@example.com', avatar: 'https://images.unsplash.com/photo-1502378735452-bc7d86632805?w=150&h=150&fit=crop', joinedDate: '2024-02-28', trustScore: '4.5', completedTrades: 19, bio: 'San Diego sports and concert scene.', location: 'San Diego, CA', favoriteEvents: ['Sports', 'Music'], badges: ['Verified'], responseTime: '< 3 hours', verifiedUser: true },
  { name: 'Stephanie Moore', email: 'stephanie.moore@example.com', avatar: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=150&h=150&fit=crop', joinedDate: '2023-12-10', trustScore: '4.7', completedTrades: 35, bio: 'Portland music lover. Indie shows and festivals!', location: 'Portland, OR', favoriteEvents: ['Music', 'Festival'], badges: ['Verified'], responseTime: '< 1 hour', verifiedUser: true },
  { name: 'Kevin Jackson', email: 'kevin.jackson@example.com', avatar: 'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=150&h=150&fit=crop', joinedDate: '2024-03-15', trustScore: '4.4', completedTrades: 16, bio: 'Nashville resident. Country music and more!', location: 'Nashville, TN', favoriteEvents: ['Music'], badges: [], responseTime: '< 4 hours', verifiedUser: false },
  { name: 'Rachel Miller', email: 'rachel.miller@example.com', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop', joinedDate: '2023-08-25', trustScore: '4.8', completedTrades: 44, bio: 'Frequent trader. Love all live events!', location: 'Charlotte, NC', favoriteEvents: ['Music', 'Sports'], badges: ['Verified', 'Top Trader'], responseTime: '< 1 hour', verifiedUser: true },
  { name: 'Tyler Wilson', email: 'tyler.wilson@example.com', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop', joinedDate: '2024-01-12', trustScore: '4.6', completedTrades: 21, bio: 'Indy sports fan. Colts and Pacers games!', location: 'Indianapolis, IN', favoriteEvents: ['Sports'], badges: ['Verified'], responseTime: '< 2 hours', verifiedUser: true },
];

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

  // More events
  { id: 'sa1', name: 'San Antonio Spurs vs Lakers', date: '2024-12-28', venue: 'AT&T Center', location: 'San Antonio, TX', city: 'San Antonio', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 41 },
  { id: 'sa2', name: 'George Strait Concert', date: '2025-01-12', venue: 'Alamodome', location: 'San Antonio, TX', city: 'San Antonio', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop', category: 'Music', activeListings: 95 },
  { id: 'sj1', name: 'San Jose Sharks vs Avalanche', date: '2024-12-16', venue: 'SAP Center', location: 'San Jose, CA', city: 'San Jose', image: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=400&fit=crop', category: 'Sports', activeListings: 38 },
  { id: 'sj2', name: 'Shakira - Las Mujeres Ya No Lloran Tour', date: '2024-12-21', venue: 'SAP Center', location: 'San Jose, CA', city: 'San Jose', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop', category: 'Music', activeListings: 86 },
  { id: 'aus1', name: 'Austin City Limits Music Festival', date: '2025-03-15', venue: 'Zilker Park', location: 'Austin, TX', city: 'Austin', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=400&fit=crop', category: 'Music', activeListings: 189 },
  { id: 'aus2', name: 'UT Longhorns Football', date: '2024-12-18', venue: 'Darrell K Royal Stadium', location: 'Austin, TX', city: 'Austin', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop', category: 'Sports', activeListings: 67 },
];

export async function seedDatabase(dataSource: DataSource) {
  // Safety check - NEVER run in production
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  SKIPPING SEED - Production environment detected');
    return;
  }

  console.log('🌱 Seeding database...\n');

  const listingRepo = dataSource.getRepository(Listing);
  const eventRepo = dataSource.getRepository(Event);
  const userRepo = dataSource.getRepository(User);

  try {
    // Clear existing data
    console.log('  🗑️  Clearing existing data...');
    await listingRepo.createQueryBuilder().delete().execute();
    await eventRepo.createQueryBuilder().delete().execute();
    // Delete test users with @example.com emails
    await userRepo.createQueryBuilder()
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

    // Seed sample listings (using actual user IDs)
    console.log('  📝 Seeding listings...');
    const sampleListings = [
      {
        type: 'offer' as const,
        userId: users[0].id,
        eventId: 'ts1',
        eventName: 'Taylor Swift | The Eras Tour',
        eventDate: '2024-12-15',
        eventVenue: 'SoFi Stadium',
        eventImage: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop',
        ticketCount: 2,
        sectionInfo: 'Section 104, Row 15',
        description: 'Selling 2 tickets for $800 each. Can no longer attend due to work conflict. Tickets will transfer via Ticketmaster.',
        lookingFor: '$1600 total - accepting PayPal or Venmo',
        status: 'active' as const,
      },
      {
        type: 'request' as const,
        userId: users[1].id,
        eventId: 'nba1',
        eventName: 'NBA Finals - Game 3',
        eventDate: '2024-12-20',
        eventVenue: 'Madison Square Garden',
        eventImage: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop',
        ticketCount: 2,
        description: 'Desperate Knicks fan looking for 2 tickets! Have Taylor Swift or Beyoncé tickets to trade.',
        lookingFor: 'Any 2 tickets together, willing to trade premium concert tickets',
        status: 'active' as const,
      },
      {
        type: 'offer' as const,
        userId: users[2].id,
        eventId: 'ham1',
        eventName: 'Hamilton',
        eventDate: '2024-12-08',
        eventVenue: 'Richard Rodgers Theatre',
        eventImage: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=400&fit=crop',
        ticketCount: 4,
        sectionInfo: 'Orchestra, Row K',
        description: 'Have 4 tickets but can only use 2. Happy to split or trade 2 for other Broadway shows.',
        lookingFor: 'Other Broadway shows or partial trade',
        status: 'active' as const,
      },
      {
        type: 'request' as const,
        userId: users[3].id,
        eventId: 'bey1',
        eventName: 'Beyoncé - Renaissance World Tour',
        eventDate: '2024-12-14',
        eventVenue: 'NRG Stadium',
        eventImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop',
        ticketCount: 3,
        description: 'Last-minute birthday surprise for my wife! Paying up to $1500 total. Need them ASAP!',
        lookingFor: '3 tickets anywhere in the stadium - cash ready',
        status: 'active' as const,
      },
      {
        type: 'offer' as const,
        userId: users[0].id,
        eventId: 'bey2',
        eventName: 'Beyoncé - Renaissance World Tour',
        eventDate: '2024-12-19',
        eventVenue: 'State Farm Arena',
        eventImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop',
        ticketCount: 2,
        sectionInfo: 'Section 211, Row 8',
        description: 'Friend backed out. Asking $600 per ticket. These are great seats!',
        lookingFor: '$1200 total via Zelle or cash',
        status: 'active' as const,
      },
      {
        type: 'offer' as const,
        userId: users[1].id,
        eventId: 'drake1',
        eventName: 'Drake - It\'s All a Blur Tour',
        eventDate: '2024-12-16',
        eventVenue: 'Mercedes-Benz Stadium',
        eventImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
        ticketCount: 4,
        sectionInfo: 'Floor Section A',
        description: 'Selling 4 floor seats for $400 each. Can\'t make it anymore. Serious buyers only.',
        lookingFor: '$1600 total - PayPal, Venmo, or Zelle',
        status: 'active' as const,
      },
      {
        type: 'request' as const,
        userId: users[2].id,
        eventId: 'ts2',
        eventName: 'Taylor Swift | The Eras Tour',
        eventDate: '2024-12-18',
        eventVenue: 'MetLife Stadium',
        eventImage: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop',
        ticketCount: 2,
        description: 'Looking for 2 tickets! Will pay fair price or trade NBA Finals tickets.',
        lookingFor: 'Cash or NBA Finals Game 3 tickets',
        status: 'active' as const,
      },
      // Additional listings for variety
      {
        type: 'offer' as const,
        userId: users[4].id,
        eventId: 'nba2',
        eventName: 'Lakers vs Warriors',
        eventDate: '2024-12-25',
        eventVenue: 'Crypto.com Arena',
        eventImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop',
        ticketCount: 2,
        sectionInfo: 'Section 101, Row 10',
        description: 'Christmas game tickets! Great seats behind the Lakers bench.',
        lookingFor: '$500 per ticket',
        status: 'active' as const,
      },
      {
        type: 'request' as const,
        userId: users[5].id,
        eventId: 'ed1',
        eventName: 'Ed Sheeran - Mathematics Tour',
        eventDate: '2024-12-31',
        eventVenue: 'Climate Pledge Arena',
        eventImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop',
        ticketCount: 4,
        description: 'Need 4 tickets for New Year\'s Eve! Group of friends.',
        lookingFor: 'Up to $400 per ticket',
        status: 'active' as const,
      },
      {
        type: 'offer' as const,
        userId: users[6].id,
        eventId: 'chic1',
        eventName: 'Chicago - The Musical',
        eventDate: '2024-12-10',
        eventVenue: 'Cadillac Palace Theatre',
        eventImage: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=400&fit=crop',
        ticketCount: 2,
        sectionInfo: 'Orchestra Center',
        description: 'Premium seats! Can\'t use due to travel.',
        lookingFor: '$200 for the pair',
        status: 'active' as const,
      },
    ];

    await listingRepo.save(sampleListings);
    console.log(`  ✅ Created ${sampleListings.length} sample listings\n`);

    console.log('✨ Database seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - ${users.length} users`);
    console.log(`   - ${events.length} events`);
    console.log(`   - ${sampleListings.length} listings`);
    console.log('\n💡 All seeded users have password: "password123"\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}
