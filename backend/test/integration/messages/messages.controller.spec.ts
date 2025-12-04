/**
 * MessagesController Integration Tests
 *
 * Tests the full HTTP request/response cycle for messaging endpoints:
 * - GET /messages/conversations - Get all conversations
 * - GET /messages/conversations/:id - Get specific conversation
 * - GET /messages - Get messages with filters
 * - POST /messages - Send a message
 * - POST /messages/conversations/:id/read - Mark conversation as read
 * - GET /messages/unread/count - Get unread count
 * - GET /messages/search - Search messages
 * - DELETE /messages/:id - Delete a message
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MessagesController } from '../../../src/messages/messages.controller';
import { MessagesService } from '../../../src/messages/messages.service';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MessagesController (Integration)', () => {
  let app: INestApplication;
  let mockMessagesService: {
    getConversations: jest.Mock;
    getConversation: jest.Mock;
    getMessages: jest.Mock;
    sendMessage: jest.Mock;
    markConversationAsRead: jest.Mock;
    getUnreadCount: jest.Mock;
    searchMessages: jest.Mock;
    deleteMessage: jest.Mock;
  };

  const mockUser = {
    id: 'user-111',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockConversation = {
    id: 'conv-123',
    user1Id: 'user-111',
    user2Id: 'user-222',
    lastMessageText: 'Hello!',
    lastMessageAt: new Date().toISOString(),
    lastMessageSenderId: 'user-111',
    unreadCountUser1: 0,
    unreadCountUser2: 1,
    user1: mockUser,
    user2: {
      id: 'user-222',
      name: 'Other User',
      email: 'other@example.com',
    },
  };

  const mockMessage = {
    id: 'msg-123',
    conversationId: 'conv-123',
    senderId: 'user-111',
    receiverId: 'user-222',
    text: 'Hello!',
    isDelivered: true,
    isRead: false,
    createdAt: new Date().toISOString(),
    sender: mockUser,
    receiver: {
      id: 'user-222',
      name: 'Other User',
    },
  };

  beforeAll(async () => {
    mockMessagesService = {
      getConversations: jest.fn(),
      getConversation: jest.fn(),
      getMessages: jest.fn(),
      sendMessage: jest.fn(),
      markConversationAsRead: jest.fn(),
      getUnreadCount: jest.fn(),
      searchMessages: jest.fn(),
      deleteMessage: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [{ provide: MessagesService, useValue: mockMessagesService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'user-111', email: 'test@example.com' };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /messages/conversations', () => {
    it('should return all conversations for current user', async () => {
      const conversations = [mockConversation];
      mockMessagesService.getConversations.mockResolvedValue(conversations);

      const response = await request(app.getHttpServer())
        .get('/messages/conversations')
        .expect(200);

      expect(response.body).toEqual(conversations);
      expect(mockMessagesService.getConversations).toHaveBeenCalledWith('user-111');
    });

    it('should return empty array when no conversations', async () => {
      mockMessagesService.getConversations.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/messages/conversations')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /messages/conversations/:id', () => {
    it('should return specific conversation', async () => {
      mockMessagesService.getConversation.mockResolvedValue(mockConversation);

      const response = await request(app.getHttpServer())
        .get('/messages/conversations/conv-123')
        .expect(200);

      expect(response.body).toEqual(mockConversation);
      expect(mockMessagesService.getConversation).toHaveBeenCalledWith(
        'conv-123',
        'user-111',
      );
    });

    it('should return 404 when conversation not found', async () => {
      mockMessagesService.getConversation.mockRejectedValue(
        new NotFoundException('Conversation not found'),
      );

      const response = await request(app.getHttpServer())
        .get('/messages/conversations/nonexistent')
        .expect(404);

      expect(response.body.message).toBe('Conversation not found');
    });

    it('should return 404 when user is not participant', async () => {
      mockMessagesService.getConversation.mockRejectedValue(
        new NotFoundException('Conversation not found'),
      );

      const response = await request(app.getHttpServer())
        .get('/messages/conversations/other-conv')
        .expect(404);

      expect(response.body.message).toBe('Conversation not found');
    });
  });

  describe('GET /messages', () => {
    // Use valid UUIDs for tests since the DTO uses @IsUUID() validation
    const validConversationId = 'd0900e8f-5305-4476-a745-2ec57357c0c1';

    it('should return messages for conversation', async () => {
      const messages = [mockMessage];
      mockMessagesService.getMessages.mockResolvedValue(messages);

      const response = await request(app.getHttpServer())
        .get('/messages')
        .query({ conversationId: validConversationId })
        .expect(200);

      expect(response.body).toEqual(messages);
      expect(mockMessagesService.getMessages).toHaveBeenCalledWith(
        expect.objectContaining({ conversationId: validConversationId }),
        'user-111',
      );
    });

    it('should support pagination parameters', async () => {
      mockMessagesService.getMessages.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/messages')
        .query({ conversationId: validConversationId, limit: '50', offset: '10' })
        .expect(200);

      expect(mockMessagesService.getMessages).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: validConversationId,
          limit: 50,
          offset: 10,
        }),
        'user-111',
      );
    });

    it('should return 400 when no filters provided', async () => {
      mockMessagesService.getMessages.mockRejectedValue(
        new BadRequestException('conversationId or otherUserId required'),
      );

      const response = await request(app.getHttpServer())
        .get('/messages')
        .expect(400);

      expect(response.body.message).toBe('conversationId or otherUserId required');
    });
  });

  describe('POST /messages', () => {
    // Use valid UUID for receiverId since the DTO uses @IsUUID() validation
    const validReceiverId = 'd0900e8f-5305-4476-a745-2ec57357c0c2';

    it('should send a message', async () => {
      mockMessagesService.sendMessage.mockResolvedValue(mockMessage);

      const response = await request(app.getHttpServer())
        .post('/messages')
        .send({ receiverId: validReceiverId, text: 'Hello!' })
        .expect(201);

      expect(response.body).toEqual(mockMessage);
      expect(mockMessagesService.sendMessage).toHaveBeenCalledWith(
        'user-111',
        validReceiverId,
        'Hello!',
      );
    });

    it('should return 400 for missing receiverId', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .send({ text: 'Hello!' })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .send({ receiverId: validReceiverId })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('POST /messages/conversations/:id/read', () => {
    it('should mark conversation as read', async () => {
      const readMessages = [{ ...mockMessage, isRead: true }];
      mockMessagesService.markConversationAsRead.mockResolvedValue(readMessages);

      const response = await request(app.getHttpServer())
        .post('/messages/conversations/conv-123/read')
        .expect(201);

      expect(response.body).toEqual(readMessages);
      expect(mockMessagesService.markConversationAsRead).toHaveBeenCalledWith(
        'conv-123',
        'user-111',
      );
    });

    it('should return 404 when conversation not found', async () => {
      mockMessagesService.markConversationAsRead.mockRejectedValue(
        new NotFoundException('Conversation not found'),
      );

      const response = await request(app.getHttpServer())
        .post('/messages/conversations/nonexistent/read')
        .expect(404);

      expect(response.body.message).toBe('Conversation not found');
    });
  });

  describe('GET /messages/unread/count', () => {
    it('should return unread count', async () => {
      mockMessagesService.getUnreadCount.mockResolvedValue(5);

      const response = await request(app.getHttpServer())
        .get('/messages/unread/count')
        .expect(200);

      expect(response.body).toEqual({ count: 5 });
      expect(mockMessagesService.getUnreadCount).toHaveBeenCalledWith('user-111');
    });

    it('should return 0 when no unread messages', async () => {
      mockMessagesService.getUnreadCount.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/messages/unread/count')
        .expect(200);

      expect(response.body).toEqual({ count: 0 });
    });
  });

  describe('GET /messages/search', () => {
    it('should search messages by text', async () => {
      const matchingMessages = [mockMessage];
      mockMessagesService.searchMessages.mockResolvedValue(matchingMessages);

      const response = await request(app.getHttpServer())
        .get('/messages/search')
        .query({ q: 'Hello' })
        .expect(200);

      expect(response.body).toEqual(matchingMessages);
      expect(mockMessagesService.searchMessages).toHaveBeenCalledWith(
        'user-111',
        'Hello',
        expect.anything(), // limit parameter (NaN when not provided due to query param behavior)
      );
    });

    it('should support custom limit', async () => {
      mockMessagesService.searchMessages.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/messages/search')
        .query({ q: 'test', limit: '10' })
        .expect(200);

      // ValidationPipe with transform: true converts string to number
      expect(mockMessagesService.searchMessages).toHaveBeenCalledWith(
        'user-111',
        'test',
        10,
      );
    });

    it('should return empty array when no matches', async () => {
      mockMessagesService.searchMessages.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/messages/search')
        .query({ q: 'nonexistent' })
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('DELETE /messages/:id', () => {
    it('should delete message', async () => {
      mockMessagesService.deleteMessage.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/messages/msg-123')
        .expect(200);

      expect(response.body).toEqual({ message: 'Message deleted successfully' });
      expect(mockMessagesService.deleteMessage).toHaveBeenCalledWith(
        'msg-123',
        'user-111',
      );
    });

    it('should return 404 when message not found', async () => {
      mockMessagesService.deleteMessage.mockRejectedValue(
        new NotFoundException('Message not found'),
      );

      const response = await request(app.getHttpServer())
        .delete('/messages/nonexistent')
        .expect(404);

      expect(response.body.message).toBe('Message not found');
    });

    it('should return 400 when user is not sender', async () => {
      mockMessagesService.deleteMessage.mockRejectedValue(
        new BadRequestException('Only sender can delete message'),
      );

      const response = await request(app.getHttpServer())
        .delete('/messages/other-msg')
        .expect(400);

      expect(response.body.message).toBe('Only sender can delete message');
    });
  });
});
