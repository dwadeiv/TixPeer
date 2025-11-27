export interface User {
  id: string;
  name: string;
  avatar: string;
  joinedDate: string;
  trustScore: number;
  completedTrades: number;
  bio?: string;
  location?: string;
  favoriteEvents?: string[];
  badges?: string[];
  responseTime?: string;
  verifiedUser?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface Listing {
  id: string;
  type: 'offer' | 'request';
  userId: string;
  user: User;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  eventImage: string;
  ticketCount: number;
  sectionInfo?: string;
  description: string;
  lookingFor?: string;
  createdAt: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface Event {
  id: string;
  name: string;
  date: string;
  venue: string;
  location: string;
  city: string; // City name for filtering
  image: string;
  category: string;
  activeListings: number;
}

/**
 * Message interface matching backend Message entity
 * Represents an individual message in a conversation
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  receiverId: string;
  receiver: User;
  text: string;
  isDelivered: boolean;
  deliveredAt?: string;
  isRead: boolean;
  readAt?: string;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
}

/**
 * Conversation interface matching backend Conversation entity
 * Represents a chat thread between two users
 */
export interface Conversation {
  id: string;
  user1Id: string;
  user1: User;
  user2Id: string;
  user2: User;
  lastMessageText?: string;
  lastMessageAt?: string;
  lastMessageSenderId?: string;
  unreadCountUser1: number;
  unreadCountUser2: number;
  createdAt: string;
  updatedAt: string;
}
