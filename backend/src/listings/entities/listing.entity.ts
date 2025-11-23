import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';

/**
 * Listing Entity
 * Core entity representing a ticket listing in the marketplace.
 * Two types of listings:
 * - "offer": User has tickets they want to sell/trade
 * - "request": User wants to buy/trade for tickets they need
 *
 * This enables peer-to-peer ticket exchanges and trades.
 */
@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Type of listing determines the marketplace flow:
   * - "offer": User has tickets available (appears in "Offers" feed)
   * - "request": User seeking tickets (appears in "Requests" feed)
   */
  @Column()
  type: 'offer' | 'request';

  // ========== User Relationship ==========

  /** Full user object populated when querying with relations */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  /** ID of user who created this listing */
  @Column()
  userId: string;

  // ========== Event Relationship ==========

  /** Full event object populated when querying with relations */
  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event: Event;

  /** ID of the event this listing is for */
  @Column()
  eventId: string;

  /**
   * Denormalized event data stored directly on listing
   * This allows displaying listings without always joining to Events table
   * Improves query performance for listing feeds
   */
  @Column()
  eventName: string;

  @Column()
  eventDate: string;

  @Column()
  eventVenue: string;

  @Column()
  eventImage: string;

  // ========== Ticket Details ==========

  /**
   * Number of tickets in this listing
   * For offers: how many tickets user has
   * For requests: how many tickets user needs
   */
  @Column()
  ticketCount: number;

  /**
   * Seat location details (optional, more common for "offer" listings)
   * Examples: "Section 104, Row 15, Seats 1-2", "Floor A, Row 3"
   * Helps build trust by showing user has real tickets
   */
  @Column({ nullable: true })
  sectionInfo: string;

  /**
   * User's description of the listing
   * For offers: why they're selling, ideal trade scenarios
   * For requests: what they're looking for, any specific requirements
   */
  @Column('text')
  description: string;

  /**
   * What user wants in exchange (optional but recommended)
   * For offers: "Looking for Taylor Swift tickets any date" or "Cash only"
   * For requests: "Have Warriors tickets to trade"
   * Helps facilitate trades and barter
   */
  @Column({ nullable: true, type: 'text' })
  lookingFor: string;

  /**
   * Listing status in the marketplace lifecycle:
   * - "active": Currently displayed in feeds, user can be contacted
   * - "completed": Trade/sale finished successfully
   * - "cancelled": User removed listing or tickets no longer available
   */
  @Column({ default: 'active' })
  status: 'active' | 'completed' | 'cancelled';

  /** When this listing was created */
  @CreateDateColumn()
  createdAt: Date;

  /** Last time listing details were updated */
  @UpdateDateColumn()
  updatedAt: Date;
}
