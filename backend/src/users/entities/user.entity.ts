import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

/**
 * User Entity
 * Represents a user account in the TixPeer marketplace.
 * Users can create listings (offers/requests), trade tickets, and build trust scores.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Unique email address for login and communication */
  @Column({ unique: true })
  email: string;

  /**
   * Bcrypt-hashed password for authentication
   * @Exclude decorator ensures password is never sent in API responses
   */
  @Column()
  @Exclude()
  password: string;

  /** Display name shown on profile and listings */
  @Column()
  name: string;

  /** Optional phone number for verified users */
  @Column({ nullable: true })
  phone: string;

  /** Account status - inactive users cannot create listings or trade */
  @Column({ default: true })
  isActive: boolean;

  // ========== Email Verification Fields ==========

  /** Whether the user's email address has been verified */
  @Column({ default: false })
  isEmailVerified: boolean;

  /**
   * Token sent via email for email verification
   * Cleared after successful verification
   */
  @Column({ nullable: true })
  @Exclude()
  emailVerificationToken: string;

  /**
   * Expiry time for email verification token (24 hours from generation)
   * Prevents use of old/leaked tokens
   */
  @Column({ nullable: true })
  emailVerificationTokenExpiry: Date;

  // ========== Profile & Trust System Fields ==========

  /**
   * Profile picture URL from Cloudinary CDN
   * Format: https://res.cloudinary.com/{cloud_name}/image/upload/...
   */
  @Column({ nullable: true })
  avatar: string;

  /**
   * Trust score from 0.0 to 5.0 based on user behavior and reviews
   * New users start at maximum (5.0) - trust can only be lost through negative actions
   * This "trust by default" approach encourages participation and community growth
   */
  @Column({ type: 'decimal', precision: 3, scale: 1, default: 5.0 })
  trustScore: number;

  /**
   * Total number of successful ticket exchanges
   * Displayed on profile to show trading history
   */
  @Column({ default: 0 })
  completedTrades: number;

  /** User's bio/description for their profile */
  @Column({ type: 'text', nullable: true })
  bio: string;

  /** City/region for local ticket exchanges and filtering */
  @Column({ nullable: true })
  location: string;

  /**
   * Categories of events user is interested in (Sports, Music, Theater, etc.)
   * Stored as comma-separated array for filtering and recommendations
   */
  @Column({ type: 'simple-array', nullable: true })
  favoriteEvents: string[];

  /**
   * Earned badges like "Verified", "Top Trader", "Quick Responder"
   * Displayed on profile to build credibility
   */
  @Column({ type: 'simple-array', nullable: true })
  badges: string[];

  /**
   * Average response time for messages (e.g., "< 1 hour", "< 4 hours")
   * Calculated from message activity to help users find responsive traders
   */
  @Column({ nullable: true })
  responseTime: string;

  /**
   * Whether user has completed identity/phone verification
   * Verified users get a badge and higher trust from other users
   */
  @Column({ default: false })
  verifiedUser: boolean;

  // ========== Relations ==========

  /** Legacy tickets this user is selling (from old Ticket entity) */
  @OneToMany(() => Ticket, (ticket) => ticket.seller)
  ticketsForSale: Ticket[];

  /** Transactions where this user is the buyer */
  @OneToMany(() => Transaction, (transaction) => transaction.buyer)
  purchases: Transaction[];

  /** Transactions where this user is the seller */
  @OneToMany(() => Transaction, (transaction) => transaction.seller)
  sales: Transaction[];

  // ========== Timestamps ==========

  /**
   * When the user joined TixPeer (displayed publicly on profile)
   * Defaults to account creation time
   * Separate from createdAt for flexibility (e.g., if migrating from another platform)
   */
  @CreateDateColumn()
  joinedDate: Date;

  /** When the user account was created (internal tracking) */
  @CreateDateColumn()
  createdAt: Date;

  /** Last time user profile was updated */
  @UpdateDateColumn()
  updatedAt: Date;
}
