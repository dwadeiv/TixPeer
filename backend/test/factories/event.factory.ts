/**
 * Event Factory
 *
 * Generates Event entities for testing with realistic data
 */

import { Event } from '../../src/events/entities/event.entity';
import { DataSource } from 'typeorm';

interface EventFactoryOptions {
  name?: string;
  description?: string;
  venue?: string;
  city?: string;
  state?: string;
  country?: string;
  date?: Date;
  imageUrl?: string;
  category?: string;
  lat?: number;
  lng?: number;
}

let eventCounter = 0;

/**
 * Generates unique event data for testing
 */
export function generateEventData(options: EventFactoryOptions = {}): Partial<Event> {
  eventCounter++;
  const timestamp = Date.now();

  // Default to a future date (30 days from now)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  return {
    name: options.name ?? `Test Event ${eventCounter}_${timestamp}`,
    description: options.description ?? `Description for test event ${eventCounter}`,
    venue: options.venue ?? `Test Venue ${eventCounter}`,
    city: options.city ?? 'Test City',
    state: options.state ?? 'TX',
    country: options.country ?? 'USA',
    date: options.date ?? futureDate,
    imageUrl: options.imageUrl ?? null,
    category: options.category ?? 'concert',
    lat: options.lat ?? null,
    lng: options.lng ?? null,
  };
}

/**
 * Creates an Event entity in the database
 */
export async function createEvent(
  dataSource: DataSource,
  options: EventFactoryOptions = {},
): Promise<Event> {
  const eventRepository = dataSource.getRepository(Event);
  const eventData = generateEventData(options);

  const event = eventRepository.create(eventData);
  return eventRepository.save(event);
}

/**
 * Creates multiple Event entities
 */
export async function createEvents(
  dataSource: DataSource,
  count: number,
  options: EventFactoryOptions = {},
): Promise<Event[]> {
  const events: Event[] = [];

  for (let i = 0; i < count; i++) {
    const event = await createEvent(dataSource, options);
    events.push(event);
  }

  return events;
}

/**
 * Creates an event that has already passed (for testing expired scenarios)
 */
export async function createPastEvent(
  dataSource: DataSource,
  options: EventFactoryOptions = {},
): Promise<Event> {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 7); // 7 days ago

  return createEvent(dataSource, {
    ...options,
    date: pastDate,
  });
}

/**
 * Creates an event happening soon (for testing urgency scenarios)
 */
export async function createUpcomingEvent(
  dataSource: DataSource,
  options: EventFactoryOptions = {},
): Promise<Event> {
  const upcomingDate = new Date();
  upcomingDate.setHours(upcomingDate.getHours() + 24); // 24 hours from now

  return createEvent(dataSource, {
    ...options,
    date: upcomingDate,
  });
}

/**
 * Creates events of different categories
 */
export async function createEventsOfCategories(
  dataSource: DataSource,
  categories: string[],
): Promise<Event[]> {
  const events: Event[] = [];

  for (const category of categories) {
    const event = await createEvent(dataSource, { category });
    events.push(event);
  }

  return events;
}

/**
 * Resets the event counter (call in beforeEach if needed)
 */
export function resetEventCounter(): void {
  eventCounter = 0;
}

/**
 * Known city coordinates for geo-search testing
 * Distances are pre-calculated for test assertions
 */
export const TEST_LOCATIONS = {
  // New York City
  NYC: { lat: 40.7128, lng: -74.006, city: 'New York', state: 'NY' },
  // Los Angeles (~2,451 miles from NYC)
  LA: { lat: 34.0522, lng: -118.2437, city: 'Los Angeles', state: 'CA' },
  // Chicago (~713 miles from NYC)
  CHICAGO: { lat: 41.8781, lng: -87.6298, city: 'Chicago', state: 'IL' },
  // Boston (~190 miles from NYC)
  BOSTON: { lat: 42.3601, lng: -71.0589, city: 'Boston', state: 'MA' },
  // Philadelphia (~80 miles from NYC)
  PHILLY: { lat: 39.9526, lng: -75.1652, city: 'Philadelphia', state: 'PA' },
};

/**
 * Creates an event at a specific known location
 */
export async function createEventAtLocation(
  dataSource: DataSource,
  location: keyof typeof TEST_LOCATIONS,
  options: EventFactoryOptions = {},
): Promise<Event> {
  const loc = TEST_LOCATIONS[location];
  return createEvent(dataSource, {
    ...options,
    city: options.city ?? loc.city,
    state: options.state ?? loc.state,
    lat: options.lat ?? loc.lat,
    lng: options.lng ?? loc.lng,
  });
}
