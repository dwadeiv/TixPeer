/**
 * MessagesGateway WebSocket Tests
 *
 * Tests real-time messaging functionality including:
 * - Connection/disconnection handling
 * - Message sending and receiving
 * - Typing indicators
 * - Read receipts
 * - Online status tracking
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MessagesGateway } from '../../src/messages/messages.gateway';
import { MessagesService } from '../../src/messages/messages.service';
import { UsersService } from '../../src/users/users.service';
import { WsJwtGuard } from '../../src/auth/guards/ws-jwt.guard';
import { Socket, Server } from 'socket.io';

describe('MessagesGateway', () => {
  let gateway: MessagesGateway;
  let mockMessagesService: {
    sendMessage: jest.Mock;
    markAsDelivered: jest.Mock;
    markConversationAsRead: jest.Mock;
    getConversations: jest.Mock;
  };
  let mockUsersService: {
    updateOnlineStatus: jest.Mock;
  };

  // Mock socket helper
  const createMockSocket = (userId: string, socketId: string): Partial<Socket> => ({
    id: socketId,
    handshake: {
      auth: { userId },
      headers: {},
      time: new Date().toISOString(),
      address: '127.0.0.1',
      xdomain: false,
      secure: false,
      issued: Date.now(),
      url: '/messages',
      query: {},
    } as Socket['handshake'],
    join: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    broadcast: {
      emit: jest.fn(),
    } as any,
    to: jest.fn().mockReturnThis(),
  });

  // Mock server helper
  const createMockServer = (): Partial<Server> => ({
    emit: jest.fn(),
    to: jest.fn().mockReturnValue({
      emit: jest.fn(),
    }),
  });

  beforeEach(async () => {
    mockMessagesService = {
      sendMessage: jest.fn(),
      markAsDelivered: jest.fn(),
      markConversationAsRead: jest.fn(),
      getConversations: jest.fn(),
    };

    mockUsersService = {
      updateOnlineStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesGateway,
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    })
      .overrideGuard(WsJwtGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    gateway = module.get<MessagesGateway>(MessagesGateway);
    // Set up mock server
    gateway.server = createMockServer() as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should track user connection and update online status', async () => {
      const mockSocket = createMockSocket('user-123', 'socket-abc');
      mockMessagesService.getConversations.mockResolvedValue([]);
      mockUsersService.updateOnlineStatus.mockResolvedValue(undefined);

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockUsersService.updateOnlineStatus).toHaveBeenCalledWith('user-123', true);
      expect(mockSocket.join).toHaveBeenCalledWith('user:user-123');
      expect(mockSocket.broadcast!.emit).toHaveBeenCalledWith('user:online', {
        userId: 'user-123',
      });
    });

    it('should disconnect socket when no userId in auth', async () => {
      const mockSocket = createMockSocket('', 'socket-abc');
      mockSocket.handshake!.auth = {}; // No userId

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockUsersService.updateOnlineStatus).not.toHaveBeenCalled();
    });

    it('should send unread message counts on connection', async () => {
      const mockSocket = createMockSocket('user-123', 'socket-abc');
      const mockConversations = [
        {
          id: 'conv-1',
          getUnreadCount: jest.fn().mockReturnValue(5),
        },
        {
          id: 'conv-2',
          getUnreadCount: jest.fn().mockReturnValue(0),
        },
      ];
      mockMessagesService.getConversations.mockResolvedValue(mockConversations);
      mockUsersService.updateOnlineStatus.mockResolvedValue(undefined);

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockSocket.emit).toHaveBeenCalledWith('conversations:unread', {
        conversations: [
          { conversationId: 'conv-1', unreadCount: 5 },
          { conversationId: 'conv-2', unreadCount: 0 },
        ],
      });
    });
  });

  describe('handleDisconnect', () => {
    it('should update online status and broadcast offline event', async () => {
      const mockSocket = createMockSocket('user-123', 'socket-abc');
      mockMessagesService.getConversations.mockResolvedValue([]);
      mockUsersService.updateOnlineStatus.mockResolvedValue(undefined);

      // First connect the user
      await gateway.handleConnection(mockSocket as Socket);

      // Then disconnect
      gateway.handleDisconnect(mockSocket as Socket);

      expect(mockUsersService.updateOnlineStatus).toHaveBeenCalledWith('user-123', false);
      expect(mockSocket.broadcast!.emit).toHaveBeenCalledWith('user:offline', {
        userId: 'user-123',
        lastSeen: expect.any(Date),
      });
    });

    it('should do nothing if socket was not tracked', () => {
      const mockSocket = createMockSocket('unknown-user', 'unknown-socket');

      gateway.handleDisconnect(mockSocket as Socket);

      // updateOnlineStatus is only called with 'false' for tracked users
      expect(mockUsersService.updateOnlineStatus).not.toHaveBeenCalledWith(
        'unknown-user',
        false,
      );
    });
  });

  describe('handleSendMessage', () => {
    it('should save message and emit to sender and receiver', async () => {
      const mockSocket = createMockSocket('user-111', 'socket-sender');
      const mockReceiverSocket = createMockSocket('user-222', 'socket-receiver');

      // Set up both users as connected
      mockMessagesService.getConversations.mockResolvedValue([]);
      mockUsersService.updateOnlineStatus.mockResolvedValue(undefined);
      await gateway.handleConnection(mockSocket as Socket);
      await gateway.handleConnection(mockReceiverSocket as Socket);

      const mockMessage = {
        id: 'msg-123',
        senderId: 'user-111',
        receiverId: 'user-222',
        text: 'Hello!',
      };
      mockMessagesService.sendMessage.mockResolvedValue(mockMessage);
      mockMessagesService.markAsDelivered.mockResolvedValue(undefined);

      const result = await gateway.handleSendMessage(
        { receiverId: 'user-222', text: 'Hello!' },
        mockSocket as Socket,
      );

      expect(mockMessagesService.sendMessage).toHaveBeenCalledWith(
        'user-111',
        'user-222',
        'Hello!',
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('message:sent', { message: mockMessage });
      expect(result).toEqual({ success: true, message: mockMessage });
    });

    it('should mark message as delivered when receiver is online', async () => {
      const mockSocket = createMockSocket('user-111', 'socket-sender');
      const mockReceiverSocket = createMockSocket('user-222', 'socket-receiver');

      // Set up both users as connected
      mockMessagesService.getConversations.mockResolvedValue([]);
      mockUsersService.updateOnlineStatus.mockResolvedValue(undefined);
      await gateway.handleConnection(mockSocket as Socket);
      await gateway.handleConnection(mockReceiverSocket as Socket);

      const mockMessage = { id: 'msg-123', senderId: 'user-111', receiverId: 'user-222' };
      mockMessagesService.sendMessage.mockResolvedValue(mockMessage);
      mockMessagesService.markAsDelivered.mockResolvedValue(undefined);

      await gateway.handleSendMessage(
        { receiverId: 'user-222', text: 'Hello!' },
        mockSocket as Socket,
      );

      expect(mockMessagesService.markAsDelivered).toHaveBeenCalledWith('msg-123');
    });

    it('should return error when userId is not in auth', async () => {
      const mockSocket = createMockSocket('', 'socket-abc');
      mockSocket.handshake!.auth = {}; // No userId

      const result = await gateway.handleSendMessage(
        { receiverId: 'user-222', text: 'Hello!' },
        mockSocket as Socket,
      );

      expect(result).toEqual({ error: 'Unauthorized' });
      expect(mockMessagesService.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle message service errors', async () => {
      const mockSocket = createMockSocket('user-111', 'socket-sender');

      mockMessagesService.sendMessage.mockRejectedValue(new Error('Database error'));

      const result = await gateway.handleSendMessage(
        { receiverId: 'user-222', text: 'Hello!' },
        mockSocket as Socket,
      );

      expect(result).toEqual({ error: 'Failed to send message' });
    });
  });

  describe('handleStartTyping', () => {
    it('should emit typing indicator to receiver', async () => {
      const mockSocket = createMockSocket('user-111', 'socket-sender');
      const mockReceiverSocket = createMockSocket('user-222', 'socket-receiver');

      // Set up both users as connected
      mockMessagesService.getConversations.mockResolvedValue([]);
      mockUsersService.updateOnlineStatus.mockResolvedValue(undefined);
      await gateway.handleConnection(mockSocket as Socket);
      await gateway.handleConnection(mockReceiverSocket as Socket);

      const result = await gateway.handleStartTyping(
        { receiverId: 'user-222' },
        mockSocket as Socket,
      );

      expect(result).toEqual({ success: true });
      expect(gateway.server.to).toHaveBeenCalledWith('socket-receiver');
    });

    it('should return error when userId is not in auth', async () => {
      const mockSocket = createMockSocket('', 'socket-abc');
      mockSocket.handshake!.auth = {}; // No userId

      const result = await gateway.handleStartTyping(
        { receiverId: 'user-222' },
        mockSocket as Socket,
      );

      expect(result).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('handleStopTyping', () => {
    it('should emit stop typing indicator to receiver', async () => {
      const mockSocket = createMockSocket('user-111', 'socket-sender');
      const mockReceiverSocket = createMockSocket('user-222', 'socket-receiver');

      // Set up both users as connected
      mockMessagesService.getConversations.mockResolvedValue([]);
      mockUsersService.updateOnlineStatus.mockResolvedValue(undefined);
      await gateway.handleConnection(mockSocket as Socket);
      await gateway.handleConnection(mockReceiverSocket as Socket);

      // First start typing
      await gateway.handleStartTyping(
        { receiverId: 'user-222' },
        mockSocket as Socket,
      );

      // Then stop typing
      const result = await gateway.handleStopTyping(
        { receiverId: 'user-222' },
        mockSocket as Socket,
      );

      expect(result).toEqual({ success: true });
      expect(gateway.server.to).toHaveBeenCalledWith('socket-receiver');
    });
  });

  describe('handleMarkMessagesRead', () => {
    it('should mark messages as read and notify sender', async () => {
      const mockSocket = createMockSocket('user-222', 'socket-receiver');
      const mockSenderSocket = createMockSocket('user-111', 'socket-sender');

      // Set up both users as connected
      mockMessagesService.getConversations.mockResolvedValue([]);
      mockUsersService.updateOnlineStatus.mockResolvedValue(undefined);
      await gateway.handleConnection(mockSocket as Socket);
      await gateway.handleConnection(mockSenderSocket as Socket);

      const updatedMessages = [
        { id: 'msg-1', senderId: 'user-111' },
        { id: 'msg-2', senderId: 'user-111' },
      ];
      mockMessagesService.markConversationAsRead.mockResolvedValue(updatedMessages);

      const result = await gateway.handleMarkMessagesRead(
        { conversationId: 'conv-123' },
        mockSocket as Socket,
      );

      expect(mockMessagesService.markConversationAsRead).toHaveBeenCalledWith(
        'conv-123',
        'user-222',
      );
      expect(result).toEqual({ success: true, count: 2 });
    });

    it('should return error when userId is not in auth', async () => {
      const mockSocket = createMockSocket('', 'socket-abc');
      mockSocket.handshake!.auth = {}; // No userId

      const result = await gateway.handleMarkMessagesRead(
        { conversationId: 'conv-123' },
        mockSocket as Socket,
      );

      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('should handle service errors', async () => {
      const mockSocket = createMockSocket('user-222', 'socket-receiver');
      mockMessagesService.markConversationAsRead.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await gateway.handleMarkMessagesRead(
        { conversationId: 'conv-123' },
        mockSocket as Socket,
      );

      expect(result).toEqual({ error: 'Failed to mark messages as read' });
    });
  });

  describe('isUserOnline', () => {
    it('should return true when user is connected', async () => {
      const mockSocket = createMockSocket('user-123', 'socket-abc');
      mockMessagesService.getConversations.mockResolvedValue([]);
      mockUsersService.updateOnlineStatus.mockResolvedValue(undefined);

      await gateway.handleConnection(mockSocket as Socket);

      expect(gateway.isUserOnline('user-123')).toBe(true);
    });

    it('should return false when user is not connected', () => {
      expect(gateway.isUserOnline('unknown-user')).toBe(false);
    });

    it('should return false after user disconnects', async () => {
      const mockSocket = createMockSocket('user-123', 'socket-abc');
      mockMessagesService.getConversations.mockResolvedValue([]);
      mockUsersService.updateOnlineStatus.mockResolvedValue(undefined);

      await gateway.handleConnection(mockSocket as Socket);
      expect(gateway.isUserOnline('user-123')).toBe(true);

      gateway.handleDisconnect(mockSocket as Socket);
      expect(gateway.isUserOnline('user-123')).toBe(false);
    });
  });

  describe('getOnlineUsers', () => {
    it('should return array of online user IDs', async () => {
      const mockSocket1 = createMockSocket('user-111', 'socket-1');
      const mockSocket2 = createMockSocket('user-222', 'socket-2');
      mockMessagesService.getConversations.mockResolvedValue([]);
      mockUsersService.updateOnlineStatus.mockResolvedValue(undefined);

      await gateway.handleConnection(mockSocket1 as Socket);
      await gateway.handleConnection(mockSocket2 as Socket);

      const onlineUsers = gateway.getOnlineUsers();

      expect(onlineUsers).toContain('user-111');
      expect(onlineUsers).toContain('user-222');
      expect(onlineUsers).toHaveLength(2);
    });

    it('should return empty array when no users online', () => {
      const onlineUsers = gateway.getOnlineUsers();
      expect(onlineUsers).toEqual([]);
    });
  });
});
