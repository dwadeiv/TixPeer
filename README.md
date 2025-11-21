# Ticket Exchange

A full-stack ticket marketplace application for buying and selling event tickets. Built with Next.js, NestJS, and PostgreSQL.

## Features

- **User Authentication**: JWT-based authentication with secure registration and login
- **Ticket Listings**: Browse, search, and filter tickets by category
- **Ticket Management**: Create, update, and delete your ticket listings
- **Transactions**: Secure ticket purchasing system
- **User Profiles**: Manage your profile and view purchase/sales history

## Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Axios** - API communication

### Backend
- **NestJS** - Enterprise-grade Node.js framework
- **TypeScript** - Type-safe development
- **TypeORM** - ORM for PostgreSQL
- **Passport & JWT** - Authentication
- **Swagger** - API documentation

### Database
- **PostgreSQL 16** - Relational database
- **pgAdmin** - Database management interface

## Project Structure

```
Ticket-Exchange/
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/      # Next.js App Router pages
│   │   ├── components/ # React components
│   │   └── lib/      # Utilities and API client
│   └── public/       # Static assets
├── backend/          # NestJS backend application
│   └── src/
│       ├── auth/     # Authentication module
│       ├── users/    # Users module
│       ├── tickets/  # Tickets module
│       ├── transactions/ # Transactions module
│       └── database/ # Database configuration
├── shared/           # Shared types and constants
│   └── src/
│       ├── types.ts      # TypeScript interfaces
│       └── constants.ts  # Shared constants
└── docker-compose.yml # PostgreSQL setup
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose (for PostgreSQL)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Ticket-Exchange
```

2. Install dependencies for all workspaces:
```bash
npm install
```

3. Copy the environment variables template:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=ticket_exchange
DATABASE_PASSWORD=your_secure_password_here
DATABASE_NAME=ticket_exchange_db

# Backend Configuration
BACKEND_PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRATION=7d

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

5. Start the PostgreSQL database:
```bash
npm run db:up
```

6. Start the development servers:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API Documentation: http://localhost:3001/api/docs
- pgAdmin: http://localhost:5050

## Development Commands

### Root Commands
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only
npm run build            # Build all workspaces
npm run test             # Run tests in all workspaces
npm run lint             # Lint all workspaces
npm run format           # Format code with Prettier
```

### Database Commands
```bash
npm run db:up            # Start PostgreSQL with Docker
npm run db:down          # Stop PostgreSQL
npm run db:reset         # Reset database (removes all data)
```

### Frontend Commands
```bash
cd frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript types
```

### Backend Commands
```bash
cd backend
npm run start:dev        # Start dev server with watch mode
npm run build            # Build for production
npm run start:prod       # Start production server
npm run lint             # Run ESLint
npm run test             # Run unit tests
npm run test:e2e         # Run end-to-end tests
npm run migration:generate # Generate TypeORM migration
npm run migration:run    # Run migrations
npm run migration:revert # Revert last migration
```

## Database Access

### PostgreSQL
- **Host**: localhost
- **Port**: 5432
- **Database**: ticket_exchange_db
- **User**: ticket_exchange
- **Password**: See your `.env` file

### pgAdmin
1. Open http://localhost:5050
2. Login with:
   - Email: `admin@ticket-exchange.local`
   - Password: `admin`
3. Add server:
   - Host: `postgres` (use Docker service name)
   - Port: 5432
   - Database: ticket_exchange_db
   - Username: ticket_exchange
   - Password: Your DB password from `.env`

## API Documentation

Once the backend is running, visit http://localhost:3001/api/docs for interactive Swagger documentation.

### Key Endpoints

**Authentication**
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token

**Users**
- `GET /users/profile` - Get current user profile
- `PATCH /users/profile` - Update profile

**Tickets**
- `GET /tickets` - List all available tickets
- `GET /tickets/:id` - Get ticket details
- `POST /tickets` - Create a ticket listing
- `PATCH /tickets/:id` - Update a ticket
- `DELETE /tickets/:id` - Delete a ticket
- `GET /tickets/my-tickets` - Get user's tickets

**Transactions**
- `POST /transactions` - Purchase a ticket
- `GET /transactions/my-transactions` - Get user's transactions
- `GET /transactions/:id` - Get transaction details
- `PATCH /transactions/:id/status` - Update transaction status

## Environment Variables

See `.env.example` for all available environment variables and their descriptions.

## Production Deployment

### Build for Production

```bash
npm run build
```

### Frontend Deployment
The Next.js app can be deployed to:
- Vercel (recommended)
- Netlify
- AWS Amplify
- Self-hosted Node.js server

### Backend Deployment
The NestJS API can be deployed to:
- Heroku
- AWS (EC2, ECS, Lambda)
- DigitalOcean
- Self-hosted server

### Database
For production, use a managed PostgreSQL service:
- AWS RDS
- DigitalOcean Managed Databases
- Heroku Postgres
- Supabase

## Security Notes

- Change `JWT_SECRET` in production to a strong, random value
- Use environment variables for all sensitive configuration
- Enable HTTPS in production
- Set `NODE_ENV=production` in production environments
- Configure proper CORS settings for your frontend domain
- Regularly update dependencies for security patches

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all tests pass
4. Submit a pull request

## License

[Add your license here]
