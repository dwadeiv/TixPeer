# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ticket Exchange is a full-stack ticket marketplace application where users can buy and sell event tickets. The application features user authentication, ticket listings with search/filter capabilities, secure transactions, and user profile management.

## Technology Stack

- **Frontend**: Next.js 14+ with TypeScript, App Router, Tailwind CSS
- **Backend**: NestJS with TypeScript, TypeORM, Passport/JWT authentication
- **Database**: PostgreSQL 16 with pgAdmin
- **Monorepo**: npm workspaces with shared types package

## Development Commands

### Most Common Commands
- `npm run dev` - Start both frontend (port 3000) and backend (port 3001)
- `npm run db:up` - Start PostgreSQL database with Docker
- `npm run db:down` - Stop PostgreSQL database
- `npm install` - Install dependencies for all workspaces

### Frontend Specific
- `cd frontend && npm run dev` - Start frontend dev server only
- `cd frontend && npm run build` - Build frontend for production
- `cd frontend && npm run type-check` - Type check without building

### Backend Specific
- `cd backend && npm run start:dev` - Start backend with watch mode
- `cd backend && npm run build` - Build backend for production
- `cd backend && npm run test` - Run unit tests
- `cd backend && npm run migration:generate` - Generate database migration
- `cd backend && npm run migration:run` - Run pending migrations

### Database Access
- PostgreSQL: localhost:5432 (user: ticket_exchange, db: ticket_exchange_db)
- pgAdmin: http://localhost:5050 (admin@ticket-exchange.local / admin)
- Swagger API Docs: http://localhost:3001/api/docs

## Architecture

### Monorepo Structure
The project uses npm workspaces with three packages:
- `frontend/` - Next.js application
- `backend/` - NestJS API server
- `shared/` - Common TypeScript types and constants

### Backend Architecture (NestJS)

**Module Structure**: The backend follows NestJS module pattern with feature-based organization.

**Core Modules**:
- `auth/` - JWT authentication, local strategy, guards (JwtAuthGuard, LocalAuthGuard)
- `users/` - User management, profile endpoints, bcrypt password hashing
- `tickets/` - Ticket CRUD operations, filtering, search functionality
- `transactions/` - Purchase system, transaction status management
- `database/` - TypeORM configuration, data source for migrations

**Entity Relationships**:
- User → has many Tickets (as seller)
- User → has many Transactions (as buyer or seller)
- Ticket → belongs to User (seller)
- Ticket → has many Transactions
- Transaction → belongs to Ticket, User (buyer), User (seller)

**Authentication Flow**:
1. User registers via `/auth/register` (password hashed with bcrypt)
2. User logs in via `/auth/login` with LocalStrategy
3. Server returns JWT token with 7-day expiration
4. Protected routes use JwtAuthGuard to validate token
5. JwtStrategy extracts user from token payload

**Database Configuration**:
- TypeORM with PostgreSQL
- Auto-sync enabled in development (synchronize: true)
- Migrations used for production
- Data source in `backend/src/database/data-source.ts`

### Frontend Architecture (Next.js)

**App Router Structure**: Uses Next.js 14+ App Router with server/client components.

**Key Directories**:
- `src/app/` - Pages using App Router (layout.tsx, page.tsx)
- `src/components/` - Reusable React components (Header, Footer)
- `src/lib/` - Utilities and API client

**API Client** (`frontend/src/lib/api.ts`):
- Axios-based singleton client
- Automatic JWT token injection via interceptor
- Automatic redirect to /login on 401 responses
- Token stored in localStorage
- Methods for all API endpoints (auth, tickets, transactions, users)

**Styling**:
- Tailwind CSS with custom primary color palette
- Utility classes for buttons (btn-primary, btn-secondary)
- Inter font from Google Fonts
- Responsive design with mobile-first approach

### Shared Package

**Purpose**: Share TypeScript types and constants between frontend and backend.

**Key Files**:
- `shared/src/types.ts` - All TypeScript interfaces and enums
- `shared/src/constants.ts` - API endpoints, dropdown options, status labels
- `shared/src/index.ts` - Exports all types and constants

