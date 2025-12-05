# TixPeer Architecture

**Last Updated:** December 4, 2025

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [API Architecture](#api-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [File Storage](#file-storage)
- [Frontend Architecture](#frontend-architecture)
- [Key Design Decisions](#key-design-decisions)

---

## Overview

TixPeer is a peer-to-peer ticket exchange marketplace built as a full-stack monorepo application. The platform facilitates direct connections between ticket buyers and sellers without holding inventory.

**Core Value Proposition:**
- Direct peer-to-peer ticket exchange
- No platform inventory or ticket ownership
- Community-driven trust system
- Real-time marketplace for events

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Next.js 14 Frontend (Port 3000)                 │  │
│  │  - App Router (Server + Client Components)                │  │
│  │  - React Context (Auth, Location, Messages)               │  │
│  │  - Tailwind CSS + shadcn/ui                               │  │
│  │  - Axios API Client                                       │  │
│  │  - Socket.IO Client (Real-time messaging)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴─────────────┐
                 │ HTTP/REST                │ WebSocket
                 ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           NestJS Backend (Port 3001)                      │  │
│  │  - RESTful API Controllers                                │  │
│  │  - WebSocket Gateway (Socket.IO)                          │  │
│  │  - Service Layer (Business Logic)                         │  │
│  │  - JWT Authentication Guards                              │  │
│  │  - TypeORM Repository Pattern                             │  │
│  │  - Swagger API Documentation                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
                 ▼                         ▼
┌────────────────────────────┐  ┌──────────────────────────┐
│      DATA LAYER            │  │    EXTERNAL SERVICES     │
│                            │  │                          │
│  PostgreSQL 16             │  │  Cloudinary CDN          │
│  - User Profiles           │  │  - Avatar Images         │
│  - Events & Listings       │  │  - Profile Pictures      │
│  - Transactions            │  │  - Image Optimization    │
│  - Trust Scores            │  │                          │
│  - Messages                │  │  SendGrid (Future)       │
│  - Conversations           │  │  - Email Verification    │
│                            │  │  - Notifications         │
│  Docker Container          │  │                          │
│  Port: 5432                │  │                          │
└────────────────────────────┘  └──────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI primitives)
- **State Management:** React Context API
- **HTTP Client:** Axios
- **Image Processing:** react-easy-crop

### Backend
- **Framework:** NestJS
- **Language:** TypeScript
- **ORM:** TypeORM
- **Authentication:** Passport.js + JWT
- **Validation:** class-validator
- **API Docs:** Swagger/OpenAPI
- **Real-time:** Socket.IO (WebSocket)

### Database
- **Database:** PostgreSQL 16
- **Containerization:** Docker
- **Admin Tool:** pgAdmin 4

### Cloud Services
- **Image Storage:** Cloudinary
- **Email Service:** SendGrid (configured, not yet active)

### Development Tools
- **Monorepo:** npm workspaces
- **Package Manager:** npm
- **Version Control:** Git

---

## Data Flow

### User Registration Flow
```
User Form Input
    ↓
Frontend Validation (email format, password strength)
    ↓
POST /auth/register
    ↓
Backend Validation (class-validator)
    ↓
Password Hashing (bcrypt, 10 rounds)
    ↓
Create User in Database
    ↓
Generate Email Verification Token
    ↓
Return JWT Access Token
    ↓
Store Token in localStorage
    ↓
Redirect to Email Verification Pending
```

### Avatar Upload Flow
```
User Selects Image
    ↓
Frontend Image Cropping (react-easy-crop)
    ↓
Canvas Processing (crop + rotate)
    ↓
Convert to File (JPEG)
    ↓
POST /users/profile/avatar (multipart/form-data)
    ↓
Backend File Validation (type, size)
    ↓
Upload to Cloudinary (buffer-based)
    ↓
Receive CDN URL
    ↓
Update User.avatar in Database
    ↓
Update AuthContext + localStorage
    ↓
Header Avatar Updates Immediately
```

### Listing Creation Flow
```
User Creates Listing Form
    ↓
Select Event (from API)
    ↓
POST /listings
    ↓
Validate User Authentication (JWT Guard)
    ↓
Create Listing in Database
    ↓
Associate with User & Event
    ↓
Return Created Listing
    ↓
Redirect to Listing Detail Page
```

### Real-time Messaging Flow
```
User Clicks "Contact Seller"
    ↓
Check for Existing Conversation
    ↓
Navigate to Messages Page
    ↓
WebSocket Connection Established
    ↓
Socket.IO connects to /messages namespace
    ↓
JWT Authentication via socket.handshake.auth
    ↓
User joins room: user:{userId}
    ↓
Server tracks online status
    ↓
User sends message (socket.emit('message:send'))
    ↓
Server creates Message + updates Conversation
    ↓
Server emits 'message:sent' to sender
    ↓
Server emits 'message:received' to recipient
    ↓
Frontend updates messages array
    ↓
Auto-scroll to bottom, show read receipt
```

**Real-time Features:**
- **Typing indicators:** socket.emit('typing:start/stop')
- **Read receipts:** socket.emit('messages:markRead')
- **Online status:** Tracked via connection/disconnection events
- **Message delivery:** Instant via WebSocket, fallback to HTTP
- **Unread counts:** Updated in real-time across all tabs

---

## Database Schema

### Users Table
```sql
users
├── id (uuid, PK)
├── email (varchar, unique)
├── password (varchar, hashed)
├── name (varchar)
├── avatar (varchar, Cloudinary URL)
├── phone (varchar, nullable)
├── isActive (boolean)
├── isEmailVerified (boolean)
├── emailVerificationToken (varchar, nullable)
├── emailVerificationTokenExpiry (timestamp, nullable)
├── trustScore (decimal(3,1), default: 5.0)
├── completedTrades (int, default: 0)
├── joinedDate (timestamp)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

### Events Table
```sql
events
├── id (uuid, PK)
├── name (varchar)
├── description (text)
├── date (timestamp)
├── venue (varchar)
├── location (varchar)
├── city (varchar)
├── lat (decimal(10,7), nullable)    -- Latitude for geo-search
├── lng (decimal(10,7), nullable)    -- Longitude for geo-search
├── category (enum: concert, sports, theater, comedy, festival, other)
├── imageUrl (varchar, nullable)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

**Geo-Search Notes:**
- Coordinates stored as decimal(10,7) for precision to ~1cm
- Haversine formula used for distance calculations (no PostGIS dependency)
- Events without coordinates excluded from geo-search results

### Listings Table
```sql
listings
├── id (uuid, PK)
├── userId (uuid, FK → users.id)
├── eventId (uuid, FK → events.id)
├── type (enum: offer, request)
├── ticketCount (int)
├── pricePerTicket (decimal, nullable)
├── sectionInfo (varchar, nullable)
├── description (text)
├── status (enum: active, completed, cancelled)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

### Tickets Table (Legacy - Used by Transactions)
```sql
tickets
├── id (uuid, PK)
├── sellerId (uuid, FK → users.id)
├── title (varchar)
├── description (text)
├── category (enum)
├── eventDate (timestamp)
├── venue (varchar)
├── location (varchar)
├── price (decimal)
├── quantity (int)
├── status (enum: available, sold, reserved, cancelled)
├── section (varchar, nullable)
├── row (varchar, nullable)
├── seat (varchar, nullable)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

### Transactions Table
```sql
transactions
├── id (uuid, PK)
├── ticketId (uuid, FK → tickets.id)
├── buyerId (uuid, FK → users.id)
├── sellerId (uuid, FK → users.id)
├── amount (decimal)
├── quantity (int)
├── status (enum: pending, completed, cancelled, refunded)
├── paymentIntentId (varchar, nullable)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

### Conversations Table
```sql
conversations
├── id (uuid, PK)
├── user1Id (uuid, FK → users.id)
├── user2Id (uuid, FK → users.id)
├── lastMessageText (text, nullable)
├── lastMessageAt (timestamp, nullable)
├── lastMessageSenderId (uuid, nullable, FK → users.id)
├── unreadCountUser1 (int, default: 0)
├── unreadCountUser2 (int, default: 0)
├── createdAt (timestamp)
├── updatedAt (timestamp)
└── UNIQUE INDEX (user1Id, user2Id)  -- Prevents duplicate conversations
```

**Design Notes:**
- User IDs always stored in sorted order (lower UUID first as user1Id)
- Unique index prevents duplicate conversations between same two users
- Metadata (lastMessage*) denormalized for performance (conversation list sorting)
- Separate unread counts per user for accurate notification badges

### Messages Table
```sql
messages
├── id (uuid, PK)
├── conversationId (uuid, FK → conversations.id, ON DELETE CASCADE)
├── senderId (uuid, FK → users.id)
├── receiverId (uuid, FK → users.id)
├── text (text)
├── isDelivered (boolean, default: false)
├── deliveredAt (timestamp, nullable)
├── isRead (boolean, default: false)
├── readAt (timestamp, nullable)
├── isEdited (boolean, default: false)
├── editedAt (timestamp, nullable)
├── createdAt (timestamp)
└── updatedAt (timestamp)
└── INDEX (conversationId, createdAt)  -- For efficient message history queries
```

**Design Notes:**
- Cascade delete: Messages deleted when conversation is deleted
- Delivery tracking: isDelivered/deliveredAt for sent confirmation
- Read receipts: isRead/readAt for checkmark indicators
- Edit tracking: isEdited/editedAt for message edit history
- Index on (conversationId, createdAt) for fast pagination

### Relationships
```
User 1──────── * Listings (as seller/requester)
User 1──────── * Tickets (as seller)
User 1──────── * Transactions (as buyer)
User 1──────── * Transactions (as seller)
User 1──────── * Conversations (as user1)
User 1──────── * Conversations (as user2)
User 1──────── * Messages (as sender)
User 1──────── * Messages (as receiver)

Event 1──────── * Listings

Ticket 1──────── * Transactions

Conversation 1──────── * Messages
```

---

## API Architecture

### API Structure
```
/api
├── /auth
│   ├── POST   /register            (Create new user)
│   ├── POST   /login               (Login with email/password)
│   ├── GET    /verify-email        (Verify email with token)
│   └── POST   /resend-verification (Resend verification email)
│
├── /users
│   ├── GET    /                    (Get all users - admin)
│   ├── GET    /profile             (Get current user - JWT required)
│   ├── GET    /:id                 (Get user by ID - public)
│   ├── PATCH  /profile             (Update current user - JWT required)
│   └── POST   /profile/avatar      (Upload avatar - JWT required)
│
├── /events
│   ├── GET    /                    (Get events with optional geo-search)
│   │   Query params:
│   │   ├── q        (string) - Search event name
│   │   ├── lat      (number) - Latitude for geo-search
│   │   ├── lng      (number) - Longitude for geo-search
│   │   ├── radius   (number) - Search radius in miles (default: 100)
│   │   ├── city     (string) - Filter by city name (legacy)
│   │   └── category (string) - Filter by event category
│   │   Response: { events: Event[], searchedNearby: boolean, locationName?: string }
│   └── GET    /:id                 (Get event details + active listings count)
│
├── /listings
│   ├── POST   /                    (Create listing - JWT required)
│   ├── GET    /                    (Get all listings, filter by event/user)
│   ├── GET    /:id                 (Get listing details)
│   ├── PATCH  /:id                 (Update listing - JWT required)
│   └── DELETE /:id                 (Delete listing - JWT required)
│
├── /tickets (Legacy)
│   ├── POST   /                    (Create ticket - JWT required)
│   ├── GET    /                    (Get all tickets)
│   ├── GET    /my-tickets          (Get user's tickets - JWT required)
│   ├── GET    /:id                 (Get ticket details)
│   ├── PATCH  /:id                 (Update ticket - JWT required)
│   └── DELETE /:id                 (Delete ticket - JWT required)
│
├── /transactions
│   ├── POST   /                    (Create transaction - JWT required)
│   ├── GET    /my-transactions     (Get user's transactions - JWT required)
│   ├── GET    /:id                 (Get transaction details - JWT required)
│   └── PATCH  /:id/status          (Update transaction status - JWT required)
│
└── /messages
    ├── GET    /conversations       (Get all conversations - JWT required)
    ├── GET    /conversations/:id   (Get conversation by ID - JWT required)
    ├── GET    /                    (Get messages - JWT required)
    ├── POST   /                    (Send message via HTTP fallback - JWT required)
    ├── POST   /conversations/:id/read  (Mark conversation as read - JWT required)
    ├── GET    /unread/count        (Get total unread count - JWT required)
    ├── GET    /search              (Search messages - JWT required)
    └── DELETE /:id                 (Delete message - JWT required)
```

### WebSocket Events (Socket.IO)
```
Namespace: /messages
Authentication: JWT via socket.handshake.auth.token

Client → Server Events:
├── message:send             { receiverId: uuid, text: string }
├── typing:start             { receiverId: uuid }
├── typing:stop              { receiverId: uuid }
└── messages:markRead        { conversationId: uuid }

Server → Client Events:
├── message:sent             { message: Message }
├── message:received         { message: Message }
├── typing:start             { userId: uuid }
├── typing:stop              { userId: uuid }
├── messages:read            { conversationId: uuid, messageIds: uuid[] }
├── user:online              { userId: uuid }
├── user:offline             { userId: uuid }
└── conversations:unread     { conversations: UnreadCount[] }
```

### API Response Format
```typescript
// Success Response
{
  data: T,
  message?: string
}

// Error Response
{
  statusCode: number,
  message: string | string[],
  error: string
}
```

---

## Authentication & Authorization

### JWT Token Flow
```
1. User Login/Register
   ↓
2. Backend validates credentials
   ↓
3. Generate JWT with payload:
   {
     email: string,
     sub: uuid (user id),
     iat: timestamp,
     exp: timestamp (7 days from now)
   }
   ↓
4. Frontend stores token in localStorage
   ↓
5. Axios interceptor adds token to all requests:
   Authorization: Bearer <token>
   ↓
6. Backend JwtAuthGuard validates token
   ↓
7. Request.user populated with user data
```

### Protected Routes
- All routes under `@UseGuards(JwtAuthGuard)` require valid JWT
- User ID extracted from token, not from request body (prevents impersonation)
- Token expires after 7 days (configurable in .env)

### Security Measures
- Passwords hashed with bcrypt (10 rounds)
- JWT signed with secret key (HS256 algorithm)
- CORS configured (only allows frontend origin)
- Input validation with class-validator
- SQL injection prevention (TypeORM parameterized queries)

---

## File Storage

### Cloudinary Integration

**Purpose:** Cloud-based image storage and CDN delivery for user avatars

**Upload Process:**
```typescript
1. Frontend: User selects image → Crop/Rotate → Convert to File
2. POST /users/profile/avatar (multipart/form-data)
3. Backend: multer receives file buffer
4. Backend: Cloudinary.upload_stream(buffer)
5. Cloudinary: Returns secure_url (CDN URL)
6. Backend: Save URL to user.avatar in database
7. Frontend: Update AuthContext with new avatar URL
```

**Configuration:**
- Folder: `tixpeer/avatars`
- Public ID: `user-{userId}`
- File Types: jpg, jpeg, png, gif, webp
- Max Size: 5MB
- Transformations: Applied client-side (crop, rotate)

**Benefits:**
- No local file storage needed
- Automatic CDN delivery (fast worldwide)
- Image optimization built-in
- Free tier: 25GB storage + bandwidth

**Migration Path:**
- Future: Can migrate to AWS S3 for enterprise scale
- URL stored in DB makes migration seamless (just update upload logic)

---

## Frontend Architecture

### Component Structure
```
src/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (AuthProvider, LocationProvider)
│   ├── page.tsx                # Homepage (event listings)
│   ├── login/page.tsx          # Login page
│   ├── register/page.tsx       # Registration page
│   ├── profile/page.tsx        # User profile management
│   ├── create/page.tsx         # Create listing
│   ├── events/[id]/page.tsx    # Event detail page
│   ├── listings/[id]/page.tsx  # Listing detail page
│   └── users/[id]/page.tsx     # Public user profile
│
├── components/
│   ├── Header.tsx              # Main navigation header
│   ├── Footer.tsx              # Footer component
│   ├── LocationSelector.tsx    # City selection dialog
│   └── ui/                     # shadcn/ui components
│
├── contexts/
│   ├── AuthContext.tsx         # Authentication state management
│   ├── LocationContext.tsx     # Selected city state
│   └── MessagesContext.tsx     # WebSocket messaging state
│
├── lib/
│   └── api.ts                  # Axios API client singleton
│
└── types/
    └── index.ts                # TypeScript type definitions
```

### State Management

**React Context API:**
- `AuthContext`: User authentication state, login/logout, token management
- `LocationContext`: Selected city for filtering events
- `MessagesContext`: WebSocket connection, conversations, messages, real-time events

**Why Context vs Redux:**
- Simple state (auth, location, messaging)
- No complex state mutations
- Fewer dependencies
- Easier to understand and maintain
- Built-in WebSocket lifecycle management in MessagesContext

### Routing Strategy

**App Router (Next.js 14):**
- Server Components by default (performance)
- Client Components (`'use client'`) for interactivity
- File-based routing
- Nested layouts
- Loading states with `loading.tsx`

---

## Key Design Decisions

### 1. Monorepo with npm Workspaces
**Decision:** Use npm workspaces instead of separate repos

**Rationale:**
- Shared TypeScript types between frontend/backend
- Simplified dependency management
- Single repository for version control
- Easier CI/CD setup

### 2. Listings vs Tickets
**Decision:** Create Listings module (offers/requests) separate from legacy Tickets

**Rationale:**
- Tickets = actual ticket inventory
- Listings = marketplace posts (people offering OR requesting tickets)
- Enables peer-to-peer matching
- More flexible than traditional inventory model

**Current State:**
- Listings: Active module for marketplace
- Tickets: Legacy module still used by Transactions (not yet migrated)

### 3. Cloudinary for Image Storage
**Decision:** Use Cloudinary instead of local file storage or AWS S3

**Rationale:**
- No local disk management needed
- Built-in CDN (fast globally)
- Free tier sufficient for MVP
- Easy migration path to S3 later
- Automatic image optimization

### 4. JWT in localStorage
**Decision:** Store JWT in localStorage instead of httpOnly cookies

**Rationale:**
- Simpler implementation for SPA
- Works with CORS
- Easy to send with Axios interceptor
- Trade-off: Vulnerable to XSS (mitigated by CSP, input sanitization)

**Future Consideration:**
- Migrate to httpOnly cookies for production (more secure)
- Add refresh token rotation

### 5. Trust Score System
**Decision:** Implement "trust by default" scoring system (0.0-5.0) instead of traditional reviews

**Rationale:**
- **New users start at maximum (5.0)**: Encourages participation and removes barriers to entry
- **Trust can only decrease**: Through negative actions, reviews, or violations
- **More welcoming approach**: Assumes good faith until proven otherwise
- **Community-driven**: Trust is earned through behavior, not just transaction count
- **Simpler than reviews**: Numeric score easier to display/compare
- **Scalable**: Can expand to detailed reviews later while maintaining core score

**Implementation:**
- Range: 0.0 (no trust) to 5.0 (maximum trust)
- Default for new users: 5.0
- Decreases through: failed transactions, negative reviews, policy violations
- Never increases above 5.0 (maintains ceiling)
- Displayed prominently on user profiles alongside completed trades count

### 6. Email Verification Flow
**Decision:** Allow account creation but require email verification for full features

**Rationale:**
- Reduces friction in signup
- Prevents spam/fake accounts
- Token-based verification (expires in 24h)
- Can resend verification email

---

## Performance Considerations

### Database
- TypeORM eager loading to prevent N+1 queries
- Indexes on frequently queried fields (email, eventId, userId)
- Connection pooling (default TypeORM settings)

### Frontend
- Next.js automatic code splitting
- Image lazy loading
- Debounced search input
- Cached event data for search suggestions

### API
- Pagination planned for listings (not yet implemented)
- Response caching headers set by NestJS
- Gzip compression enabled

---

## Future Architecture Enhancements

### Completed Features
1. ✅ **Real-time Messaging:** Socket.IO WebSockets for peer-to-peer chat
   - Conversation management with unique user pair indexing
   - Real-time message delivery, typing indicators, read receipts
   - Online/offline user status tracking
   - Unread message counts and notifications
   - Message search and conversation filtering

### Planned Improvements
1. **Payment Integration:** Stripe for secure transactions
2. **Search Enhancement:** Elasticsearch for advanced search
3. **Caching Layer:** Redis for session management and API caching
4. **CDN:** CloudFront for frontend static assets
5. **Monitoring:** Sentry for error tracking, DataDog for metrics
6. **Testing:** Jest unit tests, Playwright E2E tests
7. **Message Enhancements:** File attachments, message reactions, group chats

### Scalability Roadmap
- Horizontal scaling with load balancer
- Database read replicas
- Microservices architecture (if needed at scale)
- Message queue (RabbitMQ/SQS) for async jobs

---

## Development Workflow

### Local Development
1. Start PostgreSQL: `npm run db:up`
2. Start backend: `npm run dev` (runs both backend and frontend)
3. Access:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Swagger Docs: http://localhost:3001/api/docs
   - pgAdmin: http://localhost:5050

### Database Seeding
- Run seed: `RUN_SEED=true npm run dev`
- Seed script: `backend/src/database/seeds/seed.ts`
- Creates: 500 users, 100+ events, 1000+ listings

### Environment Variables
- `.env` at root level
- Backend reads from `../.env`
- Key variables:
  - `DATABASE_*`: PostgreSQL connection
  - `JWT_SECRET`: Token signing key
  - `CLOUDINARY_*`: Image upload credentials
  - `SENDGRID_API_KEY`: Email service
  - `CORS_ORIGIN`: Frontend URL

---

**Document Maintained By:** Claude Code
**Review Frequency:** Updated as architecture evolves
