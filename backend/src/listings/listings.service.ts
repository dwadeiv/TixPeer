import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from './entities/listing.entity';
import { CreateListingDto } from './dto/create-listing.dto';

/**
 * ListingsService
 * Business logic layer for marketplace listings.
 * Handles CRUD operations and queries for ticket offers and requests.
 */
@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
  ) {}

  /**
   * Creates a new listing (offer or request) in the marketplace
   * @param createListingDto - Listing data from user input
   * @returns Saved listing with generated ID
   */
  create(createListingDto: CreateListingDto): Promise<Listing> {
    const listing = this.listingsRepository.create(createListingDto);
    return this.listingsRepository.save(listing);
  }

  /**
   * Retrieves all active listings in the marketplace
   * Includes user and event relations to display complete listing cards
   * Only shows "active" listings (filters out completed/cancelled)
   * Orders by newest first to show latest opportunities
   *
   * @returns Array of listings with populated user and event data
   */
  findAll(): Promise<Listing[]> {
    return this.listingsRepository.find({
      relations: ['user', 'event'], // Populate user and event data to avoid N+1 queries
      where: { status: 'active' }, // Only show active listings in marketplace feed
      order: { createdAt: 'DESC' }, // Newest listings first
    });
  }

  /**
   * Retrieves a single listing by ID
   * Used for listing detail pages where users view full information
   *
   * @param id - UUID of the listing
   * @returns Listing with user and event data, or null if not found
   */
  findOne(id: string): Promise<Listing | null> {
    return this.listingsRepository.findOne({
      where: { id },
      relations: ['user', 'event'], // Include full user/event data for detail view
    });
  }

  /**
   * Finds all active listings for a specific event
   * Used on event detail pages to show who has/wants tickets for that event
   * Only includes user relation (event data already known from context)
   *
   * @param eventId - ID of the event
   * @returns Active listings for this event, sorted by newest first
   */
  findByEvent(eventId: string): Promise<Listing[]> {
    return this.listingsRepository.find({
      where: { eventId, status: 'active' },
      relations: ['user'], // Event already known, only need user info
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Finds all active listings created by a specific user
   * Used on user profile pages to show their current marketplace activity
   * Only includes event relation (user data already known from context)
   *
   * @param userId - UUID of the user
   * @returns User's active listings, sorted by newest first
   */
  findByUser(userId: string): Promise<Listing[]> {
    return this.listingsRepository.find({
      where: { userId, status: 'active' },
      relations: ['event'], // User already known, only need event info
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Updates a listing's data (e.g., change description, mark as completed)
   * Returns the updated listing with fresh data from database
   *
   * @param id - UUID of listing to update
   * @param updateData - Partial listing data to update
   * @returns Updated listing, or null if not found
   */
  async update(id: string, updateData: Partial<Listing>): Promise<Listing | null> {
    await this.listingsRepository.update(id, updateData);
    return this.findOne(id); // Re-fetch to return updated data with relations
  }

  /**
   * Permanently deletes a listing from the database
   * Note: Consider soft delete (status='cancelled') for audit trail
   *
   * @param id - UUID of listing to delete
   */
  async remove(id: string): Promise<void> {
    await this.listingsRepository.delete(id);
  }
}
