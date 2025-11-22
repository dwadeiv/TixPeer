export interface User {
  id: string;
  name: string;
  avatar: string;
  joinedDate: string;
  trustScore: number;
  completedTrades: number;
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
  image: string;
  category: string;
  activeListings: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  listingId: string;
  participants: User[];
  messages: Message[];
}
