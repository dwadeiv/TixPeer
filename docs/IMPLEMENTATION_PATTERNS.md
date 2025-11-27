# TixPeer Implementation Patterns

**Last Updated:** November 26, 2025

This document describes the implementation patterns used throughout TixPeer. It serves as a guide for future engineers to understand not just *what* the code does, but *why* certain implementation choices were made.

## Table of Contents

- [Frontend Patterns](#frontend-patterns)
  - [React Context Pattern](#react-context-pattern)
  - [Optimistic Updates Pattern](#optimistic-updates-pattern)
  - [API Client Singleton Pattern](#api-client-singleton-pattern)
  - [Form Validation Pattern](#form-validation-pattern)
  - [Image Upload Pattern](#image-upload-pattern)
  - [Authentication Guard Pattern](#authentication-guard-pattern)
- [Backend Patterns](#backend-patterns)
  - [NestJS Module Structure](#nestjs-module-structure)
  - [Service Layer Pattern](#service-layer-pattern)
  - [DTO Validation Pattern](#dto-validation-pattern)
  - [Guard Pattern](#guard-pattern)
  - [Exception Handling Pattern](#exception-handling-pattern)
  - [Logging Pattern](#logging-pattern)
- [WebSocket Patterns](#websocket-patterns)
  - [Gateway Structure](#gateway-structure)
  - [Connection Management](#connection-management)
  - [Reconnection Pattern](#reconnection-pattern)
  - [Event Naming Convention](#event-naming-convention)
- [Database Patterns](#database-patterns)
  - [Repository Pattern](#repository-pattern)
  - [Query Builder Pattern](#query-builder-pattern)
  - [Eager Loading Pattern](#eager-loading-pattern)
  - [Denormalization Pattern](#denormalization-pattern)
- [Authentication Patterns](#authentication-patterns)
  - [JWT Flow](#jwt-flow)
  - [Token Storage](#token-storage)
  - [Email Verification](#email-verification)
- [API Design Patterns](#api-design-patterns)
  - [Response Format](#response-format)
  - [Pagination Pattern](#pagination-pattern)
  - [Filtering Pattern](#filtering-pattern)
  - [Cache Headers Pattern](#cache-headers-pattern)
- [Security Patterns](#security-patterns)
- [Quick Reference](#quick-reference)

---

## Frontend Patterns

### React Context Pattern

**Location:** `frontend/src/contexts/`

We use React Context for global state that many components need access to. Each context follows a consistent structure.

**Structure:**
```typescript
// 1. Define the context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// 2. Create context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Create provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // ... implementation

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Create custom hook with error handling
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Contexts in TixPeer:**

| Context | Purpose | Key State |
|---------|---------|-----------|
| `AuthContext` | User authentication | user, isAuthenticated, login/logout |
| `MessagesContext` | Real-time messaging | conversations, messages, WebSocket connection |
| `LocationContext` | City filtering | selectedCity, setCity |

**Why Context vs Redux:**
- Simple state without complex mutations
- Built-in React feature (no extra dependencies)
- Easier to understand for new developers
- Sufficient for our scale

---

### Optimistic Updates Pattern

**Location:** `frontend/src/contexts/MessagesContext.tsx`

Optimistic updates provide instant UI feedback while the server processes the request. If the server fails, we rollback.

**Pattern:**
```typescript
const markConversationAsRead = useCallback(async (conversationId: string) => {
  if (!user) return;

  // 1. CAPTURE: Store current state for potential rollback
  const conversation = conversations.find(c => c.id === conversationId);
  const unreadInConversation = conversation
    ? (conversation.user1Id === user.id ? conversation.unreadCountUser1 : conversation.unreadCountUser2)
    : 0;

  // 2. OPTIMISTIC UPDATE: Update UI immediately
  setConversations((prev) =>
    prev.map((conv) => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          unreadCountUser1: conv.user1Id === user.id ? 0 : conv.unreadCountUser1,
          unreadCountUser2: conv.user2Id === user.id ? 0 : conv.unreadCountUser2,
        };
      }
      return conv;
    })
  );

  // Also update header badge count
  if (unreadInConversation > 0) {
    setTotalUnreadCount((prev) => Math.max(0, prev - unreadInConversation));
  }

  // 3. SEND TO SERVER
  if (socket && connected) {
    socket.emit('messages:markRead', { conversationId });
  } else {
    try {
      await api.markConversationAsRead(conversationId);
    } catch (error) {
      // 4. ROLLBACK: Revert on error
      if (conversation) {
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                unreadCountUser1: conversation.unreadCountUser1,
                unreadCountUser2: conversation.unreadCountUser2,
              };
            }
            return conv;
          })
        );
        setTotalUnreadCount((prev) => prev + unreadInConversation);
      }
    }
  }

  // 5. CONFIRM: Refresh from server after delay
  setTimeout(() => {
    refreshUnreadCount();
  }, 1000);
}, [socket, connected, user, conversations, refreshUnreadCount]);
```

**When to Use Optimistic Updates:**
- User expects immediate feedback (messages, likes, toggles)
- Action is likely to succeed
- Rollback is simple and non-destructive

**When NOT to Use:**
- Payment/financial transactions
- Irreversible actions (delete without soft-delete)
- Complex multi-step operations

---

### API Client Singleton Pattern

**Location:** `frontend/src/lib/api.ts`

A single axios instance handles all API communication with automatic token injection and error handling.

**Pattern:**
```typescript
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    // Request interceptor: Auto-attach JWT token
    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor: Handle 401 globally
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.removeToken();
          // Optionally redirect to login
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  setToken(token: string | null): void {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    }
  }

  // API methods
  async getListings(params?: { eventId?: string }) {
    const response = await this.client.get('/listings', { params });
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiClient();
```

**Benefits:**
- Centralized configuration
- Automatic token handling
- Consistent error handling
- Type-safe API methods
- SSR-safe (checks for `window`)

---

### Form Validation Pattern

**Location:** `frontend/src/app/register/page.tsx`, `frontend/src/app/login/page.tsx`

Client-side validation with bot protection.

**Pattern:**
```typescript
// 1. State for form fields and errors
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

// 2. Honeypot field for bot protection
const [honeypot, setHoneypot] = useState('');

// 3. Validation function
const validateForm = (): boolean => {
  const newErrors: typeof errors = {};

  if (!email) {
    newErrors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    newErrors.email = 'Please enter a valid email';
  }

  if (!password) {
    newErrors.password = 'Password is required';
  } else if (password.length < 8) {
    newErrors.password = 'Password must be at least 8 characters';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// 4. Submit handler
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Bot check: if honeypot filled, silently reject
  if (honeypot) {
    return;
  }

  if (!validateForm()) {
    return;
  }

  try {
    await api.register(email, password, name);
    router.push('/verify-email');
  } catch (error) {
    setErrors({ email: 'Registration failed. Please try again.' });
  }
};

// 5. Hidden honeypot field in JSX
<input
  type="text"
  name="website"
  value={honeypot}
  onChange={(e) => setHoneypot(e.target.value)}
  className="hidden"
  tabIndex={-1}
  autoComplete="off"
/>
```

---

### Image Upload Pattern

**Location:** `frontend/src/app/profile/page.tsx`

Client-side image cropping before upload to reduce server load.

**Pattern:**
```typescript
// 1. State for image handling
const [imageSrc, setImageSrc] = useState<string | null>(null);
const [crop, setCrop] = useState({ x: 0, y: 0 });
const [zoom, setZoom] = useState(1);
const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

// 2. Handle file selection
const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files.length > 0) {
    const file = e.target.files[0];
    const imageDataUrl = await readFile(file);
    setImageSrc(imageDataUrl);
  }
};

// 3. Handle crop complete (from react-easy-crop)
const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
  setCroppedAreaPixels(croppedAreaPixels);
}, []);

// 4. Create cropped image and upload
const handleSaveAvatar = async () => {
  if (!imageSrc || !croppedAreaPixels) return;

  // Create canvas with cropped image
  const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);

  // Convert to File object
  const file = new File([croppedImage], 'avatar.jpg', { type: 'image/jpeg' });

  // Upload via API
  const updatedUser = await api.uploadAvatar(file);

  // Update context
  updateUser(updatedUser);
};
```

**Flow:**
1. User selects image
2. Image displayed in cropper component
3. User adjusts crop area and zoom
4. On save, canvas creates cropped image
5. Converted to File and uploaded
6. Backend sends to Cloudinary
7. CDN URL saved to database

---

### Authentication Guard Pattern

**Location:** `frontend/src/app/profile/page.tsx`

Redirect unauthenticated users to login.

**Pattern:**
```typescript
'use client';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Render protected content
  return <div>Protected content here</div>;
}
```

---

## Backend Patterns

### NestJS Module Structure

**Location:** `backend/src/*/`

Each feature is a self-contained module with controllers, services, entities, and DTOs.

**Structure:**
```
backend/src/
├── auth/
│   ├── auth.module.ts          # Module definition
│   ├── auth.controller.ts      # HTTP endpoints
│   ├── auth.service.ts         # Business logic
│   ├── dto/
│   │   ├── login.dto.ts        # Input validation
│   │   └── register.dto.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts   # Route protection
│   │   └── local-auth.guard.ts
│   └── strategies/
│       ├── jwt.strategy.ts     # JWT validation
│       └── local.strategy.ts   # Login validation
```

**Module Definition:**
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),  // Entity registration
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],  // For use in other modules
})
export class AuthModule {}
```

---

### Service Layer Pattern

**Location:** `backend/src/*/\*.service.ts`

Services contain business logic and database operations. Controllers are thin.

**Pattern:**
```typescript
@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private listingRepository: Repository<Listing>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  /**
   * Create a new listing
   * Validates event exists and denormalizes event data for performance
   */
  async create(userId: string, dto: CreateListingDto): Promise<Listing> {
    // Validate related entity exists
    const event = await this.eventRepository.findOne({
      where: { id: dto.eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Create with denormalized data
    const listing = this.listingRepository.create({
      ...dto,
      userId,
      // Denormalize for performance (avoid joins on list pages)
      eventName: event.name,
      eventDate: event.date,
      eventVenue: event.venue,
    });

    return this.listingRepository.save(listing);
  }

  /**
   * Find all listings with optional filters
   */
  async findAll(filters?: { eventId?: string; userId?: string }): Promise<Listing[]> {
    const queryBuilder = this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.user', 'user')
      .leftJoinAndSelect('listing.event', 'event')
      .where('listing.status = :status', { status: 'active' });

    if (filters?.eventId) {
      queryBuilder.andWhere('listing.eventId = :eventId', { eventId: filters.eventId });
    }

    if (filters?.userId) {
      queryBuilder.andWhere('listing.userId = :userId', { userId: filters.userId });
    }

    return queryBuilder
      .orderBy('listing.createdAt', 'DESC')
      .getMany();
  }
}
```

**Key Principles:**
- Services are injectable (@Injectable)
- Use repository injection (@InjectRepository)
- Throw NestJS exceptions (not generic errors)
- Return entities or DTOs (not raw queries)
- Keep business logic here, not in controllers

---

### DTO Validation Pattern

**Location:** `backend/src/*/dto/*.dto.ts`

DTOs define and validate incoming request data using class-validator decorators.

**Pattern:**
```typescript
import { IsString, IsEmail, MinLength, IsOptional, IsUUID, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateListingDto {
  @ApiProperty({ description: 'Event ID', example: 'uuid-here' })
  @IsUUID()
  eventId: string;

  @ApiProperty({ enum: ['offer', 'request'] })
  @IsEnum(['offer', 'request'])
  type: 'offer' | 'request';

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  ticketCount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerTicket?: number;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
```

**Global Validation Pipe (main.ts):**
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,       // Strip unknown properties
    forbidNonWhitelisted: true,  // Throw on unknown properties
    transform: true,       // Auto-transform types
  }),
);
```

---

### Guard Pattern

**Location:** `backend/src/auth/guards/`

Guards protect routes by validating authentication before the handler executes.

**JWT Guard (HTTP):**
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Uses passport-jwt strategy automatically
}

// Usage in controller
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()  // Swagger documentation
@Get('profile')
getProfile(@Request() req) {
  return this.usersService.findOne(req.user.id);
}
```

**WebSocket Guard:**
```typescript
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.auth?.token;

    if (!token) {
      throw new WsException('Missing authentication token');
    }

    try {
      const payload = this.jwtService.verify(token);
      client.handshake.auth.userId = payload.sub;
      return true;
    } catch (error) {
      throw new WsException('Invalid token');
    }
  }
}
```

---

### Exception Handling Pattern

**Location:** Throughout backend services

Use NestJS built-in exceptions for consistent error responses.

**Available Exceptions:**
```typescript
// 400 Bad Request
throw new BadRequestException('Invalid input');

// 401 Unauthorized
throw new UnauthorizedException('Invalid credentials');

// 403 Forbidden
throw new ForbiddenException('You cannot edit this listing');

// 404 Not Found
throw new NotFoundException('Listing not found');

// 409 Conflict
throw new ConflictException('Email already registered');

// 500 Internal Server Error
throw new InternalServerErrorException('Database error');
```

**Pattern in Services:**
```typescript
async findOne(id: string): Promise<Listing> {
  const listing = await this.listingRepository.findOne({
    where: { id },
    relations: ['user', 'event'],
  });

  if (!listing) {
    throw new NotFoundException(`Listing with ID ${id} not found`);
  }

  return listing;
}

async update(id: string, userId: string, dto: UpdateListingDto): Promise<Listing> {
  const listing = await this.findOne(id);

  // Authorization check
  if (listing.userId !== userId) {
    throw new ForbiddenException('You can only edit your own listings');
  }

  Object.assign(listing, dto);
  return this.listingRepository.save(listing);
}
```

---

### Logging Pattern

**Location:** `backend/src/*/`

Use NestJS Logger instead of console.log for proper log levels and scoping.

**Pattern:**
```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MessagesGateway {
  private readonly logger = new Logger(MessagesGateway.name);

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.auth?.userId;

      if (!userId) {
        this.logger.warn('WebSocket connection rejected: No user ID in auth');
        client.disconnect();
        return;
      }

      // Connection successful - no log needed (too noisy)
      this.userSockets.set(userId, client.id);

    } catch (error) {
      this.logger.error('Error in handleConnection', error);
      client.disconnect();
    }
  }
}
```

**Log Levels:**
| Level | Use Case |
|-------|----------|
| `logger.log()` | Normal operations (startup, important events) |
| `logger.warn()` | Unexpected but handled situations |
| `logger.error()` | Errors that need attention |
| `logger.debug()` | Development debugging (disable in prod) |
| `logger.verbose()` | Detailed tracing |

**What NOT to Log:**
- Successful routine operations (too noisy)
- Sensitive data (passwords, tokens, PII)
- Debug statements in production code

---

## WebSocket Patterns

### Gateway Structure

**Location:** `backend/src/messages/messages.gateway.ts`

**Pattern:**
```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/messages',  // Separate namespace from main app
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private userSockets: Map<string, string> = new Map();  // userId -> socketId
  private typingUsers: Map<string, Set<string>> = new Map();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
  ) {}

  // Lifecycle hooks
  async handleConnection(client: Socket) { /* ... */ }
  handleDisconnect(client: Socket) { /* ... */ }

  // Event handlers
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @MessageBody() data: { receiverId: string; text: string },
    @ConnectedSocket() client: Socket,
  ) { /* ... */ }
}
```

---

### Connection Management

**Pattern:**
```typescript
// Track online users with in-memory Map
private userSockets: Map<string, string> = new Map();

async handleConnection(client: Socket) {
  const userId = client.handshake.auth?.userId;

  // Store socket mapping
  this.userSockets.set(userId, client.id);

  // Update database
  await this.usersService.updateOnlineStatus(userId, true);

  // Join user-specific room for targeted messaging
  client.join(`user:${userId}`);

  // Broadcast online status to others
  client.broadcast.emit('user:online', { userId });
}

handleDisconnect(client: Socket) {
  // Find user by socket ID
  let disconnectedUserId: string | null = null;
  for (const [userId, socketId] of this.userSockets.entries()) {
    if (socketId === client.id) {
      disconnectedUserId = userId;
      this.userSockets.delete(userId);
      break;
    }
  }

  if (disconnectedUserId) {
    this.usersService.updateOnlineStatus(disconnectedUserId, false);
    client.broadcast.emit('user:offline', { userId: disconnectedUserId });
  }
}
```

---

### Reconnection Pattern

**Location:** `frontend/src/contexts/MessagesContext.tsx`

**Pattern:**
```typescript
const newSocket = io('http://localhost:3001/messages', {
  auth: {
    token: localStorage.getItem('authToken'),
    userId: user.id,
  },
  transports: ['websocket', 'polling'],
  // Reconnection settings
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,      // Start with 1 second
  reconnectionDelayMax: 5000,   // Max 5 seconds between attempts
});

// On successful (re)connection, refresh state
newSocket.on('connect', () => {
  setConnected(true);
  // Catch up on any missed data
  refreshConversations();
  refreshUnreadCount();
});

newSocket.on('disconnect', () => {
  setConnected(false);
});

newSocket.on('connect_error', () => {
  setConnected(false);
});
```

---

### Event Naming Convention

**Pattern:** `resource:action`

| Event | Direction | Purpose |
|-------|-----------|---------|
| `message:send` | Client → Server | Send a new message |
| `message:sent` | Server → Client | Confirm message was saved |
| `message:received` | Server → Client | New message from other user |
| `typing:start` | Bidirectional | User started typing |
| `typing:stop` | Bidirectional | User stopped typing |
| `messages:markRead` | Client → Server | Mark messages as read |
| `messages:read` | Server → Client | Notify sender of read receipt |
| `user:online` | Server → All | User came online |
| `user:offline` | Server → All | User went offline |
| `conversations:unread` | Server → Client | Unread counts on connect |

---

## Database Patterns

### Repository Pattern

**Location:** `backend/src/*/\*.service.ts`

TypeORM repositories are injected into services.

**Pattern:**
```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Simple find
  findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // Find with relations
  findOneWithListings(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['listings'],
    });
  }

  // Create
  async create(dto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }

  // Update
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.userRepository.update(id, dto);
    return this.findOne(id);
  }
}
```

---

### Query Builder Pattern

**Location:** `backend/src/messages/messages.service.ts`

For complex queries, use QueryBuilder instead of find options.

**Pattern:**
```typescript
async getConversations(userId: string): Promise<Conversation[]> {
  return this.conversationRepository
    .createQueryBuilder('conversation')
    // Eager load related users
    .leftJoinAndSelect('conversation.user1', 'user1')
    .leftJoinAndSelect('conversation.user2', 'user2')
    // Filter by user participation
    .where('conversation.user1Id = :userId', { userId })
    .orWhere('conversation.user2Id = :userId', { userId })
    // Only show conversations with messages
    .andWhere('conversation.lastMessageAt IS NOT NULL')
    // Sort by most recent
    .orderBy('conversation.lastMessageAt', 'DESC')
    .getMany();
}

async searchMessages(userId: string, searchText: string, limit: number): Promise<Message[]> {
  // First get user's conversation IDs
  const conversations = await this.getConversations(userId);
  const conversationIds = conversations.map(c => c.id);

  if (conversationIds.length === 0) return [];

  return this.messageRepository
    .createQueryBuilder('message')
    .leftJoinAndSelect('message.sender', 'sender')
    .where('message.conversationId IN (:...conversationIds)', { conversationIds })
    .andWhere('message.text ILIKE :search', { search: `%${searchText}%` })
    .orderBy('message.createdAt', 'DESC')
    .limit(limit)
    .getMany();
}
```

---

### Eager Loading Pattern

Prevent N+1 queries by loading relations upfront.

**N+1 Problem (BAD):**
```typescript
// This causes N+1 queries!
const listings = await this.listingRepository.find();
for (const listing of listings) {
  // Each iteration queries the database
  const user = await this.userRepository.findOne({ where: { id: listing.userId } });
}
```

**Eager Loading (GOOD):**
```typescript
// Single query with JOIN
const listings = await this.listingRepository.find({
  relations: ['user', 'event'],
});
// OR
const listings = await this.listingRepository
  .createQueryBuilder('listing')
  .leftJoinAndSelect('listing.user', 'user')
  .leftJoinAndSelect('listing.event', 'event')
  .getMany();
```

---

### Denormalization Pattern

**Location:** `backend/src/listings/entities/listing.entity.ts`

Store frequently-accessed related data directly to avoid joins.

**Pattern:**
```typescript
@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventId: string;

  // Denormalized event data for performance
  // Avoids JOIN on listing list pages
  @Column()
  eventName: string;

  @Column()
  eventDate: Date;

  @Column()
  eventVenue: string;

  // Still maintain the relation for full data access
  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event: Event;
}
```

**When to Denormalize:**
- Data is read frequently, written rarely
- Avoids expensive JOINs on list pages
- Acceptable staleness (event name rarely changes)

**Trade-offs:**
- Data duplication
- Must update denormalized fields when source changes
- Slight increase in storage

---

## Authentication Patterns

### JWT Flow

```
1. Registration
   POST /auth/register { email, password, name }
   ↓
   Validate input (DTO)
   ↓
   Check email not already registered
   ↓
   Hash password (bcrypt, 10 rounds)
   ↓
   Create user in database
   ↓
   Generate email verification token
   ↓
   Send verification email (SendGrid)
   ↓
   Return { access_token, user }

2. Login
   POST /auth/login { email, password }
   ↓
   LocalStrategy validates credentials
   ↓
   Compare password hash (bcrypt)
   ↓
   Generate JWT { sub: userId, email, iat, exp }
   ↓
   Return { access_token, user }

3. Authenticated Request
   GET /users/profile
   Header: Authorization: Bearer <token>
   ↓
   JwtAuthGuard intercepts
   ↓
   JwtStrategy validates token
   ↓
   Extracts user from payload
   ↓
   Attaches to request.user
   ↓
   Handler receives authenticated user
```

---

### Token Storage

**Location:** `frontend/src/lib/api.ts`, `frontend/src/contexts/AuthContext.tsx`

**Pattern:**
```typescript
// Store token after login
const login = async (email: string, password: string) => {
  const response = await api.login(email, password);
  api.setToken(response.access_token);  // Saves to localStorage
  setUser(response.user);
};

// Token automatically attached via interceptor
// See API Client Singleton Pattern above

// Clear on logout
const logout = () => {
  api.setToken(null);  // Removes from localStorage
  setUser(null);
};

// SSR-safe localStorage access
private getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}
```

---

### Email Verification

**Location:** `backend/src/auth/auth.service.ts`

**Pattern:**
```typescript
async register(dto: RegisterDto): Promise<{ access_token: string; user: User }> {
  // ... create user

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  user.emailVerificationToken = verificationToken;
  user.emailVerificationTokenExpiry = tokenExpiry;
  await this.userRepository.save(user);

  // Send email
  await this.emailService.sendVerificationEmail(user.email, verificationToken);

  return { access_token: this.generateToken(user), user };
}

async verifyEmail(token: string): Promise<User> {
  const user = await this.userRepository.findOne({
    where: { emailVerificationToken: token },
  });

  if (!user) {
    throw new NotFoundException('Invalid verification token');
  }

  if (user.emailVerificationTokenExpiry < new Date()) {
    throw new BadRequestException('Verification token has expired');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationTokenExpiry = null;

  return this.userRepository.save(user);
}
```

---

## API Design Patterns

### Response Format

**Success Response:**
```json
{
  "id": "uuid",
  "name": "Event Name",
  "date": "2025-01-15T19:00:00.000Z",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Error Response (NestJS default):**
```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than 8 characters"],
  "error": "Bad Request"
}
```

---

### Pagination Pattern

**Location:** `backend/src/messages/dto/get-messages.dto.ts`

**Pattern:**
```typescript
export class GetMessagesDto {
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

// In service
async getMessages(dto: GetMessagesDto): Promise<Message[]> {
  return this.messageRepository.find({
    where: { conversationId: dto.conversationId },
    order: { createdAt: 'DESC' },
    take: dto.limit,
    skip: dto.offset,
  });
}
```

---

### Filtering Pattern

**Location:** `backend/src/listings/listings.controller.ts`

**Pattern:**
```typescript
@Get()
async findAll(
  @Query('eventId') eventId?: string,
  @Query('userId') userId?: string,
  @Query('type') type?: 'offer' | 'request',
): Promise<Listing[]> {
  const filters: any = { status: 'active' };

  if (eventId) filters.eventId = eventId;
  if (userId) filters.userId = userId;
  if (type) filters.type = type;

  return this.listingsService.findAll(filters);
}
```

---

### Cache Headers Pattern

**Location:** `backend/src/events/events.controller.ts`

See [CACHING.md](./CACHING.md) for full documentation.

**Pattern:**
```typescript
@Get()
@Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
async findAll(): Promise<Event[]> {
  return this.eventsService.findAll();
}
```

---

## Security Patterns

### Password Hashing

```typescript
import * as bcrypt from 'bcrypt';

// Hash on registration
const hashedPassword = await bcrypt.hash(password, 10);

// Compare on login
const isValid = await bcrypt.compare(password, user.password);
```

### Field Exclusion

```typescript
// In entity - exclude password from JSON serialization
@Column({ select: false })
password: string;

// Or in service - explicitly select fields
const user = await this.userRepository.findOne({
  where: { id },
  select: ['id', 'email', 'name', 'avatar'],  // Excludes password
});
```

### CORS Configuration

```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});
```

### Bot Protection (Honeypot)

```typescript
// Hidden form field - bots fill it, humans don't
<input type="text" name="website" className="hidden" tabIndex={-1} />

// In submit handler
if (honeypotValue) {
  // Silently reject - don't reveal detection
  return;
}
```

---

## Quick Reference

### When to Use Each Pattern

| Scenario | Pattern |
|----------|---------|
| Global state needed by many components | React Context |
| Instant UI feedback needed | Optimistic Updates |
| Validating API input | DTO with class-validator |
| Protecting routes | Guards (JWT/Local) |
| Complex database queries | Query Builder |
| Avoiding N+1 queries | Eager Loading |
| Reducing JOINs on list pages | Denormalization |
| Real-time features | WebSocket Gateway |
| Error responses | NestJS Exceptions |
| Production logging | NestJS Logger |

### File Location Cheat Sheet

| What | Where |
|------|-------|
| React Contexts | `frontend/src/contexts/` |
| API Client | `frontend/src/lib/api.ts` |
| NestJS Modules | `backend/src/{feature}/` |
| DTOs | `backend/src/{feature}/dto/` |
| Entities | `backend/src/{feature}/entities/` |
| Guards | `backend/src/auth/guards/` |
| WebSocket Gateway | `backend/src/messages/messages.gateway.ts` |

---

**Document Maintained By:** Development Team
**Review Frequency:** Update when new patterns are introduced
