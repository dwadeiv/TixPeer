import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
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

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          this.removeToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(email: string, password: string, name: string) {
    const response = await this.client.post('/auth/register', { email, password, name });
    return response.data;
  }

  async logout() {
    this.removeToken();
  }

  // Tickets endpoints
  async getTickets(params?: { category?: string; search?: string }) {
    const response = await this.client.get('/tickets', { params });
    return response.data;
  }

  async getTicket(id: string) {
    const response = await this.client.get(`/tickets/${id}`);
    return response.data;
  }

  async createTicket(data: any) {
    const response = await this.client.post('/tickets', data);
    return response.data;
  }

  async updateTicket(id: string, data: any) {
    const response = await this.client.patch(`/tickets/${id}`, data);
    return response.data;
  }

  async deleteTicket(id: string) {
    const response = await this.client.delete(`/tickets/${id}`);
    return response.data;
  }

  // User endpoints
  async getProfile() {
    const response = await this.client.get('/users/profile');
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await this.client.patch('/users/profile', data);
    return response.data;
  }

  async getUsers() {
    const response = await this.client.get('/users');
    return response.data;
  }

  async getUser(id: string) {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }

  // Events endpoints
  async getEvents(params?: { city?: string; category?: string }) {
    const response = await this.client.get('/events', { params });
    return response.data;
  }

  async getEvent(id: string) {
    const response = await this.client.get(`/events/${id}`);
    return response.data;
  }

  // Listings endpoints
  async getListings(params?: { eventId?: string; userId?: string }) {
    const response = await this.client.get('/listings', { params });
    return response.data;
  }

  async getListing(id: string) {
    const response = await this.client.get(`/listings/${id}`);
    return response.data;
  }

  async createListing(data: any) {
    const response = await this.client.post('/listings', data);
    return response.data;
  }

  async updateListing(id: string, data: any) {
    const response = await this.client.patch(`/listings/${id}`, data);
    return response.data;
  }

  async deleteListing(id: string) {
    const response = await this.client.delete(`/listings/${id}`);
    return response.data;
  }
}

export const api = new ApiClient();
