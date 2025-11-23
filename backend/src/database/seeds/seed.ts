import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';
import { Listing } from '../../listings/entities/listing.entity';

// Import mock data from frontend
// Note: In a real implementation, you'd want to move shared data to the shared package
const mockUsers = [
  { id: '1', name: 'Sarah Chen', email: 'sarah.chen@example.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', joinedDate: '2023-11-20', trustScore: 4.9, completedTrades: 47, bio: 'Theater lover and Broadway regular. I love trading tickets to see as many shows as possible! Always fair and honest in my trades.', location: 'New York, NY', favoriteEvents: ['Theater', 'Music'], badges: ['Verified', 'Top Trader', 'Quick Responder'], responseTime: '< 30 min', verifiedUser: true },
  { id: '2', name: 'Marcus Johnson', email: 'marcus.johnson@example.com', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop', joinedDate: '2024-02-10', trustScore: 4.7, completedTrades: 31, bio: 'Die-hard sports fan! Follow all the major leagues. Looking to trade tickets for games I can\'t attend. Lakers, Dodgers, Rams fan!', location: 'Los Angeles, CA', favoriteEvents: ['Sports'], badges: ['Verified'], responseTime: '< 2 hours', verifiedUser: true },
  { id: '3', name: 'Elena Rodriguez', email: 'elena.rodriguez@example.com', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop', joinedDate: '2023-09-05', trustScore: 5.0, completedTrades: 62, bio: 'Music festival junkie and concert photographer. I attend 50+ shows a year! Love discovering new artists and helping fellow music lovers get great seats.', location: 'Austin, TX', favoriteEvents: ['Music', 'Festival'], badges: ['Verified', 'Top Trader', 'Power User', 'Quick Responder'], responseTime: '< 15 min', verifiedUser: true },
  { id: '4', name: 'Alex Park', email: 'alex.park@example.com', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop', joinedDate: '2024-03-12', trustScore: 4.6, completedTrades: 18, bio: 'New to ticket trading but loving it! Big fan of live events - sports, concerts, comedy shows. Open to all trades!', location: 'Chicago, IL', favoriteEvents: ['Sports', 'Music', 'Comedy'], badges: ['Verified'], responseTime: '< 3 hours', verifiedUser: true },
];

// Subset of events for demonstration
const mockEvents = [
  { id: 'ts1', name: 'Taylor Swift | The Eras Tour', date: '2024-12-15', venue: 'SoFi Stadium', location: 'Los Angeles, CA', city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop', category: 'Music', activeListings: 10 },
  { id: 'nba1', name: 'NBA Finals - Game 3', date: '2024-12-20', venue: 'Madison Square Garden', location: 'New York, NY', city: 'New York', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=400&fit=crop', category: 'Sports', activeListings: 8 },
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
      mockUsers.map(user => {
        const { id, ...userData } = user; // Remove the ID, let TypeORM generate it
        return {
          ...userData,
          password: hashedPassword,
          isActive: true,
        };
      }),
    );
    console.log(`  ✅ Created ${users.length} users\n`);

    // Seed events
    console.log('  🎫 Seeding events...');
    const events = await eventRepo.save(
      mockEvents.map(event => {
        const { id, ...eventData } = event; // Remove the ID, use the original ID as a string
        return {
          ...eventData,
          id: event.id, // Keep the event ID as it's a string primary key
        };
      })
    );
    console.log(`  ✅ Created ${events.length} events\n`);

    // Seed sample listings
    console.log('  📝 Seeding listings...');
    const sampleListings = [
      {
        type: 'offer' as const,
        userId: users[0].id,
        eventId: events[0].id,
        eventName: events[0].name,
        eventDate: events[0].date,
        eventVenue: events[0].venue,
        eventImage: events[0].image,
        ticketCount: 2,
        sectionInfo: 'Section 101, Row 5',
        description: 'Selling 2 tickets. Can no longer attend. Quick transfer via Ticketmaster.',
        lookingFor: '$400 total - Venmo, Zelle, or PayPal',
        status: 'active' as const,
      },
      {
        type: 'request' as const,
        userId: users[1].id,
        eventId: events[1].id,
        eventName: events[1].name,
        eventDate: events[1].date,
        eventVenue: events[1].venue,
        eventImage: events[1].image,
        ticketCount: 2,
        description: 'Looking for 2 tickets! Will pay fair market price. Need ASAP!',
        lookingFor: 'Up to $500 per ticket - Cash or verified payment apps',
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