**Usage**: Import from `shared` in both frontend and backend to ensure type consistency.

## Database Schema

### Users Table
- id (uuid, primary key)
- email (unique)
- password (hashed)
- name
- phone (optional)
- isActive (boolean)
- timestamps (createdAt, updatedAt)

### Tickets Table
- id (uuid, primary key)
- title, description
- category (enum: concert, sports, theater, comedy, festival, other)
- eventDate, venue, location
- price (decimal), quantity (int)
- status (enum: available, sold, reserved, cancelled)
- section, row, seat (optional seat details)
- sellerId (foreign key to Users)
- timestamps

### Transactions Table
- id (uuid, primary key)
- ticketId (foreign key to Tickets)
- buyerId, sellerId (foreign keys to Users)
- amount (decimal), quantity (int)
- status (enum: pending, completed, cancelled, refunded)
- paymentIntentId (optional, for payment gateway)
- timestamps

## Code Patterns and Conventions

### Backend Patterns
- Use decorators: `@Controller`, `@Get`, `@Post`, `@UseGuards(JwtAuthGuard)`, `@ApiBearerAuth()`
- DTOs validated with class-validator decorators
- Services handle business logic, controllers handle HTTP
- Repository pattern via TypeORM `@InjectRepository`
- Password hashing: `bcrypt.hash(password, 10)` for registration
- All protected routes require `@UseGuards(JwtAuthGuard)`

### Frontend Patterns
- Use `'use client'` directive for interactive components
- API calls in components using the `api` singleton
- Server Components by default, Client Components when needed
- Tailwind classes for all styling
- Type imports from `shared` package

### Authentication Pattern
**Backend**:
```typescript
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Get('profile')
getProfile(@Request() req) {
  return this.usersService.findOne(req.user.id);
}
```

**Frontend**:
```typescript
import { api } from '@/lib/api';
const response = await api.login(email, password);
api.setToken(response.access_token);
```

### Error Handling
- Backend uses NestJS exceptions: `NotFoundException`, `UnauthorizedException`, `ForbiddenException`, `BadRequestException`
- Frontend API client catches 401 and redirects to login
- All errors return consistent format via NestJS exception filters

## Environment Configuration

All environment variables in `.env` file at root level:
- Database connection (DATABASE_HOST, DATABASE_PORT, etc.)
- Backend port (BACKEND_PORT, default 3001)
- JWT configuration (JWT_SECRET, JWT_EXPIRATION)
- Frontend API URL (NEXT_PUBLIC_API_URL)
- CORS origin (CORS_ORIGIN)

Backend reads from `../.env` (parent directory)

## Testing

- Backend: Jest for unit and e2e tests
- Frontend: Currently no test setup (can be added later)
- Run `npm test` in backend directory

## Common Tasks

### Adding a New Entity/Module
1. Create entity in `backend/src/[module]/entities/`
2. Create module, service, controller in `backend/src/[module]/`
3. Add to `app.module.ts` imports
4. Add types to `shared/src/types.ts`
5. Add API methods to `frontend/src/lib/api.ts`

### Adding a New API Endpoint
1. Add controller method with decorators
2. Implement service logic
3. Add Swagger decorators (`@ApiOperation`, `@ApiTags`)
4. Add method to frontend API client
5. Add endpoint to `shared/src/constants.ts`

### Creating a Migration
1. Modify entity files
2. Run `cd backend && npm run migration:generate -- src/database/migrations/MigrationName`
3. Review generated migration
4. Run `npm run migration:run` to apply

### Adding Authentication to Route
**Backend**: Add `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()` decorators
**Frontend**: Ensure user is logged in and token is set via `api.setToken()`

## Deployment Notes

- Set `NODE_ENV=production` in production
- Change `JWT_SECRET` to secure random value
- Set `synchronize: false` in TypeORM (use migrations)
- Build frontend: `npm run build --workspace=frontend`
- Build backend: `npm run build --workspace=backend`
- Start backend production: `cd backend && npm run start:prod`
- Frontend can deploy to Vercel (recommended) or self-host
