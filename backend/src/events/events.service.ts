import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';

/**
 * Search parameters for location-based event search
 */
interface SearchNearbyParams {
  lat: number;
  lng: number;
  radius: number; // in miles
  searchQuery?: string;
  category?: string;
}

/**
 * EventsService
 * Business logic layer for event management.
 * Handles CRUD operations and queries for events, with accurate listing counts.
 * Supports geo-based search using Haversine formula for distance calculations.
 */
@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  /**
   * Haversine formula to calculate distance between two points in miles
   * Used for geo-based event filtering
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

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

  /**
   * Search events by name with partial matching
   * Case-insensitive search across event names
   *
   * @param query - Search string to match against event names
   * @returns Events matching the search query, ordered by date
   */
  async searchByName(query: string): Promise<Event[]> {
    const events = await this.eventsRepository
      .createQueryBuilder('event')
      .leftJoin('listings', 'listing', 'listing.eventId = event.id AND listing.status = :status', { status: 'active' })
      .select('event.*')
      .addSelect('COUNT(listing.id)', 'activeListings')
      .where('LOWER(event.name) LIKE LOWER(:query)', { query: `%${query}%` })
      .groupBy('event.id')
      .orderBy('event.date', 'ASC')
      .getRawMany();

    return events.map(event => ({
      ...event,
      activeListings: parseInt(event.activeListings) || 0,
    }));
  }

  /**
   * Search events within a radius of a location
   * Uses Haversine formula to calculate distances and filter results
   *
   * Features:
   * - Filters events within specified radius (default 100 miles)
   * - Optional text search within results
   * - Optional category filter
   * - Results sorted by distance from search location
   *
   * @param params - Search parameters including lat, lng, radius, optional query and category
   * @returns Object containing filtered events and metadata about the search
   */
  async searchNearby(params: SearchNearbyParams): Promise<{ events: Event[]; searchedNearby: boolean; locationName?: string }> {
    const { lat, lng, radius, searchQuery, category } = params;

    // Build query with optional filters
    let queryBuilder = this.eventsRepository
      .createQueryBuilder('event')
      .leftJoin('listings', 'listing', 'listing.eventId = event.id AND listing.status = :status', { status: 'active' })
      .select('event.*')
      .addSelect('COUNT(listing.id)', 'activeListings')
      .where('event.lat IS NOT NULL AND event.lng IS NOT NULL');

    // Add text search filter if provided
    if (searchQuery) {
      queryBuilder = queryBuilder.andWhere('LOWER(event.name) LIKE LOWER(:searchQuery)', {
        searchQuery: `%${searchQuery}%`,
      });
    }

    // Add category filter if provided
    if (category) {
      queryBuilder = queryBuilder.andWhere('event.category = :category', { category });
    }

    const rawEvents = await queryBuilder
      .groupBy('event.id')
      .getRawMany();

    // Calculate distance for each event and filter by radius
    const eventsWithDistance = rawEvents
      .map(event => {
        const distance = this.calculateDistance(lat, lng, parseFloat(event.lat), parseFloat(event.lng));
        return {
          ...event,
          activeListings: parseInt(event.activeListings) || 0,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        };
      })
      .filter(event => event.distance <= radius)
      .sort((a, b) => a.distance - b.distance); // Sort by distance

    // Find the closest city for display purposes
    let locationName: string | undefined;
    if (eventsWithDistance.length > 0) {
      locationName = eventsWithDistance[0].city;
    }

    return {
      events: eventsWithDistance,
      searchedNearby: true,
      locationName,
    };
  }
}
