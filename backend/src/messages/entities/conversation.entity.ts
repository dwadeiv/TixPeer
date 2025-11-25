import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Message } from './message.entity';

/**
 * Conversation Entity
 * Represents a chat thread between two users.
 * Each conversation has exactly 2 participants (peer-to-peer messaging).
 */
@Entity('conversations')
@Index(['user1Id', 'user2Id'], { unique: true }) // Prevent duplicate conversations
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * First participant in the conversation
   * Always stored with lower UUID to maintain consistency (user1Id < user2Id)
   */
  @Column({ type: 'uuid' })
  user1Id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user1Id' })
  user1: User;

  /**
   * Second participant in the conversation
   * Always stored with higher UUID to maintain consistency (user1Id < user2Id)
   */
  @Column({ type: 'uuid' })
  user2Id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user2Id' })
  user2: User;

  /**
   * Preview of the last message sent in this conversation
   * Used for conversation list display
   */
  @Column({ type: 'text', nullable: true })
  lastMessageText: string;

  /**
   * Timestamp of the last message
   * Used for sorting conversations by recent activity
   */
  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date;

  /**
   * ID of the user who sent the last message
   * Used to determine message preview formatting
   */
  @Column({ type: 'uuid', nullable: true })
  lastMessageSenderId: string;

  /**
   * Number of unread messages for user1
   */
  @Column({ default: 0 })
  unreadCountUser1: number;

  /**
   * Number of unread messages for user2
   */
  @Column({ default: 0 })
  unreadCountUser2: number;

  /**
   * All messages in this conversation
   */
  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Helper method to get the other user in the conversation
   * @param currentUserId - ID of the current user
   * @returns The other participant's user object
   */
  getOtherUser(currentUserId: string): User {
    return this.user1Id === currentUserId ? this.user2 : this.user1;
  }

  /**
   * Helper method to get unread count for a specific user
   * @param userId - ID of the user
   * @returns Number of unread messages for that user
   */
  getUnreadCount(userId: string): number {
    return this.user1Id === userId ? this.unreadCountUser1 : this.unreadCountUser2;
  }
}
