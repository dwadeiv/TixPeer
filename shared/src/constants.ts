export const TICKET_CATEGORIES = [
  { value: 'concert', label: 'Concert' },
  { value: 'sports', label: 'Sports' },
  { value: 'theater', label: 'Theater' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'festival', label: 'Festival' },
  { value: 'other', label: 'Other' },
] as const;

export const TICKET_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const TRANSACTION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
] as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  USERS: {
    PROFILE: '/users/profile',
  },
  TICKETS: {
    LIST: '/tickets',
    CREATE: '/tickets',
    GET: (id: string) => `/tickets/${id}`,
    UPDATE: (id: string) => `/tickets/${id}`,
    DELETE: (id: string) => `/tickets/${id}`,
    MY_TICKETS: '/tickets/my-tickets',
  },
  TRANSACTIONS: {
    LIST: '/transactions/my-transactions',
    CREATE: '/transactions',
    GET: (id: string) => `/transactions/${id}`,
    UPDATE_STATUS: (id: string) => `/transactions/${id}/status`,
  },
} as const;
