'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Message, Conversation } from '@/types';
import { api } from '@/lib/api';

/**
 * Messages Context Interface
 * Provides WebSocket connection and messaging functionality throughout the app
 */
interface MessagesContextType {
  // WebSocket connection status
  connected: boolean;

  // Conversations
  conversations: Conversation[];
  loadingConversations: boolean;
  refreshConversations: () => Promise<void>;

  // Current conversation
  currentConversation: Conversation | null;
  setCurrentConversation: (conversation: Conversation | null) => void;

  // Messages for current conversation
  messages: Message[];
  loadingMessages: boolean;
  loadMessages: (conversationId: string) => Promise<void>;

  // Send message (real-time via WebSocket)
  sendMessage: (receiverId: string, text: string) => void;

  // Typing indicators
  isTyping: boolean; // Is other user typing?
  startTyping: (receiverId: string) => void;
  stopTyping: (receiverId: string) => void;

  // Read receipts
  markConversationAsRead: (conversationId: string) => Promise<void>;

  // Unread counts
  totalUnreadCount: number;
  refreshUnreadCount: () => Promise<void>;

  // Online users
  onlineUsers: Set<string>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

/**
 * Messages Provider
 * Manages WebSocket connection, conversations, and real-time messaging
 */
export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  // WebSocket
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  // Current conversation
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Typing
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Unread count
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Online users
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  /**
   * Initialize WebSocket connection when user logs in
   */
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect socket if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Create WebSocket connection
    const newSocket = io('http://localhost:3001/messages', {
      auth: {
        token: localStorage.getItem('authToken'),
        userId: user.id,
      },
      transports: ['websocket', 'polling'],
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    // Message events
    newSocket.on('message:sent', ({ message }: { message: Message }) => {
      // Message we sent was confirmed by server
      console.log('Message sent:', message);
      setMessages((prev) => [...prev, message]);
      refreshConversations();
    });

    newSocket.on('message:received', ({ message }: { message: Message }) => {
      // New message received from another user
      console.log('Message received:', message);

      // Add to messages if we're viewing this conversation
      if (currentConversation?.id === message.conversationId) {
        setMessages((prev) => [...prev, message]);
        // Auto-mark as read if conversation is open
        newSocket.emit('messages:markRead', { conversationId: message.conversationId });
      }

      refreshConversations();
      refreshUnreadCount();
    });

    // Typing indicators
    newSocket.on('typing:start', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => new Set(prev).add(userId));
    });

    newSocket.on('typing:stop', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    // Read receipts
    newSocket.on('messages:read', ({ conversationId, messageIds }: { conversationId: string; messageIds: string[] }) => {
      // Mark messages as read in UI
      if (currentConversation?.id === conversationId) {
        setMessages((prev) =>
          prev.map((msg) =>
            messageIds.includes(msg.id) ? { ...msg, isRead: true, readAt: new Date().toISOString() } : msg
          )
        );
      }
    });

    // Online status
    newSocket.on('user:online', ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });

    newSocket.on('user:offline', ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    // Unread counts
    newSocket.on('conversations:unread', ({ conversations: unreadData }: { conversations: any[] }) => {
      const total = unreadData.reduce((sum, conv) => sum + conv.unreadCount, 0);
      setTotalUnreadCount(total);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  /**
   * Load conversations from API
   */
  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoadingConversations(true);
      const data = await api.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, [isAuthenticated]);

  /**
   * Load messages for a specific conversation
   */
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const data = await api.getMessages({ conversationId, limit: 100 });
      // Messages come newest first from API, reverse for display (oldest first)
      setMessages(data.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  /**
   * Send a message via WebSocket
   */
  const sendMessage = useCallback((receiverId: string, text: string) => {
    if (!socket || !connected) {
      console.error('Cannot send message: not connected');
      return;
    }

    socket.emit('message:send', { receiverId, text });
  }, [socket, connected]);

  /**
   * Start typing indicator
   */
  const startTyping = useCallback((receiverId: string) => {
    if (!socket || !connected) return;

    socket.emit('typing:start', { receiverId });

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Auto-stop typing after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      stopTyping(receiverId);
    }, 3000);

    setTypingTimeout(timeout);
  }, [socket, connected, typingTimeout]);

  /**
   * Stop typing indicator
   */
  const stopTyping = useCallback((receiverId: string) => {
    if (!socket || !connected) return;

    socket.emit('typing:stop', { receiverId });

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  }, [socket, connected, typingTimeout]);

  /**
   * Mark conversation as read
   */
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!socket || !connected) {
      // Fallback to HTTP if WebSocket not available
      try {
        await api.markConversationAsRead(conversationId);
        refreshUnreadCount();
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
      return;
    }

    socket.emit('messages:markRead', { conversationId });
    refreshUnreadCount();
  }, [socket, connected]);

  /**
   * Refresh unread count
   */
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const data = await api.getUnreadCount();
      setTotalUnreadCount(data.count);
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  }, [isAuthenticated]);

  /**
   * Load conversations on mount
   */
  useEffect(() => {
    if (isAuthenticated) {
      refreshConversations();
      refreshUnreadCount();
    }
  }, [isAuthenticated, refreshConversations, refreshUnreadCount]);

  /**
   * Check if other user is typing in current conversation
   */
  const isTyping = currentConversation
    ? Array.from(typingUsers).some(
        (userId) => userId === currentConversation.user1Id || userId === currentConversation.user2Id
      )
    : false;

  const value: MessagesContextType = {
    connected,
    conversations,
    loadingConversations,
    refreshConversations,
    currentConversation,
    setCurrentConversation,
    messages,
    loadingMessages,
    loadMessages,
    sendMessage,
    isTyping,
    startTyping,
    stopTyping,
    markConversationAsRead,
    totalUnreadCount,
    refreshUnreadCount,
    onlineUsers,
  };

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

/**
 * Hook to access messages context
 * Must be used within MessagesProvider
 */
export function useMessages() {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within MessagesProvider');
  }
  return context;
}
