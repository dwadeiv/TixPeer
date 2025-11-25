'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Search, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessagesContext';
import { Conversation, Message } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api';

export default function Messages() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
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
    onlineUsers,
  } = useMessages();

  // UI State
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newConversationUserId, setNewConversationUserId] = useState<string | null>(null);
  const [newConversationUser, setNewConversationUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Authentication Guard
   * Redirect unauthenticated users to login page
   */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/messages');
    }
  }, [authLoading, isAuthenticated, router]);

  /**
   * Load conversations on mount
   */
  useEffect(() => {
    if (isAuthenticated) {
      refreshConversations();
    }
  }, [isAuthenticated, refreshConversations]);

  /**
   * Handle URL query parameters for starting/selecting conversations
   * - conversationId: Select existing conversation
   * - userId: Start new conversation with user
   */
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    if (conversationId && conversations.length > 0) {
      // Select existing conversation by ID
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        handleSelectConversation(conversation);
        setNewConversationUserId(null);
        setNewConversationUser(null);
      }
    } else if (userId) {
      // Check if conversation exists with this user
      const existingConversation = conversations.find(
        (conv) =>
          (conv.user1Id === userId && conv.user2Id === user.id) ||
          (conv.user2Id === userId && conv.user1Id === user.id)
      );

      if (existingConversation) {
        // Select existing conversation
        handleSelectConversation(existingConversation);
        setNewConversationUserId(null);
        setNewConversationUser(null);
      } else {
        // New conversation - fetch user data and set up for first message
        const fetchUserForNewConversation = async () => {
          try {
            const userData = await api.getUser(userId);
            setNewConversationUserId(userId);
            setNewConversationUser(userData);
            setCurrentConversation(null); // Clear any selected conversation
          } catch (error) {
            console.error('Error fetching user for new conversation:', error);
          }
        };
        fetchUserForNewConversation();
      }
    }
  }, [isAuthenticated, user, conversations, searchParams]);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Handle conversation selection
   */
  const handleSelectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    await loadMessages(conversation.id);
    await markConversationAsRead(conversation.id);
  };

  /**
   * Handle sending a message
   */
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || !user) return;

    // Handle new conversation (first message)
    if (newConversationUserId && !currentConversation) {
      sendMessage(newConversationUserId, messageText.trim());
      setMessageText('');
      // After sending first message, conversation will be created
      // Clear the new conversation state
      setNewConversationUserId(null);
      setNewConversationUser(null);
      // Refresh conversations to get the newly created one
      setTimeout(() => refreshConversations(), 500);
      return;
    }

    // Handle existing conversation
    if (!currentConversation) return;

    // Get the other user's ID
    const otherUser = currentConversation.user1Id === user.id
      ? currentConversation.user2
      : currentConversation.user1;

    sendMessage(otherUser.id, messageText.trim());
    setMessageText('');
    stopTyping(otherUser.id);
  };

  /**
   * Handle typing input
   */
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);

    if (!currentConversation || !user) return;

    const otherUser = currentConversation.user1Id === user.id
      ? currentConversation.user2
      : currentConversation.user1;

    if (e.target.value.length > 0) {
      startTyping(otherUser.id);
    } else {
      stopTyping(otherUser.id);
    }
  };

  /**
   * Filter conversations by search query
   */
  const filteredConversations = conversations.filter((conv) => {
    if (!user) return false;
    const otherUser = conv.user1Id === user.id ? conv.user2 : conv.user1;
    return otherUser.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  /**
   * Get unread count for a conversation
   */
  const getUnreadCount = (conversation: Conversation) => {
    if (!user) return 0;
    return conversation.user1Id === user.id
      ? conversation.unreadCountUser1
      : conversation.unreadCountUser2;
  };

  /**
   * Check if other user is online
   */
  const isUserOnline = (conversation: Conversation) => {
    if (!user) return false;
    const otherUserId = conversation.user1Id === user.id
      ? conversation.user2Id
      : conversation.user1Id;
    return onlineUsers.has(otherUserId);
  };

  /**
   * Get the other user in the conversation
   */
  const getOtherUser = (conversation: Conversation) => {
    if (!user) return null;
    return conversation.user1Id === user.id ? conversation.user2 : conversation.user1;
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto pb-20 md:pb-8 flex justify-center items-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Don't render content if user is not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 md:pb-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl">Messages</h1>
        {!connected && (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Connecting...
          </Badge>
        )}
        {connected && (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Connected
          </Badge>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="size-6 animate-spin text-slate-400" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="size-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 mb-2">No conversations yet</p>
                <p className="text-sm text-slate-500">
                  Start chatting with other users from their profiles
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conversation) => {
                  const otherUser = getOtherUser(conversation);
                  const unreadCount = getUnreadCount(conversation);
                  const isOnline = isUserOnline(conversation);
                  const isSelected = currentConversation?.id === conversation.id;

                  if (!otherUser) return null;

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="size-12">
                            <AvatarImage src={otherUser.avatar} />
                            <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
                          </Avatar>
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-medium truncate">{otherUser.name}</h3>
                            {conversation.lastMessageAt && (
                              <span className="text-xs text-slate-500 flex-shrink-0">
                                {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-slate-600 truncate">
                              {conversation.lastMessageText || 'No messages yet'}
                            </p>
                            {unreadCount > 0 && (
                              <Badge className="bg-purple-600 flex-shrink-0">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {!currentConversation && !newConversationUser ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <MessageSquare className="size-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-600 mb-2">Select a conversation</p>
                <p className="text-sm text-slate-500">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          ) : newConversationUser ? (
            <>
              {/* Chat Header - New Conversation */}
              <div className="p-4 border-b flex items-center gap-3">
                <div className="relative">
                  <Avatar className="size-10">
                    <AvatarImage src={newConversationUser.avatar} />
                    <AvatarFallback>{newConversationUser.name[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <h2 className="font-medium">{newConversationUser.name}</h2>
                  <p className="text-sm text-slate-500">New conversation</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/users/${newConversationUser.id}`)}
                >
                  View Profile
                </Button>
              </div>

              {/* Messages - Empty for new conversation */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-500">Start a conversation with {newConversationUser.name}!</p>
                </div>
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={handleTyping}
                    disabled={!connected}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!messageText.trim() || !connected}
                    className="gap-2"
                  >
                    <Send className="size-4" />
                    Send
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                {(() => {
                  const otherUser = getOtherUser(currentConversation);
                  const isOnline = isUserOnline(currentConversation);

                  if (!otherUser) return null;

                  return (
                    <>
                      <div className="relative">
                        <Avatar className="size-10">
                          <AvatarImage src={otherUser.avatar} />
                          <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="font-medium">{otherUser.name}</h2>
                        <p className="text-sm text-slate-500">
                          {isOnline ? (
                            'Online'
                          ) : otherUser.lastSeen ? (
                            `Last seen ${formatDistanceToNow(new Date(otherUser.lastSeen), { addSuffix: true })}`
                          ) : (
                            'Offline'
                          )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/users/${otherUser.id}`)}
                      >
                        View Profile
                      </Button>
                    </>
                  );
                })()}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="size-6 animate-spin text-slate-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.senderId === user.id;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.text}
                          </p>
                          <div
                            className={`flex items-center gap-1 mt-1 text-xs ${
                              isOwnMessage ? 'text-purple-200' : 'text-slate-500'
                            }`}
                          >
                            <span>
                              {new Date(message.createdAt).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                            {isOwnMessage && (
                              <>
                                {message.isRead ? (
                                  <CheckCheck className="size-3" />
                                ) : message.isDelivered ? (
                                  <CheckCheck className="size-3 opacity-60" />
                                ) : (
                                  <Check className="size-3 opacity-60" />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing Indicator */}
              {isTyping && (
                <div className="px-4 py-2 text-sm text-slate-500">
                  {getOtherUser(currentConversation)?.name} is typing...
                </div>
              )}

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={handleTyping}
                    disabled={!connected}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!messageText.trim() || !connected}
                    className="gap-2"
                  >
                    <Send className="size-4" />
                    Send
                  </Button>
                </div>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
