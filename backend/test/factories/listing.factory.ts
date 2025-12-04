/**
 * Listing Factory
 *
 * Generates Listing entities for testing with realistic data
 */

import { Listing } from '../../src/listings/entities/listing.entity';
import { User } from '../../src/users/entities/user.entity';
import { Event } from '../../src/events/entities/event.entity';
import { DataSource } from 'typeorm';
import { createUser } from './user.factory';
import { createEvent } from './event.factory';

interface ListingFactoryOptions {
  title?: string;
  description?: string;
  price?: number;
  quantity?: number;
  section?: string;
  row?: string;
  seat?: string;
  status?: 'active' | 'sold' | 'cancelled' | 'expired';
  seller?: User;
  event?: Event;
}

let listingCounter = 0;

/**
 * Generates unique listing data for testing
 */
export function generateListingData(options: ListingFactoryOptions = {}): Partial<Listing> {
  listingCounter++;
  const timestamp = Date.now();

  return {
    title: options.title ?? `Test Listing ${listingCounter}_${timestamp}`,
    description: options.description ?? `Description for test listing ${listingCounter}`,
    price: options.price ?? 99.99,
    quantity: options.quantity ?? 2,
    section: options.section ?? 'A',
    row: options.row ?? '10',
    seat: options.seat ?? '5',
    status: options.status ?? 'active',
  };
}

/**
 * Creates a Listing entity in the database
 * Automatically creates seller and event if not provided
 */
export async function createListing(
  dataSource: DataSource,
  options: ListingFactoryOptions = {},
): Promise<Listing> {
  const listingRepository = dataSource.getRepository(Listing);

  // Create seller if not provided
  const seller = options.seller ?? (await createUser(dataSource));

  // Create event if not provided
  const event = options.event ?? (await createEvent(dataSource));

  const listingData = generateListingData(options);

  const listing = listingRepository.create({
    ...listingData,
    seller,
    sellerId: seller.id,
    event,
    eventId: event.id,
  });

  return listingRepository.save(listing);
}

/**
 * Creates multiple Listing entities
 */
export async function createListings(
  dataSource: DataSource,
  count: number,
  options: ListingFactoryOptions = {},
): Promise<Listing[]> {
  const listings: Listing[] = [];

  for (let i = 0; i < count; i++) {
    const listing = await createListing(dataSource, options);
    listings.push(listing);
  }

  return listings;
}

/**
 * Creates listings for a specific seller
 */
export async function createListingsForSeller(
  dataSource: DataSource,
  seller: User,
  count: number,
  options: ListingFactoryOptions = {},
): Promise<Listing[]> {
  const listings: Listing[] = [];

  for (let i = 0; i < count; i++) {
    const listing = await createListing(dataSource, {
      ...options,
      seller,
    });
    listings.push(listing);
  }

  return listings;
}

/**
 * Creates listings for a specific event
 */
export async function createListingsForEvent(
  dataSource: DataSource,
  event: Event,
  count: number,
  options: ListingFactoryOptions = {},
): Promise<Listing[]> {
  const listings: Listing[] = [];

  for (let i = 0; i < count; i++) {
    const listing = await createListing(dataSource, {
      ...options,
      event,
    });
    listings.push(listing);
  }

  return listings;
}

/**
 * Creates a sold listing
 */
export async function createSoldListing(
  dataSource: DataSource,
  options: ListingFactoryOptions = {},
): Promise<Listing> {
  return createListing(dataSource, {
    ...options,
    status: 'sold',
  });
}

/**
 * Creates listings with different price points
 */
export async function createListingsWithPrices(
  dataSource: DataSource,
  prices: number[],
  options: ListingFactoryOptions = {},
): Promise<Listing[]> {
  const listings: Listing[] = [];

  for (const price of prices) {
    const listing = await createListing(dataSource, {
      ...options,
      price,
    });
    listings.push(listing);
  }

  return listings;
}

/**
 * Resets the listing counter (call in beforeEach if needed)
 */
export function resetListingCounter(): void {
  listingCounter = 0;
}
