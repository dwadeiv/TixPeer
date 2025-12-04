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
