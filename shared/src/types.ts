// Enums
export enum TicketStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  RESERVED = 'reserved',
  CANCELLED = 'cancelled',
}

export enum TicketCategory {
  CONCERT = 'concert',
  SPORTS = 'sports',
  THEATER = 'theater',
  COMEDY = 'comedy',
  FESTIVAL = 'festival',
  OTHER = 'other',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface UserUpdateDto {
  name?: string;
  phone?: string;
}

// Auth Types
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Ticket Types
export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  eventDate: Date;
  venue: string;
  location: string;
  price: number;
  quantity: number;
  status: TicketStatus;
  section?: string;
  row?: string;
  seat?: string;
  sellerId: string;
  seller?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketCreateDto {
  title: string;
  description: string;
  category: TicketCategory;
  eventDate: Date;
  venue: string;
  location: string;
  price: number;
  quantity: number;
  section?: string;
  row?: string;
  seat?: string;
}

export interface TicketUpdateDto {
  title?: string;
  description?: string;
  category?: TicketCategory;
  eventDate?: Date;
  venue?: string;
  location?: string;
  price?: number;
  quantity?: number;
  status?: TicketStatus;
  section?: string;
  row?: string;
  seat?: string;
}

export interface TicketFilters {
  category?: string;
  search?: string;
  status?: TicketStatus;
  minPrice?: number;
  maxPrice?: number;
}

// Transaction Types
export interface Transaction {
  id: string;
  ticketId: string;
  ticket?: Ticket;
  buyerId: string;
  buyer?: User;
  sellerId: string;
  seller?: User;
  amount: number;
  quantity: number;
  status: TransactionStatus;
  paymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionCreateDto {
  ticketId: string;
  quantity?: number;
}

export interface TransactionUpdateDto {
  status?: TransactionStatus;
}

// API Response Types
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
