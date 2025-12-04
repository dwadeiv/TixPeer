# TixPeer Testing Strategy

**Last Updated:** December 3, 2025

This document outlines the comprehensive testing strategy for TixPeer, including test types, infrastructure setup, and implementation guidelines.

## Table of Contents

- [Overview](#overview)
- [Why 80% Coverage (Not 100%)](#why-80-coverage-not-100)
- [Test Types](#test-types)
- [Implementation Phases](#implementation-phases)
- [Test Infrastructure](#test-infrastructure)
- [Running Tests](#running-tests)
- [Test File Locations](#test-file-locations)
- [Writing Tests Guidelines](#writing-tests-guidelines)

---

## Overview

TixPeer uses a multi-layered testing approach:

| Layer | Framework | Purpose | Count |
|-------|-----------|---------|-------|
| **Unit Tests** | Jest | Test services in isolation | ~80 tests |
| **Integration Tests** | Jest + Supertest | Test HTTP endpoints with real DB | ~50 tests |
| **WebSocket Tests** | Jest + Socket.IO Client | Test real-time messaging | ~20 tests |
| **Frontend Tests** | Jest + React Testing Library | Test components and contexts | ~30 tests |
| **E2E Tests** | Playwright | Test complete user journeys | ~10 tests |

**Total Estimated Tests: ~190**

**Target Coverage: 80%+**

---

## Why 80% Coverage (Not 100%)

We target 80% code coverage instead of 100% for several practical reasons:

### 1. Diminishing Returns
The effort to go from 80% to 100% is often greater than going from 0% to 80%. The last 20% typically covers edge cases that rarely occur in production.

### 2. Code That's Hard to Test Meaningfully
Some code provides little value when tested:
- **Simple getters/setters** - Testing `return this.value` doesn't catch bugs
- **Framework boilerplate** - NestJS decorators, module definitions
- **Third-party integrations** - Cloudinary uploads, SendGrid emails (mocked in unit tests, verified manually)
- **Error handling branches** - Some catch blocks exist for safety but are hard to trigger

### 3. Maintenance Burden
100% coverage means every code change requires test updates. This can:
- Slow down development velocity
- Create brittle tests that break on minor refactors
- Incentivize writing tests for coverage, not quality

### 4. False Sense of Security
100% coverage doesn't mean bug-free code. You can have 100% coverage and still miss:
- Integration issues between components
- Race conditions
- Business logic errors (wrong but tested behavior)

### 5. What We DO Test Thoroughly (>90% coverage)
- **Business logic** - Response rate calculations, transaction validations
- **Authentication flows** - Login, register, token validation
- **Data integrity** - Message delivery, unread counts, conversation ordering
- **Authorization checks** - Ownership validation, access control

### 6. What We Test Less (<70% coverage)
- Configuration files and module definitions
- Simple CRUD with no business logic
- Third-party service wrappers (tested via integration/e2e)

---

## Test Types

### 1. Unit Tests

**Purpose:** Test individual functions/methods in isolation with mocked dependencies.

**Characteristics:**
- Fast execution (no I/O)
- Mock all external dependencies (database, services)
- One test file per service
- Test both success and error paths

**Example:**
```typescript
describe('UsersService', () => {
  describe('recalculateResponseRate', () => {
    it('should calculate 50% when user replied to half of conversations', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-1',
        conversationsReceived: 10,
        conversationsReplied: 5,
      });

      // Act
      await service.recalculateResponseRate('user-1');

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalledWith('user-1', {
        responseRate: 50,
      });
    });
  });
});
```

### 2. Integration Tests

**Purpose:** Test HTTP endpoints with a real test database.

**Characteristics:**
- Use dedicated PostgreSQL test database
- Test full request/response cycle
- Verify database state changes
- Test authentication guards

**Example:**
```typescript
describe('AuthController (Integration)', () => {
  describe('POST /auth/register', () => {
    it('should create user and return JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });
  });
});
```

### 3. WebSocket Tests

**Purpose:** Test real-time messaging functionality.

**Characteristics:**
- Test Socket.IO connection lifecycle
- Verify event emission and reception
- Test authentication via handshake
- Test typing indicators and read receipts

**Example:**
```typescript
describe('MessagesGateway', () => {
  describe('message:send', () => {
    it('should deliver message to recipient in real-time', async () => {
      // Connect two clients
      const sender = await connectClient(senderToken);
      const receiver = await connectClient(receiverToken);

      // Listen for message on receiver
      const messagePromise = new Promise((resolve) => {
        receiver.on('message:received', resolve);
      });

      // Send message
      sender.emit('message:send', {
        receiverId: receiverUserId,
        text: 'Hello!',
      });

      // Verify delivery
      const receivedMessage = await messagePromise;
      expect(receivedMessage.text).toBe('Hello!');
    });
  });
});
```

### 4. Frontend Tests

**Purpose:** Test React components and context behavior.

**Characteristics:**
- Use React Testing Library (user-centric testing)
- Test context state management
- Mock API calls
- Test user interactions

**Example:**
```typescript
describe('AuthContext', () => {
  it('should update user state after successful login', async () => {
    // Mock API response
    jest.spyOn(api, 'login').mockResolvedValue({
      access_token: 'fake-token',
      user: { id: '1', name: 'Test', email: 'test@example.com' },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Trigger login
    fireEvent.click(screen.getByText('Login'));

    // Verify state update
    await waitFor(() => {
      expect(screen.getByText('Welcome, Test')).toBeInTheDocument();
    });
  });
});
```

### 5. E2E Tests (Playwright)

**Purpose:** Test complete user journeys through the browser.

**Characteristics:**
- Real browser automation
- Test full stack (frontend + backend + database)
- Verify visual elements and navigation
- Test critical user flows

**Example:**
```typescript
test('user can register, verify email, and create listing', async ({ page }) => {
  // Register
  await page.goto('/register');
  await page.fill('[name="email"]', 'newuser@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.fill('[name="name"]', 'New User');
  await page.click('button[type="submit"]');

  // Verify redirect to verification pending
  await expect(page).toHaveURL('/verify-email-pending');

  // Simulate email verification (via API)
  const token = await getVerificationToken('newuser@example.com');
  await page.goto(`/verify-email?token=${token}`);

  // Create listing
  await page.goto('/create');
  await page.selectOption('[name="eventId"]', 'event-1');
  await page.fill('[name="description"]', 'Great seats!');
  await page.click('button[type="submit"]');

  // Verify listing created
  await expect(page.locator('.listing-card')).toBeVisible();
});
```

---

## Implementation Phases

### Phase 1: Test Infrastructure Setup
- Configure Jest for backend
- Set up test database
- Create test utilities and factories
- Configure frontend testing (Jest + RTL)
- Install and configure Playwright

### Phase 2: Backend Unit Tests (High Priority)
Services in order of importance:
1. `AuthService` - Authentication is critical
2. `UsersService` - User management and response rate
3. `MessagesService` - Real-time messaging logic
4. `ListingsService` - Core marketplace functionality
5. `TransactionsService` - Financial transactions
6. `EventsService` - Event queries
7. `TicketsService` - Legacy but still used

### Phase 3: Backend Integration Tests
Controllers in order:
1. `AuthController` - All auth endpoints
2. `UsersController` - Profile management
3. `MessagesController` - Messaging API
4. `ListingsController` - Marketplace API
5. Remaining controllers

### Phase 4: WebSocket Tests
1. Connection/disconnection handling
2. Message sending and delivery
3. Typing indicators
4. Read receipts
5. Online status

### Phase 5: Frontend Tests
1. `AuthContext` - Authentication state
2. `MessagesContext` - Messaging state and WebSocket
3. API client - Request handling
4. Key pages - Profile, Messages, Listings

### Phase 6: E2E Tests
1. Registration and email verification flow
2. Login and profile management
3. Create and manage listings
4. Messaging between users

---

## Test Infrastructure

### Directory Structure

```
backend/
├── jest.config.ts                    # Jest configuration
├── test/
│   ├── setup.ts                      # Global test setup
│   ├── teardown.ts                   # Global test teardown
│   ├── utils/
│   │   ├── test-database.ts          # Test DB connection
│   │   ├── test-app.ts               # Test app bootstrap
│   │   └── test-helpers.ts           # Common test utilities
│   ├── factories/
│   │   ├── user.factory.ts           # User test data
│   │   ├── listing.factory.ts        # Listing test data
│   │   ├── event.factory.ts          # Event test data
│   │   ├── message.factory.ts        # Message test data
│   │   └── conversation.factory.ts   # Conversation test data
│   ├── unit/
│   │   ├── auth/
│   │   │   └── auth.service.spec.ts
│   │   ├── users/
│   │   │   └── users.service.spec.ts
│   │   ├── messages/
│   │   │   └── messages.service.spec.ts
│   │   ├── listings/
│   │   │   └── listings.service.spec.ts
│   │   └── ...
│   ├── integration/
│   │   ├── auth/
│   │   │   └── auth.controller.spec.ts
│   │   ├── users/
│   │   │   └── users.controller.spec.ts
│   │   └── ...
│   ├── websocket/
│   │   └── messages.gateway.spec.ts
│   └── e2e/
│       ├── auth.e2e-spec.ts
│       ├── listings.e2e-spec.ts
│       └── messaging.e2e-spec.ts

frontend/
├── jest.config.ts
├── jest.setup.ts
└── __tests__/
    ├── contexts/
    │   ├── AuthContext.test.tsx
    │   └── MessagesContext.test.tsx
    ├── lib/
    │   └── api.test.ts
    └── pages/
        ├── profile.test.tsx
        └── messages.test.tsx

e2e/
├── playwright.config.ts
├── tests/
│   ├── auth.spec.ts
│   ├── listings.spec.ts
│   └── messaging.spec.ts
└── fixtures/
    └── test-data.ts
```

### Test Database

Tests use a separate PostgreSQL database to ensure isolation:

```
Database: ticket_exchange_test_db
User: ticket_exchange
Port: 5432 (same as dev)
```

**Setup:** Database is created and migrated before test suite runs.
**Teardown:** Database is cleaned between tests (transaction rollback or truncate).

### Environment Variables

Test environment uses `.env.test`:

```env
DATABASE_NAME=ticket_exchange_test_db
NODE_ENV=test
JWT_SECRET=test-secret-key
SENDGRID_API_KEY=mock-key
```

---

## Running Tests

### Backend Tests

```bash
# Run all backend tests
cd backend && npm test

# Run with coverage
npm run test:cov

# Run specific test file
npm test -- auth.service.spec.ts

# Run tests in watch mode
npm run test:watch

# Run only unit tests
npm test -- --testPathPattern=unit

# Run only integration tests
npm test -- --testPathPattern=integration

# Run WebSocket tests
npm test -- --testPathPattern=websocket
```

### Frontend Tests

```bash
# Run all frontend tests
cd frontend && npm test

# Run with coverage
npm run test:cov

# Run specific test
npm test -- AuthContext.test.tsx
```

### E2E Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run with UI (debug mode)
npm run test:e2e:ui

# Run specific test file
npx playwright test auth.spec.ts

# Generate test report
npx playwright show-report
```

### All Tests

```bash
# From project root - run everything
npm run test:all
```

---

## Test File Locations

| Test Type | Location | Naming Convention |
|-----------|----------|-------------------|
| Unit Tests | `backend/test/unit/{module}/` | `*.service.spec.ts` |
| Integration Tests | `backend/test/integration/{module}/` | `*.controller.spec.ts` |
| WebSocket Tests | `backend/test/websocket/` | `*.gateway.spec.ts` |
| Frontend Tests | `frontend/__tests__/` | `*.test.tsx` |
| E2E Tests | `e2e/tests/` | `*.spec.ts` |

---

## Writing Tests Guidelines

### General Principles

1. **Arrange-Act-Assert (AAA) Pattern**
   ```typescript
   it('should do something', () => {
     // Arrange - set up test data
     const input = createTestUser();

     // Act - perform the action
     const result = service.process(input);

     // Assert - verify the outcome
     expect(result).toBe(expected);
   });
   ```

2. **One Assertion Concept Per Test**
   - Each test should verify one behavior
   - Multiple `expect()` calls are OK if they verify the same concept

3. **Descriptive Test Names**
   ```typescript
   // Good
   it('should return 401 when password is incorrect')
   it('should increment conversationsReceived when first message sent')

   // Bad
   it('test login')
   it('works correctly')
   ```

4. **Test Edge Cases**
   - Empty inputs
   - Null/undefined values
   - Boundary conditions
   - Error scenarios

### Mocking Guidelines

1. **Mock External Dependencies**
   - Database repositories
   - Third-party services (SendGrid, Cloudinary)
   - HTTP clients

2. **Don't Mock What You're Testing**
   - If testing `UsersService`, don't mock `UsersService`

3. **Use Factories for Test Data**
   ```typescript
   // Good
   const user = createTestUser({ name: 'Custom Name' });

   // Bad
   const user = {
     id: '123',
     email: 'test@test.com',
     // ... 20 more fields
   };
   ```

### Database Testing

1. **Use Transactions for Isolation**
   ```typescript
   beforeEach(async () => {
     await queryRunner.startTransaction();
   });

   afterEach(async () => {
     await queryRunner.rollbackTransaction();
   });
   ```

2. **Clean State Between Tests**
   - Each test should start with known state
   - Don't rely on data from previous tests

### WebSocket Testing

1. **Handle Async Events**
   ```typescript
   // Use promises for event handling
   const messageReceived = new Promise((resolve) => {
     socket.on('message:received', resolve);
   });

   socket.emit('message:send', data);

   const message = await messageReceived;
   ```

2. **Clean Up Connections**
   ```typescript
   afterEach(() => {
     socket.disconnect();
   });
   ```

---

## Coverage Requirements

### Minimum Coverage by Module

| Module | Line Coverage | Branch Coverage |
|--------|--------------|-----------------|
| Auth | 90% | 85% |
| Users | 85% | 80% |
| Messages | 85% | 80% |
| Listings | 80% | 75% |
| Transactions | 85% | 80% |
| Events | 75% | 70% |
| Tickets | 75% | 70% |

### Excluded from Coverage

- `*.module.ts` - NestJS module definitions
- `*.dto.ts` - Data transfer objects (validation tested via integration)
- `main.ts` - Application bootstrap
- `data-source.ts` - Database configuration
- Test files themselves

---

## CI/CD Integration

Tests run automatically on:
- Every push to any branch
- Every pull request to `main`

**Pipeline Steps:**
1. Install dependencies
2. Start test database (Docker)
3. Run linting
4. Run unit tests
5. Run integration tests
6. Run e2e tests
7. Generate coverage report
8. Fail if coverage below threshold

---

## Maintenance

### When to Update Tests

- **New Feature:** Write tests before or alongside feature code
- **Bug Fix:** Add test that reproduces the bug, then fix
- **Refactor:** Ensure existing tests pass, add new ones if behavior changes

### Test Review Checklist

- [ ] Tests cover happy path
- [ ] Tests cover error cases
- [ ] Tests are independent (can run in any order)
- [ ] Test names are descriptive
- [ ] No hardcoded IDs or timestamps
- [ ] Mocks are reset between tests
- [ ] No `console.log` statements left in tests

---

**Document Maintained By:** Development Team
**Review Frequency:** Update when testing patterns change
