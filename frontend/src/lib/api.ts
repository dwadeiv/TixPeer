import axios, { AxiosInstance } from 'axios';

/**
 * Backend API base URL
 * Defaults to localhost for development, override via .env for production
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * ApiClient
 * Singleton HTTP client for all backend API communication.
 * Handles:
 * - Automatic JWT token injection for authenticated requests
 * - Centralized error handling (401 unauthorized, network errors)
 * - Type-safe methods for all API endpoints
 *
 * Usage:
 * import { api } from '@/lib/api';
 * const listings = await api.getListings();
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    // Create axios instance with base configuration
    // Backend controls caching via response headers (max-age, stale-while-revalidate)
    // No need for aggressive no-cache request headers from client
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    /**
     * Request Interceptor
     * Automatically attaches JWT token to requests if user is logged in
     * This eliminates need to manually add Authorization header to every request
     */
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    /**
     * Response Interceptor
     * Handles common error scenarios globally:
     * - 401: Clears expired/invalid token to prevent repeated failed requests
     * - Future: Could add retry logic, toast notifications, etc.
     *
     * Note: Login redirect disabled to allow unauthenticated browsing of listings
     */
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token invalid/expired - remove it to prevent sending on future requests
          this.removeToken();
          // Note: Redirect to login disabled since login page doesn't exist yet
          // Unauthenticated users can still browse public content
          // if (typeof window !== 'undefined') {
          //   window.location.href = '/login';
          // }
        }
        return Promise.reject(error);
      }
    );
  }

  // ========== Token Management ==========

  /**
   * Retrieves JWT token from browser localStorage
   * Returns null in SSR context (no window object)
   */
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  /**
   * Clears stored JWT token (used on logout or 401 error)
   */
  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  /**
   * Stores JWT token after successful login
   * Token will be automatically attached to all subsequent requests
   * Pass null to clear the token (logout)
   */
  setToken(token: string | null): void {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        this.removeToken();
      }
    }
  }

  // ========== Authentication Endpoints ==========

  /**
   * Authenticates user with email/password
   * @returns { access_token: string } JWT token for subsequent requests
   * Usage: const { access_token } = await api.login(email, pass); api.setToken(access_token);
   */
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  /**
   * Creates new user account
   * @returns { access_token: string } JWT token - user is logged in immediately
   */
  async register(email: string, password: string, name: string) {
    const response = await this.client.post('/auth/register', { email, password, name });
    return response.data;
  }

  /**
   * Logs out current user by removing stored JWT token
   * No API call needed - token removal prevents future authenticated requests
   */
  async logout() {
    this.removeToken();
  }

  /**
   * Resends email verification link to user's email address
   * @param email - Email address to send verification link to
   */
  async resendVerificationEmail(email: string) {
    const response = await this.client.post('/auth/resend-verification', { email });
    return response.data;
  }

  // ========== User Endpoints ==========

  /** Get currently logged in user's profile (requires authentication) */
  async getProfile() {
    const response = await this.client.get('/users/profile');
    return response.data;
  }

  /** Update current user's profile */
  async updateProfile(data: any) {
    const response = await this.client.patch('/users/profile', data);
    return response.data;
  }

  /**
   * Upload profile avatar image
   * Accepts a File object and uploads it to the server
   * @param file - Image file to upload (jpg, jpeg, png, gif, webp, max 5MB)
   * @returns Updated user profile with new avatar path
   */
  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await this.client.post('/users/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /** Get all users (admin endpoint) */
  async getUsers() {
    const response = await this.client.get('/users');
    return response.data;
  }

  /** Get specific user's public profile by ID */
  async getUser(id: string) {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }

  // ========== Events Endpoints ==========

  /**
   * Get all events, optionally filtered by city or category
   * Used for homepage "Trending Events" and location-based filtering
   */
  async getEvents(params?: { city?: string; category?: string }) {
    const response = await this.client.get('/events', { params });
    return response.data;
  }

  /** Get single event details including active listings count */
  async getEvent(id: string) {
    const response = await this.client.get(`/events/${id}`);
    return response.data;
  }

  // ========== Listings Endpoints (Primary Marketplace API) ==========

  /**
   * Get all active listings, optionally filtered by event or user
   * Returns listings with populated user and event data for display
   */
  async getListings(params?: { eventId?: string; userId?: string }) {
    const response = await this.client.get('/listings', { params });
    return response.data;
  }

  /**
   * Get single listing details with full user/event info
   * Used for /listings/[id] detail pages
   */
  async getListing(id: string) {
    const response = await this.client.get(`/listings/${id}`);
    return response.data;
  }

  /**
   * Create new listing (offer or request)
   * Requires authentication - uses JWT token from interceptor
   */
  async createListing(data: any) {
    const response = await this.client.post('/listings', data);
    return response.data;
  }

  /** Update existing listing (e.g., change description, mark completed) */
  async updateListing(id: string, data: any) {
    const response = await this.client.patch(`/listings/${id}`, data);
    return response.data;
  }

  /** Delete/cancel a listing */
  async deleteListing(id: string) {
    const response = await this.client.delete(`/listings/${id}`);
    return response.data;
  }

  // ========== Messages Endpoints ==========

  /**
   * Get all conversations for the current user
   * Returns conversations sorted by most recent activity
   */
  async getConversations() {
    const response = await this.client.get('/messages/conversations');
    return response.data;
  }

  /**
   * Get a specific conversation by ID
   * @param conversationId - UUID of the conversation
   */
  async getConversation(conversationId: string) {
    const response = await this.client.get(`/messages/conversations/${conversationId}`);
    return response.data;
  }

  /**
   * Get messages for a conversation
   * @param params - conversationId or otherUserId, plus optional pagination
   */
  async getMessages(params: {
    conversationId?: string;
    otherUserId?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await this.client.get('/messages', { params });
    return response.data;
  }

  /**
   * Send a new message (HTTP fallback, prefer WebSocket for real-time)
   * @param receiverId - UUID of the recipient user
   * @param text - Message content
   */
  async sendMessage(receiverId: string, text: string) {
    const response = await this.client.post('/messages', { receiverId, text });
    return response.data;
  }

  /**
   * Mark all messages in a conversation as read
   * @param conversationId - UUID of the conversation
   */
  async markConversationAsRead(conversationId: string) {
    const response = await this.client.post(`/messages/conversations/${conversationId}/read`);
    return response.data;
  }

  /**
   * Get total unread message count across all conversations
   * Returns { count: number }
   */
  async getUnreadCount() {
    const response = await this.client.get('/messages/unread/count');
    return response.data;
  }

  /**
   * Search messages by text content
   * @param searchText - Text to search for
   * @param limit - Maximum number of results (default 50)
   */
  async searchMessages(searchText: string, limit: number = 50) {
    const response = await this.client.get('/messages/search', {
      params: { q: searchText, limit },
    });
    return response.data;
  }

  /**
   * Delete a message
   * @param messageId - UUID of the message to delete
   */
  async deleteMessage(messageId: string) {
    const response = await this.client.delete(`/messages/${messageId}`);
    return response.data;
  }
}

export const api = new ApiClient();
