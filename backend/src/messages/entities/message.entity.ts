import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Conversation } from './conversation.entity';

/**
 * Message Entity
 * Represents an individual message sent within a conversation.
 * Supports text messages with delivery and read status tracking.
 */
@Entity('messages')
@Index(['conversationId', 'createdAt']) // Optimize message history queries
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The conversation this message belongs to
   */
  @Column({ type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  /**
   * User who sent this message
   */
  @Column({ type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  /**
   * User who will receive this message
   */
  @Column({ type: 'uuid' })
  receiverId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  /**
   * Message text content
   * Max length enforced at application level (10,000 characters)
   */
  @Column({ type: 'text' })
  text: string;

  /**
   * Whether the message has been delivered to the recipient
   * Set to true when recipient's WebSocket receives the message
   */
  @Column({ default: false })
  isDelivered: boolean;

  /**
   * Timestamp when message was delivered
   */
  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  /**
   * Whether the recipient has read the message
   * Set to true when recipient opens the conversation
   */
  @Column({ default: false })
  isRead: boolean;

  /**
   * Timestamp when message was read
   */
  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  /**
   * Whether this message was edited
   * Future feature: allow users to edit sent messages
   */
  @Column({ default: false })
  isEdited: boolean;

  /**
   * Timestamp when message was last edited
   */
  @Column({ type: 'timestamp', nullable: true })
  editedAt: Date;

  /**
   * When the message was sent
   */
  @CreateDateColumn()
  createdAt: Date;
}
