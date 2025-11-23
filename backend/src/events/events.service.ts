import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';

/**
 * EventsService
 * Business logic layer for event management.
 * Handles CRUD operations and queries for events, with accurate listing counts.
 */
@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  /**
   * Retrieves all events with accurate activeListings count
   * Uses SQL query to count active listings for each event
   * This ensures the count always matches actual database state
   *
   * @returns Array of events ordered by date with accurate activeListings
   */
  async findAll(): Promise<Event[]> {
    // Use query builder to LEFT JOIN with listings and COUNT active ones
    const events = await this.eventsRepository
      .createQueryBuilder('event')
      .leftJoin('listings', 'listing', 'listing.eventId = event.id AND listing.status = :status', { status: 'active' })
      .select('event.*')
      .addSelect('COUNT(listing.id)', 'activeListings')
      .groupBy('event.id')
      .orderBy('event.date', 'ASC')
      .getRawMany();

    // Map raw results back to Event entities with updated activeListings
    return events.map(event => ({
      ...event,
      activeListings: parseInt(event.activeListings) || 0,
    }));
  }

  /**
   * Retrieves a single event by ID with accurate activeListings count
   * Counts active listings for this specific event
   *
   * @param id - Event ID
   * @returns Event with accurate activeListings, or null if not found
   */
  async findOne(id: string): Promise<Event | null> {
    const result = await this.eventsRepository
      .createQueryBuilder('event')
      .leftJoin('listings', 'listing', 'listing.eventId = event.id AND listing.status = :status', { status: 'active' })
      .select('event.*')
      .addSelect('COUNT(listing.id)', 'activeListings')
      .where('event.id = :id', { id })
      .groupBy('event.id')
      .getRawOne();

    if (!result) {
      return null;
    }

    return {
      ...result,
      activeListings: parseInt(result.activeListings) || 0,
    };
  }

  /**
   * Finds all events in a specific city with accurate activeListings count
   * Used for location-based filtering on homepage
   *
   * @param city - City name
   * @returns Events in this city, ordered by date with accurate activeListings
   */
  async findByCity(city: string): Promise<Event[]> {
    const events = await this.eventsRepository
      .createQueryBuilder('event')
      .leftJoin('listings', 'listing', 'listing.eventId = event.id AND listing.status = :status', { status: 'active' })
      .select('event.*')
      .addSelect('COUNT(listing.id)', 'activeListings')
      .where('event.city = :city', { city })
      .groupBy('event.id')
      .orderBy('event.date', 'ASC')
      .getRawMany();

    return events.map(event => ({
      ...event,
      activeListings: parseInt(event.activeListings) || 0,
    }));
  }

  /**
   * Finds all events in a specific category with accurate activeListings count
   * Used for category-based filtering (music, sports, etc.)
   *
   * @param category - Event category
   * @returns Events in this category, ordered by date with accurate activeListings
   */
  async findByCategory(category: string): Promise<Event[]> {
    const events = await this.eventsRepository
      .createQueryBuilder('event')
      .leftJoin('listings', 'listing', 'listing.eventId = event.id AND listing.status = :status', { status: 'active' })
      .select('event.*')
      .addSelect('COUNT(listing.id)', 'activeListings')
      .where('event.category = :category', { category })
      .groupBy('event.id')
      .orderBy('event.date', 'ASC')
      .getRawMany();

    return events.map(event => ({
      ...event,
      activeListings: parseInt(event.activeListings) || 0,
    }));
  }
}
