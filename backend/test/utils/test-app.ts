/**
 * Test Application Utilities
 *
 * Provides functions for creating a test NestJS application
 * with all necessary modules and configurations
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Entities
import { User } from '../../src/users/entities/user.entity';
import { Listing } from '../../src/listings/entities/listing.entity';
import { Event } from '../../src/events/entities/event.entity';
import { Ticket } from '../../src/tickets/entities/ticket.entity';
import { Transaction } from '../../src/transactions/entities/transaction.entity';
import { Message } from '../../src/messages/entities/message.entity';
import { Conversation } from '../../src/messages/entities/conversation.entity';

// Services
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { ListingsService } from '../../src/listings/listings.service';
import { EventsService } from '../../src/events/events.service';
import { TicketsService } from '../../src/tickets/tickets.service';
import { TransactionsService } from '../../src/transactions/transactions.service';
import { MessagesService } from '../../src/messages/messages.service';
import { EmailService } from '../../src/email/email.service';
import { CloudinaryService } from '../../src/common/services/cloudinary.service';

// Controllers
import { AuthController } from '../../src/auth/auth.controller';
import { UsersController } from '../../src/users/users.controller';
import { ListingsController } from '../../src/listings/listings.controller';
import { EventsController } from '../../src/events/events.controller';
import { TicketsController } from '../../src/tickets/tickets.controller';
import { TransactionsController } from '../../src/transactions/transactions.controller';
import { MessagesController } from '../../src/messages/messages.controller';

// Guards and Strategies
import { JwtStrategy } from '../../src/auth/strategies/jwt.strategy';
import { LocalStrategy } from '../../src/auth/strategies/local.strategy';

// Test database config
const testDbConfig = {
  type: 'postgres' as const,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'ticket_exchange',
  password: process.env.DATABASE_PASSWORD || 'dev_password_123',
  database: process.env.TEST_DATABASE_NAME || 'ticket_exchange_test_db',
  entities: [User, Listing, Event, Ticket, Transaction, Message, Conversation],
  synchronize: true,
  logging: false,
};

/**
 * Creates a fully configured test NestJS application
 * Includes all controllers, services, and middleware
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot(testDbConfig),
      TypeOrmModule.forFeature([
        User,
        Listing,
        Event,
        Ticket,
        Transaction,
        Message,
        Conversation,
      ]),
      PassportModule,
      JwtModule.register({
        secret: process.env.JWT_SECRET || 'test-secret-key',
        signOptions: { expiresIn: '1h' },
      }),
    ],
    controllers: [
      AuthController,
      UsersController,
      ListingsController,
      EventsController,
      TicketsController,
      TransactionsController,
      MessagesController,
    ],
    providers: [
      AuthService,
      UsersService,
      ListingsService,
      EventsService,
      TicketsService,
      TransactionsService,
      MessagesService,
      JwtStrategy,
      LocalStrategy,
      // Mock external services
      {
        provide: EmailService,
        useValue: {
          sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
          sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
        },
      },
      {
        provide: CloudinaryService,
        useValue: {
          uploadImage: jest.fn().mockResolvedValue({
            secure_url: 'https://test-cloudinary.com/test-image.jpg',
          }),
        },
      },
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Apply same configuration as production app
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS for tests
  app.enableCors();

  await app.init();

  return app;
}

/**
 * Creates a minimal test module for unit testing a specific service
 * External dependencies are mocked
 */
export async function createTestModule(
  serviceClass: any,
  providers: any[] = [],
): Promise<TestingModule> {
  return Test.createTestingModule({
    providers: [serviceClass, ...providers],
  }).compile();
}
