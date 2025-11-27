import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { UsersService } from '../users/users.service';

/**
 * WebSocket Gateway for Real-Time Messaging
 *
 * Handles WebSocket connections and real-time message events:
 * - User connection/disconnection tracking
 * - Real-time message sending and receiving
 * - Typing indicators
 * - Read receipts
 * - Online status
 *
 * Security: All events require JWT authentication via WsJwtGuard
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/messages', // Separate namespace for messaging
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);

  /**
   * Map of userId -> socketId for tracking online users
   * Used to send real-time updates to specific users
   */
  private userSockets: Map<string, string> = new Map();

  /**
   * Map of userId -> Set of userIds they're currently typing to
   * Used to broadcast typing indicators
   */
  private typingUsers: Map<string, Set<string>> = new Map();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Handle new WebSocket connection
   * Extracts user ID from JWT token and tracks the connection
   */
  async handleConnection(client: Socket) {
    try {
      // Extract user ID from handshake auth (JWT token)
      const userId = client.handshake.auth?.userId;

      if (!userId) {
        this.logger.warn('WebSocket connection rejected: No user ID in auth');
        client.disconnect();
        return;
      }

      // Track this user's socket connection
      this.userSockets.set(userId, client.id);

      // Update user's online status and lastSeen in database
      await this.usersService.updateOnlineStatus(userId, true);

      // Join a room for this user (for targeted messaging)
      client.join(`user:${userId}`);

      // Notify other users that this user is online
      client.broadcast.emit('user:online', { userId });

      // Send this user a list of their unread message counts
      const conversations = await this.messagesService.getConversations(userId);
      client.emit('conversations:unread', {
        conversations: conversations.map((conv: any) => ({
          conversationId: conv.id,
          unreadCount: conv.getUnreadCount(userId),
        })),
      });
    } catch (error) {
      this.logger.error('Error in handleConnection', error);
      client.disconnect();
    }
  }

  /**
   * Handle WebSocket disconnection
   * Remove user from online tracking and clean up typing state
   */
  handleDisconnect(client: Socket) {
    // Find and remove the user from our tracking map
    let disconnectedUserId: string | null = null;

    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        disconnectedUserId = userId;
        this.userSockets.delete(userId);
        break;
      }
    }

    if (disconnectedUserId) {
      // Update user's online status and lastSeen in database
      this.usersService.updateOnlineStatus(disconnectedUserId, false);

      // Clean up typing state
      this.typingUsers.delete(disconnectedUserId);

      // Notify other users that this user is offline
      client.broadcast.emit('user:offline', {
        userId: disconnectedUserId,
        lastSeen: new Date(),
      });
    }
  }

  /**
   * Handle sending a new message
   * Saves message to database and emits to recipient in real-time
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @MessageBody() data: { receiverId: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const senderId = client.handshake.auth?.userId;

      if (!senderId) {
        return { error: 'Unauthorized' };
      }

      // Create the message in the database
      const message = await this.messagesService.sendMessage(
        senderId,
        data.receiverId,
        data.text,
      );

      // Emit to sender (confirmation)
      client.emit('message:sent', { message });

      // Emit to receiver (if online)
      const receiverSocketId = this.userSockets.get(data.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('message:received', { message });

        // Mark as delivered immediately since receiver is online
        await this.messagesService.markAsDelivered(message.id);
      }

      // Clear typing indicator for sender → receiver
      this.handleStopTyping({ receiverId: data.receiverId }, client);

      return { success: true, message };
    } catch (error) {
      this.logger.error('Error sending message', error);
      return { error: 'Failed to send message' };
    }
  }

  /**
   * Handle typing indicator start
   * Notifies the other user that this user is typing
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing:start')
  async handleStartTyping(
    @MessageBody() data: { receiverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.handshake.auth?.userId;

    if (!senderId) {
      return { error: 'Unauthorized' };
    }

    // Track that this user is typing to the receiver
    if (!this.typingUsers.has(senderId)) {
      this.typingUsers.set(senderId, new Set());
    }
    this.typingUsers.get(senderId)!.add(data.receiverId);

    // Notify the receiver
    const receiverSocketId = this.userSockets.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('typing:start', { userId: senderId });
    }

    return { success: true };
  }

  /**
   * Handle typing indicator stop
   * Notifies the other user that this user stopped typing
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing:stop')
  async handleStopTyping(
    @MessageBody() data: { receiverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.handshake.auth?.userId;

    if (!senderId) {
      return { error: 'Unauthorized' };
    }

    // Remove from typing tracking
    if (this.typingUsers.has(senderId)) {
      this.typingUsers.get(senderId)!.delete(data.receiverId);
    }

    // Notify the receiver
    const receiverSocketId = this.userSockets.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('typing:stop', { userId: senderId });
    }

    return { success: true };
  }

  /**
   * Handle marking messages as read
   * Updates database and notifies sender with read receipt
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('messages:markRead')
  async handleMarkMessagesRead(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.handshake.auth?.userId;

      if (!userId) {
        return { error: 'Unauthorized' };
      }

      // Mark all unread messages in this conversation as read
      const updatedMessages = await this.messagesService.markConversationAsRead(
        data.conversationId,
        userId,
      );

      // Notify the other user about read receipts
      if (updatedMessages.length > 0) {
        const otherUserId = updatedMessages[0].senderId;
        const otherUserSocketId = this.userSockets.get(otherUserId);

        if (otherUserSocketId) {
          this.server.to(otherUserSocketId).emit('messages:read', {
            conversationId: data.conversationId,
            messageIds: updatedMessages.map((m: any) => m.id),
          });
        }
      }

      return { success: true, count: updatedMessages.length };
    } catch (error) {
      this.logger.error('Error marking messages as read', error);
      return { error: 'Failed to mark messages as read' };
    }
  }

  /**
   * Check if a user is currently online
   * @param userId - User ID to check
   * @returns True if user is connected via WebSocket
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get all currently online user IDs
   * @returns Array of user IDs that are currently online
   */
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
