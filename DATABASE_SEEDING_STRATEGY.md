# Database Seeding Strategy

This document explains how to seed the database for development/testing and deploy with a clean database for production.

## Overview

**Development/Testing**: Seed database with realistic mock data for testing
**Production**: Start with empty database and let real users populate it

## Architecture

### Current (Mock Data)
- Frontend uses `mockUsers`, `mockEvents`, `mockListings`
- Listings generated dynamically with `generateListingsForEvent()`
- Everything lives in memory on client side

### Future (Real Database)

#### Backend Changes (NestJS)

**Listings Entity:**
```typescript
// backend/src/listings/entities/listing.entity.ts
@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: 'offer' | 'request';

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Event)
  event: Event;

  @Column()
  eventId: string;

  @Column()
  ticketCount: number;

  @Column({ nullable: true })
  sectionInfo: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  lookingFor: string;

  @Column({ default: 'active' })
  status: 'active' | 'completed' | 'cancelled';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**API Endpoints:**
- `GET /listings` - Get all listings
- `GET /listings/:id` - Get specific listing
- `GET /events/:eventId/listings` - Get listings for an event
- `POST /listings` - Create new listing
- `PATCH /listings/:id` - Update listing
- `DELETE /listings/:id` - Delete listing

#### Frontend Changes

**Update API Client** (`frontend/src/lib/api.ts`):
```typescript
// Replace mock data calls with real API calls
async getListings() {
  return axios.get('/listings');
}

async getEventListings(eventId: string) {
  return axios.get(`/events/${eventId}/listings`);
}

async createListing(data: CreateListingDto) {
  return axios.post('/listings', data);
}
```

**Update Components:**
```typescript
// Instead of:
const listings = generateListingsForEvent(event);

// Use:
const { data: listings } = await api.getEventListings(event.id);
```

## Development Setup (Seeded Data)

### 1. Create Seed Script

```typescript
// backend/src/database/seeds/seed.ts
import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Listing } from '../../listings/entities/listing.entity';

export async function seedDatabase(dataSource: DataSource) {
  // Only run in development
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping seed - production environment');
    return;
  }

  console.log('Seeding database...');

  // Clear existing data
  await dataSource.getRepository(Listing).delete({});
  await dataSource.getRepository(User).delete({});

  // Seed users from mockUsers
  const users = await dataSource.getRepository(User).save(mockUsers);

  // Seed listings for each event
  for (const event of mockEvents) {
    const listings = generateListingsForEvent(event);
    await dataSource.getRepository(Listing).save(listings);
  }

  console.log('Database seeded successfully!');
}
```

### 2. Add npm Scripts

```json
// backend/package.json
{
  "scripts": {
    "seed": "ts-node src/database/seeds/seed.ts",
    "seed:dev": "NODE_ENV=development npm run seed",
    "db:reset": "npm run migration:revert && npm run migration:run && npm run seed:dev"
  }
}
```

### 3. Run During Development

```bash
# Seed database
npm run seed:dev

# Or reset and reseed
npm run db:reset
```

## Production Deployment (Clean Start)

### 1. Environment Variables

```env
# .env.development
NODE_ENV=development
RUN_SEED=true

# .env.production
NODE_ENV=production
RUN_SEED=false
```

### 2. Conditional Seeding

```typescript
// backend/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Only seed in development
  if (process.env.NODE_ENV === 'development' && process.env.RUN_SEED === 'true') {
    await seedDatabase(app.get(DataSource));
  }

  await app.listen(3001);
}
```

## Database Migration Strategy

### Development → Production

```bash
# Development
1. npm run seed:dev           # Populate with test data
2. Develop features
3. Test with realistic data

# Before Production Deploy
1. npm run migration:generate  # Generate schema migrations
2. Deploy to production
3. npm run migration:run       # Create empty tables
4. Real users sign up          # Organic data growth
```

## Best Practices

### 1. Separate Databases

```env
# Development
DATABASE_URL=postgresql://localhost:5432/tixpeer_dev

# Production
DATABASE_URL=postgresql://prod-server/tixpeer_prod
```

### 2. Reset Development DB Anytime

```bash
# Clear and reseed
npm run db:reset     # Drop tables, recreate, and populate
```

### 3. Data Management

```typescript
// Script to clear all data (dev only)
export async function clearDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot clear production database!');
  }

  await Listing.delete({});
  await User.delete({});
  console.log('Database cleared');
}
```

## Migration Path

### Phase 1: Development (Current)
- Use mock data in frontend
- Generate listings dynamically
- No persistence

### Phase 2: Database Integration
- Create Listings entity
- Implement seed scripts
- Seed with current mock data
- Test with persistent data

### Phase 3: Production Deployment
- Deploy with empty database
- Real users create accounts
- Real users create listings
- No test data in production

## Summary

✅ **Development**:
- Seed database with current mock data
- 20 users, hundreds of listings
- Perfect for testing features
- Can reset anytime

✅ **Production**:
- Empty database on first deploy
- Real users create accounts
- Organic listing creation
- No test data

✅ **Key Principle**:
**Environment variables ensure seeding NEVER runs in production!**

## Commands Reference

```bash
# Development
npm run seed:dev              # Seed database
npm run db:reset              # Clear and reseed
npm run migration:generate    # Generate migration
npm run migration:run         # Run migrations

# Production
npm run migration:run         # Create schema (empty)
# No seeding commands in production
```
