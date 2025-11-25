# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TixPeer is a peer-to-peer ticket exchange marketplace that connects fans directly to buy, sell, and trade event tickets. Unlike traditional platforms, TixPeer doesn't hold inventory or act as a seller—it simply provides the marketplace space for users to list tickets and connect with each other. The application features user authentication, ticket listings with search/filter capabilities, peer-to-peer transaction facilitation, and user profile management.

## CRITICAL DEVELOPMENT RULES

**These rules MUST be followed for all feature development and code modifications.**

**Rules are ordered by priority: session setup → operational protocols → development standards → code quality → documentation.**

---

### Priority 1: Session Setup

1. **Session Initialization Protocol**
   - At the start of every new session, read ARCHITECTURE.md to understand the current system state
   - This provides context on:
     - Overall system architecture and component relationships
     - Database schema and entity relationships
     - Available API endpoints and their purposes
     - Technology stack and external services
     - Key design decisions and rationale
   - Reading the architecture document ensures faster onboarding and prevents reinventing solutions
   - After reading ARCHITECTURE.md, be prepared to answer questions and make informed decisions based on the documented architecture

---

### Priority 2: Operational Protocols

2. **Rule Violation Protocol**
   - If I violate any rule in CLAUDE.md, I must acknowledge the violation immediately when called out
   - I must explain which rule was broken and why the violation occurred
   - I must take corrective action (revert changes, ask permission retroactively, etc.)
   - After correcting the violation, I should briefly explain what I'll do differently to avoid repeating it
   - This ensures accountability and continuous improvement in following established guidelines

3. **Documentation Updates Require Approval**
   - When development changes warrant updates to existing documentation files (CLAUDE.md, CACHING.md, etc.)
   - ALWAYS ask for permission BEFORE updating any documentation
   - Do NOT automatically update documentation without explicit approval
   - This ensures proper control over what gets documented and when
   - Exception: Creating NEW documentation files when explicitly requested

4. **Add New Rules to CLAUDE.md With Permission**
   - When the user requests a new rule or workflow to follow
   - ALWAYS ask for permission before adding the rule to CLAUDE.md
   - Once approved, add it to this CLAUDE.md file under the appropriate section
   - This ensures rules are permanently documented and consistently followed across sessions
   - Format rules clearly with bullet points explaining what to do and why

---

### Priority 3: Core Development Standards

5. **End-to-End Functionality Required**
   - Every feature must work completely from frontend → backend → database
   - No half-implemented features or placeholder functionality
   - Test the full user flow before considering a feature complete

6. **NO Mock or Random Data in Frontend**
   - All data displayed in the frontend MUST come from the backend API
   - NEVER use hardcoded arrays, faker libraries, or random data generators in frontend components
   - If a feature needs data, implement the backend endpoint and database model first
   - The only exception is initial seed data in `backend/src/database/seeds/` for development

7. **Full-Stack Development Always**
   - Do not avoid backend work - implement what's required for the feature
   - Create/modify database entities, services, controllers, and API endpoints as needed
   - Ensure proper data flow: Database ↔ Backend API ↔ Frontend
   - Update API client methods in `frontend/src/lib/api.ts` for all new endpoints

---

### Priority 4: Code Quality

8. **Code Must Be Well-Commented**
   - Add clear comments explaining:
     - WHY code exists (business logic and reasoning)
     - WHAT complex operations do (step-by-step for non-obvious code)
     - Important data flows and transformations
     - API contracts, expected request/response formats
   - Use JSDoc comments for functions with parameters and return types
   - Make code readable and maintainable for human developers
   - Example:
     ```typescript
     /**
      * Fetches all active listings for a specific event
      * @param eventId - UUID of the event
      * @returns Array of listings with user and event details populated
      */
     async getListingsByEvent(eventId: string): Promise<Listing[]> {
       // Query includes relations to avoid N+1 queries
       return this.listingRepository.find({
         where: { eventId, status: 'active' },
         relations: ['user', 'event']
       });
     }
     ```

9. **Maintain Comments as Code Evolves**
   - When modifying code, ALWAYS update or remove related comments
   - Delete comments that no longer apply to the current implementation
   - Add new comments when introducing new logic or complexity
   - NEVER leave deprecated/outdated comments in the codebase
   - Comments that contradict the code are worse than no comments
   - During refactoring, treat comments as part of the code to be refactored
   - Examples of what to do:
     - ✅ Remove comment when deleting a function
     - ✅ Update JSDoc when changing function parameters
     - ✅ Remove "TODO" comments after completing the task
     - ✅ Update explanation when changing business logic
     - ❌ Leave comment saying "fetches users" when code now fetches events
     - ❌ Keep comment about "pagination" after removing pagination feature

---

### Priority 5: Documentation & Tracking

10. **Architecture Documentation Maintenance**
   - When making architectural changes, update ARCHITECTURE.md to reflect the changes
   - Architectural changes include:
     - New modules, services, or controllers
     - Database schema changes (new tables, columns, relationships)
     - New API endpoints or endpoint modifications
     - External service integrations (Cloudinary, SendGrid, etc.)
     - Authentication/authorization changes
     - Data flow modifications
   - Keep the "Last Updated" date current at the top of ARCHITECTURE.md
   - Update relevant sections: API structure, database schema, tech stack, data flows, etc.
   - Maintain consistency between code implementation and documentation
   - This ensures the architecture document stays accurate and useful for understanding the system

11. **Create Proper Notes for Tracking**
   - When the user says "make a note", ALWAYS create a proper tracking note in an appropriate file
   - Use or create a TODO.md file in the relevant directory (frontend/TODO.md, backend/TODO.md, or root TODO.md)
   - Notes should include:
     - Clear description of the issue or future work needed
     - Current implementation details with file locations and line numbers
     - Why the work is needed or what problem exists
     - Possible solutions or approaches to investigate
     - Priority level (High/Medium/Low)
   - This ensures important issues and future work are documented and not forgotten across sessions

12. **Auto-generate Commit Messages**
   - After generating new code or files, automatically generate a commit message
   - Simply print the commit message for the user to copy and commit
   - Follow the existing commit message format with:
     - Concise title describing the changes
     - Bulleted list of specific changes grouped by category
     - Technical details where relevant
     - Standard footer with Claude Code attribution
   - Do NOT wait for user to ask - provide commit message proactively at the end of work
   - This streamlines the git workflow and ensures consistent commit history

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
