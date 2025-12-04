import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { GetMessagesDto } from './dto/get-messages.dto';
import { UsersService } from '../users/users.service';

/**
 * Messages Service
 *
 * Handles all business logic for messaging:
 * - Creating and retrieving conversations
 * - Sending and retrieving messages
 * - Marking messages as read/delivered
 * - Managing unread counts
 * - Tracking response rates
 */
@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    private usersService: UsersService,
  ) {}

  /**
   * Find or create a conversation between two users
   * Ensures consistent ordering (user1Id < user2Id) to prevent duplicates
   *
   * @param user1Id - First user ID
   * @param user2Id - Second user ID
   * @returns Existing or newly created conversation
   */
  async findOrCreateConversation(
    user1Id: string,
    user2Id: string,
  ): Promise<Conversation> {
    if (user1Id === user2Id) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    // Always order user IDs to ensure consistency
    const [sortedUser1Id, sortedUser2Id] =
      user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

    // Try to find existing conversation
    let conversation = await this.conversationRepository.findOne({
      where: {
        user1Id: sortedUser1Id,
        user2Id: sortedUser2Id,
      },
    });

    // Create if doesn't exist
    if (!conversation) {
      conversation = this.conversationRepository.create({
        user1Id: sortedUser1Id,
        user2Id: sortedUser2Id,
      });
      await this.conversationRepository.save(conversation);
    }

    return conversation;
  }

  /**
   * Get all conversations for a user
   * Returns conversations sorted by most recent activity
   *
   * @param userId - ID of the user
   * @returns Array of conversations with other user populated
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.user1', 'user1')
      .leftJoinAndSelect('conversation.user2', 'user2')
      .where('conversation.user1Id = :userId OR conversation.user2Id = :userId', {
        userId,
      })
      .andWhere('conversation.lastMessageAt IS NOT NULL') // Only show conversations with messages
      .orderBy('conversation.lastMessageAt', 'DESC')
      .getMany();

    return conversations;
  }

  /**
   * Get a specific conversation by ID
   * Ensures the requesting user is a participant
   *
   * @param conversationId - ID of the conversation
   * @param userId - ID of the requesting user
   * @returns Conversation if found and user is participant
   */
  async getConversation(
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is a participant
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  /**
   * Send a new message
   * Creates message, updates conversation metadata, increments unread count
   * Also tracks response rates for the receiver
   *
   * @param senderId - ID of the user sending the message
   * @param receiverId - ID of the user receiving the message
   * @param text - Message content
   * @returns Created message with sender/receiver populated
   */
  async sendMessage(
    senderId: string,
    receiverId: string,
    text: string,
  ): Promise<Message> {
    // Find or create conversation
    const conversation = await this.findOrCreateConversation(senderId, receiverId);

    // Check if this is the first message in the conversation (new conversation initiated)
    const isFirstMessageInConversation = conversation.lastMessageAt === null;

    // Check if sender has previously sent a message in this conversation
    const senderHasPreviousMessage = await this.messageRepository.findOne({
      where: {
        conversationId: conversation.id,
        senderId: senderId,
      },
    });

    // Create the message
    const message = this.messageRepository.create({
      conversationId: conversation.id,
      senderId,
      receiverId,
      text,
    });

    await this.messageRepository.save(message);

    // Update conversation metadata
    conversation.lastMessageText = text;
    conversation.lastMessageAt = new Date();
    conversation.lastMessageSenderId = senderId;

    // Increment unread count for receiver
    if (conversation.user1Id === receiverId) {
      conversation.unreadCountUser1 += 1;
    } else {
      conversation.unreadCountUser2 += 1;
    }

    await this.conversationRepository.save(conversation);

    // Track response rate statistics
    if (isFirstMessageInConversation) {
      // New conversation: increment conversationsReceived for the receiver
      // This means someone initiated a conversation with them
      await this.usersService.incrementConversationsReceived(receiverId);
    } else if (!senderHasPreviousMessage) {
      // Sender is replying for the first time in an existing conversation
      // This means they're responding to a conversation someone else started
      await this.usersService.incrementConversationsReplied(senderId);
    }

    // Reload message with relations for return
    const savedMessage = await this.messageRepository.findOne({
      where: { id: message.id },
      relations: ['sender', 'receiver'],
    });

    if (!savedMessage) {
      throw new Error('Failed to retrieve saved message');
    }

    return savedMessage;
  }

  /**
   * Get messages for a conversation with pagination
   *
   * @param query - Query parameters (conversationId or otherUserId)
   * @param userId - ID of the requesting user
   * @returns Array of messages sorted by most recent first
   */
  async getMessages(query: GetMessagesDto, userId: string): Promise<Message[]> {
    let conversationId = query.conversationId;

    // If otherUserId provided, find conversation
    if (query.otherUserId) {
      const conversation = await this.findOrCreateConversation(
        userId,
        query.otherUserId,
      );
      conversationId = conversation.id;
    }

    if (!conversationId) {
      throw new BadRequestException(
        'Either conversationId or otherUserId must be provided',
      );
    }

    // Verify user is participant in this conversation
    await this.getConversation(conversationId, userId);

    // Fetch messages with pagination
    const messages = await this.messageRepository.find({
      where: { conversationId },
      relations: ['sender', 'receiver'],
      order: { createdAt: 'DESC' },
      take: query.limit || 50,
      skip: query.offset || 0,
    });

    return messages;
  }

  /**
   * Mark a message as delivered
   * Called when message is received by recipient's WebSocket
   *
   * @param messageId - ID of the message
   */
  async markAsDelivered(messageId: string): Promise<void> {
    await this.messageRepository.update(messageId, {
      isDelivered: true,
      deliveredAt: new Date(),
    });
  }

  /**
   * Mark all unread messages in a conversation as read
   * Called when user opens a conversation
   *
   * @param conversationId - ID of the conversation
   * @param userId - ID of the user marking as read
   * @returns Array of updated messages
   */
  async markConversationAsRead(
    conversationId: string,
    userId: string,
  ): Promise<Message[]> {
    // Verify user is participant
    const conversation = await this.getConversation(conversationId, userId);

    // Find all unread messages where this user is the receiver
    const unreadMessages = await this.messageRepository.find({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
    });

    if (unreadMessages.length === 0) {
      return [];
    }

    // Mark all as read
    const messageIds = unreadMessages.map((m) => m.id);
    await this.messageRepository.update(messageIds, {
      isRead: true,
      readAt: new Date(),
    });

    // Reset unread count for this user in the conversation
    if (conversation.user1Id === userId) {
      conversation.unreadCountUser1 = 0;
    } else {
      conversation.unreadCountUser2 = 0;
    }
    await this.conversationRepository.save(conversation);

    return unreadMessages;
  }

  /**
   * Get total unread message count for a user across all conversations
   *
   * @param userId - ID of the user
   * @returns Total number of unread messages
   */
  async getUnreadCount(userId: string): Promise<number> {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.user1Id = :userId OR conversation.user2Id = :userId', {
        userId,
      })
      .getMany();

    return conversations.reduce((total, conv) => {
      return total + conv.getUnreadCount(userId);
    }, 0);
  }

  /**
   * Search messages by text content
   * Searches only in conversations where user is a participant
   *
   * @param userId - ID of the user searching
   * @param searchText - Text to search for
   * @param limit - Maximum results to return
   * @returns Array of messages matching search
   */
  async searchMessages(
    userId: string,
    searchText: string,
    limit: number = 50,
  ): Promise<Message[]> {
    // Get all conversations for this user
    const conversations = await this.getConversations(userId);
    const conversationIds = conversations.map((c) => c.id);

    if (conversationIds.length === 0) {
      return [];
    }

    // Search messages
    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .where('message.conversationId IN (:...conversationIds)', {
        conversationIds,
      })
      .andWhere('message.text ILIKE :searchText', {
        searchText: `%${searchText}%`,
      })
      .orderBy('message.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return messages;
  }

  /**
   * Delete a message (soft delete by setting text to empty and marking as deleted)
   * Future enhancement: add isDeleted flag to Message entity
   *
   * @param messageId - ID of the message to delete
   * @param userId - ID of the user attempting to delete
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only sender can delete their own messages
    if (message.senderId !== userId) {
      throw new BadRequestException('You can only delete your own messages');
    }

    // For now, just update the text
    // Future: add isDeleted flag and handle UI accordingly
    await this.messageRepository.update(messageId, {
      text: 'This message was deleted',
      isEdited: true,
      editedAt: new Date(),
    });
  }
}
