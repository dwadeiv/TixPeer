# TixPeer Architecture

**Last Updated:** November 24, 2025

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
│  │  - React Context (Auth, Location)                         │  │
│  │  - Tailwind CSS + shadcn/ui                               │  │
│  │  - Axios API Client                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           NestJS Backend (Port 3001)                      │  │
│  │  - RESTful API Controllers                                │  │
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
│                            │  │  SendGrid (Future)       │
│  Docker Container          │  │  - Email Verification    │
│  Port: 5432                │  │  - Notifications         │
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
├── trustScore (decimal(3,1), default: 0)
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
├── category (enum: concert, sports, theater, comedy, festival, other)
├── imageUrl (varchar, nullable)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

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

### Relationships
```
User 1──────── * Listings (as seller/requester)
User 1──────── * Tickets (as seller)
User 1──────── * Transactions (as buyer)
User 1──────── * Transactions (as seller)

Event 1──────── * Listings

Ticket 1──────── * Transactions
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
│   ├── GET    /                    (Get all events, filter by city/category)
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
└── /transactions
    ├── POST   /                    (Create transaction - JWT required)
    ├── GET    /my-transactions     (Get user's transactions - JWT required)
    ├── GET    /:id                 (Get transaction details - JWT required)
    └── PATCH  /:id/status          (Update transaction status - JWT required)
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
│   └── LocationContext.tsx     # Selected city state
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

**Why Context vs Redux:**
- Simple state (only auth + location)
- No complex state mutations
- Fewer dependencies
- Easier to understand and maintain

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
**Decision:** Implement trust scores instead of traditional reviews

**Rationale:**
- Simpler than full review system
- Encourages completed trades
- Numeric score easier to display/compare
- Can expand to reviews later

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

### Planned Improvements
1. **Real-time Messaging:** WebSockets for peer-to-peer chat
2. **Payment Integration:** Stripe for secure transactions
3. **Search Enhancement:** Elasticsearch for advanced search
4. **Caching Layer:** Redis for session management and API caching
5. **CDN:** CloudFront for frontend static assets
6. **Monitoring:** Sentry for error tracking, DataDog for metrics
7. **Testing:** Jest unit tests, Playwright E2E tests

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
