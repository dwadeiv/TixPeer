import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Event Entity
 * Represents real-world events (concerts, sports games, theater shows, etc.)
 * Events are the central focus of the ticket marketplace - users create listings
 * offering or requesting tickets for specific events.
 */
@Entity('events')
export class Event {
  /**
   * Custom string ID (not auto-generated UUID)
   * Format examples: "ts1" (Taylor Swift), "nfl1" (NFL Game)
   * This allows semantic IDs that are human-readable in URLs
   */
  @PrimaryColumn()
  id: string;

  /** Event name/title (e.g., "Taylor Swift - Eras Tour", "Lakers vs Warriors") */
  @Column()
  name: string;

  /**
   * ISO date string of when the event occurs
   * Used for sorting upcoming events and filtering past events
   */
  @Column()
  date: string;

  /** Venue name where event takes place (e.g., "Madison Square Garden") */
  @Column()
  venue: string;

  /**
   * Full location string with city and state/country
   * (e.g., "New York, NY", "Los Angeles, CA")
   */
  @Column()
  location: string;

  /**
   * City name only, used for location-based filtering
   * Allows users to see events in their area
   */
  @Column()
  city: string;

  /** URL to event banner/poster image for display cards */
  @Column()
  image: string;

  /**
   * Event category for filtering and recommendations
   * Examples: "Music", "Sports", "Theater", "Comedy", "Festival"
   */
  @Column()
  category: string;

  /**
   * Count of active listings (offers + requests) for this event
   * Updated when listings are created/cancelled to show event popularity
   * Displayed as "{activeListings} listings" on event cards
   */
  @Column({ default: 0 })
  activeListings: number;

  /** When this event was added to the platform */
  @CreateDateColumn()
  createdAt: Date;

  /** Last time event details were updated */
  @UpdateDateColumn()
  updatedAt: Date;
}
