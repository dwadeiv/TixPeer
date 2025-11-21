# Testing Guide

## Quick Start Testing

Follow these steps to test the Ticket Exchange application.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment

```bash
cp .env.example .env
```

The default values in `.env.example` work for local development, but you can customize them if needed.

## Step 3: Start the Database

```bash
npm run db:up
```

Wait 10-15 seconds for PostgreSQL to fully start.

## Step 4: Start the Application

```bash
npm run dev
```

This starts both frontend and backend. You should see:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Swagger: http://localhost:3001/api/docs

## Testing Checklist

### ✅ Test 1: Frontend Homepage
1. Open http://localhost:3000
2. You should see "Welcome to Ticket Exchange" page
3. Header with navigation links
4. Three feature cards
5. Footer with links

### ✅ Test 2: Backend Health
1. Open http://localhost:3001/api/docs
2. You should see Swagger API documentation
3. Green "Authorize" button at top right

### ✅ Test 3: Database Connection
1. Open http://localhost:5050
2. Login with:
   - Email: `admin@ticket-exchange.local`
   - Password: `admin`
3. Click "Add New Server"
4. In "General" tab: Name it "Ticket Exchange"
5. In "Connection" tab:
   - Host: `postgres`
   - Port: `5432`
   - Database: `ticket_exchange_db`
   - Username: `ticket_exchange`
   - Password: `dev_password_123`
6. Click "Save"
7. Navigate to: Servers > Ticket Exchange > Databases > ticket_exchange_db > Schemas > public > Tables
8. You should see: `users`, `tickets`, `transactions` tables

## API Testing with Swagger

### Test 4: Register a User
1. Go to http://localhost:3001/api/docs
2. Find "POST /auth/register" endpoint
3. Click "Try it out"
4. Enter this JSON:
```json
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User"
}
```
5. Click "Execute"
6. Should return 201 with access_token

### Test 5: Login
1. Find "POST /auth/login" endpoint
2. Click "Try it out"
3. Enter:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
4. Click "Execute"
5. Copy the `access_token` from response
6. Click green "Authorize" button at top
7. Enter: `Bearer YOUR_TOKEN_HERE`
8. Click "Authorize" then "Close"

### Test 6: Get Your Profile
1. Find "GET /users/profile" (shows lock icon)
2. Click "Try it out"
3. Click "Execute"
4. Should return your user info

### Test 7: Create a Ticket
1. Find "POST /tickets"
2. Click "Try it out"
3. Enter:
```json
{
  "title": "Taylor Swift Concert",
  "description": "Great seats, section A",
  "category": "concert",
  "eventDate": "2024-12-31T20:00:00Z",
  "venue": "Madison Square Garden",
  "location": "New York, NY",
  "price": 299.99,
  "quantity": 2,
  "section": "A",
  "row": "12",
  "seat": "5-6"
}
```
4. Click "Execute"
5. Should return 201 with ticket details

### Test 8: List All Tickets
1. Find "GET /tickets"
2. Click "Try it out"
3. Click "Execute"
4. Should return array with your ticket

### Test 9: Search Tickets
1. Find "GET /tickets"
2. Click "Try it out"
3. Enter `search`: `Taylor`
4. Click "Execute"
5. Should return your Taylor Swift ticket

### Test 10: Filter by Category
1. Find "GET /tickets"
2. Click "Try it out"
3. Enter `category`: `concert`
4. Click "Execute"
5. Should return concert tickets only

## Testing with cURL

If you prefer command line:

### Register User
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "curl@example.com",
    "password": "password123",
    "name": "Curl User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "curl@example.com",
    "password": "password123"
  }'
```

Save the token from response, then:

### Get Profile
```bash
curl http://localhost:3001/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Ticket
```bash
curl -X POST http://localhost:3001/tickets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "NBA Finals Game 7",
    "description": "Courtside seats",
    "category": "sports",
    "eventDate": "2024-06-20T19:00:00Z",
    "venue": "Chase Center",
    "location": "San Francisco, CA",
    "price": 1500.00,
    "quantity": 2
  }'
```

## Database Verification

After creating tickets, verify in pgAdmin:

```sql
-- View all users
SELECT id, email, name, "createdAt" FROM users;

-- View all tickets
SELECT id, title, price, quantity, status, "sellerId" FROM tickets;

-- View tickets with seller info
SELECT
  t.title,
  t.price,
  t.category,
  u.name as seller_name,
  u.email as seller_email
FROM tickets t
JOIN users u ON t."sellerId" = u.id;
```

## Common Issues

### Issue: "Port 3000 already in use"
**Solution**: Kill the process using port 3000
```bash
lsof -ti:3000 | xargs kill -9
```

### Issue: "Port 3001 already in use"
**Solution**: Kill the process using port 3001
```bash
lsof -ti:3001 | xargs kill -9
```

### Issue: "Database connection failed"
**Solution**: Restart Docker containers
```bash
npm run db:down
npm run db:up
# Wait 15 seconds
npm run dev
```

### Issue: "Cannot find module"
**Solution**: Reinstall dependencies
```bash
rm -rf node_modules frontend/node_modules backend/node_modules shared/node_modules
npm install
```

### Issue: Backend crashes on start
**Solution**: Check if database is running
```bash
docker ps
# Should show postgres container running
```

## Next Steps

Once you've verified everything works:

1. Try creating multiple users
2. Create tickets as different users
3. Try purchasing tickets (create transaction)
4. Experiment with the API endpoints
5. Check the database to see how data is stored

## Testing Multi-User Scenarios

To test the full flow:

1. **Create User 1 (Seller)**:
   - Register as `seller@example.com`
   - Login and save token
   - Create a ticket
   - Copy the ticket ID

2. **Create User 2 (Buyer)**:
   - Register as `buyer@example.com`
   - Login and save token (different token!)
   - View the ticket (GET /tickets/:id)
   - Create a transaction to buy it

3. **Verify**:
   - Check database transactions table
   - User 1 should see it in their sales
   - User 2 should see it in their purchases
