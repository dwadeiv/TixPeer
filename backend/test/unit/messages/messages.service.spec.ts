/**
 * MessagesService Unit Tests
 *
 * Tests messaging logic including:
 * - Conversation creation and retrieval
 * - Message sending and retrieval
 * - Read/delivered status tracking
 * - Unread counts
 * - Response rate tracking
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MessagesService } from '../../../src/messages/messages.service';
import { Message } from '../../../src/messages/entities/message.entity';
import { Conversation } from '../../../src/messages/entities/conversation.entity';
import { UsersService } from '../../../src/users/users.service';

describe('MessagesService', () => {
  let messagesService: MessagesService;
  let mockMessageRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let mockConversationRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let mockUsersService: {
    incrementConversationsReceived: jest.Mock;
    incrementConversationsReplied: jest.Mock;
  };

  // Mock data
  const mockUser1 = {
    id: 'user-111',
    email: 'user1@example.com',
    name: 'User One',
  };

  const mockUser2 = {
    id: 'user-222',
    email: 'user2@example.com',
    name: 'User Two',
  };

  const mockConversation = {
    id: 'conv-123',
    user1Id: 'user-111',
    user2Id: 'user-222',
    lastMessageText: undefined as string | undefined,
    lastMessageAt: undefined as Date | undefined,
    lastMessageSenderId: undefined as string | undefined,
    unreadCountUser1: 0,
    unreadCountUser2: 0,
    getUnreadCount: jest.fn((userId: string) => 0),
  };

  const mockMessage = {
    id: 'msg-123',
    conversationId: 'conv-123',
    senderId: 'user-111',
    receiverId: 'user-222',
    text: 'Hello!',
    isDelivered: false,
    isRead: false,
    isEdited: false,
    createdAt: new Date(),
  };

  // Helper to create mock query builder
  const createMockQueryBuilder = () => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  });

  beforeEach(async () => {
    mockMessageRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockConversationRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockUsersService = {
      incrementConversationsReceived: jest.fn(),
      incrementConversationsReplied: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: getRepositoryToken(Message), useValue: mockMessageRepository },
        { provide: getRepositoryToken(Conversation), useValue: mockConversationRepository },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    messagesService = module.get<MessagesService>(MessagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreateConversation', () => {
    it('should return existing conversation if found', async () => {
      mockConversationRepository.findOne.mockResolvedValue(mockConversation);

      const result = await messagesService.findOrCreateConversation('user-111', 'user-222');

      expect(result).toEqual(mockConversation);
      expect(mockConversationRepository.create).not.toHaveBeenCalled();
    });

    it('should create new conversation if not found', async () => {
      mockConversationRepository.findOne.mockResolvedValue(null);
      mockConversationRepository.create.mockReturnValue(mockConversation);
      mockConversationRepository.save.mockResolvedValue(mockConversation);

      const result = await messagesService.findOrCreateConversation('user-111', 'user-222');

      expect(mockConversationRepository.create).toHaveBeenCalledWith({
        user1Id: 'user-111',
        user2Id: 'user-222',
      });
      expect(mockConversationRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockConversation);
    });

    it('should order user IDs consistently (smaller ID first)', async () => {
      mockConversationRepository.findOne.mockResolvedValue(null);
      mockConversationRepository.create.mockReturnValue(mockConversation);
      mockConversationRepository.save.mockResolvedValue(mockConversation);

      await messagesService.findOrCreateConversation('user-222', 'user-111');

      expect(mockConversationRepository.findOne).toHaveBeenCalledWith({
        where: {
          user1Id: 'user-111',
          user2Id: 'user-222',
        },
      });
    });

    it('should throw BadRequestException when creating conversation with self', async () => {
      await expect(messagesService.findOrCreateConversation('user-111', 'user-111')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getConversations', () => {
    it('should return conversations for a user sorted by lastMessageAt', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue([mockConversation]);
      mockConversationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await messagesService.getConversations('user-111');

      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('conversation.lastMessageAt', 'DESC');
      expect(result).toEqual([mockConversation]);
    });
  });

  describe('getConversation', () => {
    it('should return conversation when user is participant', async () => {
      mockConversationRepository.findOne.mockResolvedValue(mockConversation);

      const result = await messagesService.getConversation('conv-123', 'user-111');

      expect(result).toEqual(mockConversation);
    });

    it('should throw NotFoundException when conversation not found', async () => {
      mockConversationRepository.findOne.mockResolvedValue(null);

      await expect(messagesService.getConversation('nonexistent', 'user-111')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when user is not participant', async () => {
      mockConversationRepository.findOne.mockResolvedValue(mockConversation);

      await expect(messagesService.getConversation('conv-123', 'user-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      mockConversationRepository.findOne.mockResolvedValue(null);
      mockConversationRepository.create.mockReturnValue({
        ...mockConversation,
        lastMessageAt: undefined,
        unreadCountUser1: 0,
        unreadCountUser2: 0,
      });
      mockConversationRepository.save.mockResolvedValue(mockConversation);
      mockMessageRepository.create.mockReturnValue(mockMessage);
      mockMessageRepository.save.mockResolvedValue(mockMessage);
      mockMessageRepository.findOne.mockResolvedValue({
        ...mockMessage,
        sender: mockUser1,
        receiver: mockUser2,
      });
    });

    it('should create message and update conversation', async () => {
      const result = await messagesService.sendMessage('user-111', 'user-222', 'Hello!');

      expect(mockMessageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          senderId: 'user-111',
          receiverId: 'user-222',
          text: 'Hello!',
        }),
      );
      expect(mockMessageRepository.save).toHaveBeenCalled();
      expect(mockConversationRepository.save).toHaveBeenCalled();
      expect(result.text).toBe('Hello!');
    });

    it('should track response rate for new conversation', async () => {
      // Mock a fresh conversation with no previous messages
      const newConv = {
        ...mockConversation,
        lastMessageAt: null, // null indicates first message
        unreadCountUser1: 0,
        unreadCountUser2: 0,
      };
      mockConversationRepository.findOne.mockResolvedValue(null); // No existing conversation
      mockConversationRepository.create.mockReturnValue(newConv);
      mockConversationRepository.save.mockResolvedValue(newConv);
      mockMessageRepository.findOne
        .mockResolvedValueOnce(null) // No previous messages from sender
        .mockResolvedValue({
          ...mockMessage,
          sender: mockUser1,
          receiver: mockUser2,
        });

      await messagesService.sendMessage('user-111', 'user-222', 'Hello!');

      // First message in new conversation triggers incrementConversationsReceived for receiver
      expect(mockUsersService.incrementConversationsReceived).toHaveBeenCalledWith('user-222');
    });
  });

  describe('getMessages', () => {
    it('should return messages for a conversation with pagination', async () => {
      mockConversationRepository.findOne.mockResolvedValue(mockConversation);
      mockMessageRepository.find.mockResolvedValue([mockMessage]);

      const result = await messagesService.getMessages(
        { conversationId: 'conv-123', limit: 50, offset: 0 },
        'user-111',
      );

      expect(mockMessageRepository.find).toHaveBeenCalledWith({
        where: { conversationId: 'conv-123' },
        relations: ['sender', 'receiver'],
        order: { createdAt: 'DESC' },
        take: 50,
        skip: 0,
      });
      expect(result).toEqual([mockMessage]);
    });

    it('should throw BadRequestException when neither conversationId nor otherUserId provided', async () => {
      await expect(messagesService.getMessages({}, 'user-111')).rejects.toThrow(BadRequestException);
    });
  });

  describe('markAsDelivered', () => {
    it('should update message with delivered status', async () => {
      mockMessageRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await messagesService.markAsDelivered('msg-123');

      expect(mockMessageRepository.update).toHaveBeenCalledWith('msg-123', {
        isDelivered: true,
        deliveredAt: expect.any(Date),
      });
    });
  });

  describe('markConversationAsRead', () => {
    it('should mark all unread messages as read and reset unread count', async () => {
      const convWithUnread = {
        ...mockConversation,
        unreadCountUser1: 5,
      };
      mockConversationRepository.findOne.mockResolvedValue(convWithUnread);
      const unreadMessages = [
        { ...mockMessage, id: 'msg-1', isRead: false },
        { ...mockMessage, id: 'msg-2', isRead: false },
      ];
      mockMessageRepository.find.mockResolvedValue(unreadMessages);
      mockMessageRepository.update.mockResolvedValue({ affected: 2, raw: {}, generatedMaps: [] });
      mockConversationRepository.save.mockResolvedValue(convWithUnread);

      const result = await messagesService.markConversationAsRead('conv-123', 'user-111');

      expect(mockMessageRepository.update).toHaveBeenCalledWith(['msg-1', 'msg-2'], {
        isRead: true,
        readAt: expect.any(Date),
      });
      expect(result).toEqual(unreadMessages);
    });

    it('should return empty array when no unread messages', async () => {
      mockConversationRepository.findOne.mockResolvedValue(mockConversation);
      mockMessageRepository.find.mockResolvedValue([]);

      const result = await messagesService.markConversationAsRead('conv-123', 'user-111');

      expect(result).toEqual([]);
      expect(mockMessageRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return total unread count across all conversations', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      const convs = [
        { ...mockConversation, getUnreadCount: jest.fn().mockReturnValue(3) },
        { ...mockConversation, id: 'conv-456', getUnreadCount: jest.fn().mockReturnValue(2) },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(convs);
      mockConversationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await messagesService.getUnreadCount('user-111');

      expect(result).toBe(5);
    });
  });

  describe('deleteMessage', () => {
    it('should soft delete message when user is sender', async () => {
      mockMessageRepository.findOne.mockResolvedValue(mockMessage);
      mockMessageRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await messagesService.deleteMessage('msg-123', 'user-111');

      expect(mockMessageRepository.update).toHaveBeenCalledWith('msg-123', {
        text: 'This message was deleted',
        isEdited: true,
        editedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException when message not found', async () => {
      mockMessageRepository.findOne.mockResolvedValue(null);

      await expect(messagesService.deleteMessage('nonexistent', 'user-111')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when user is not sender', async () => {
      mockMessageRepository.findOne.mockResolvedValue(mockMessage);

      await expect(messagesService.deleteMessage('msg-123', 'user-222')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
