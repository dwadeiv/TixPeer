/**
 * Test Database Utilities
 *
 * Provides functions for:
 * - Creating test database connection
 * - Cleaning database between tests
 * - Running tests within transactions
 */

import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../../src/users/entities/user.entity';
import { Listing } from '../../src/listings/entities/listing.entity';
import { Event } from '../../src/events/entities/event.entity';
import { Ticket } from '../../src/tickets/entities/ticket.entity';
import { Transaction } from '../../src/transactions/entities/transaction.entity';
import { Message } from '../../src/messages/entities/message.entity';
import { Conversation } from '../../src/messages/entities/conversation.entity';

/**
 * Test database configuration
 * Uses a separate database to avoid affecting development data
 */
const testDbConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'ticket_exchange',
  password: process.env.DATABASE_PASSWORD || 'dev_password_123',
  database: process.env.TEST_DATABASE_NAME || 'ticket_exchange_test_db',
  entities: [User, Listing, Event, Ticket, Transaction, Message, Conversation],
  synchronize: true, // Auto-create tables in test DB
  dropSchema: false, // Don't drop on connect (we do it manually)
  logging: false, // Disable SQL logging in tests
};

let testDataSource: DataSource | null = null;

/**
 * Creates and initializes the test database connection
 * Call this in beforeAll() of integration tests
 */
export async function createTestDatabase(): Promise<DataSource> {
  if (testDataSource?.isInitialized) {
    return testDataSource;
  }

  testDataSource = new DataSource(testDbConfig);
  await testDataSource.initialize();

  // Store globally for cleanup
  global.testDataSource = testDataSource;

  return testDataSource;
}

/**
 * Cleans all data from the test database
 * Call this in beforeEach() to ensure test isolation
 */
export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;

  // Disable foreign key checks temporarily
  await dataSource.query('SET session_replication_role = replica;');

  // Truncate all tables
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
  }

  // Re-enable foreign key checks
  await dataSource.query('SET session_replication_role = DEFAULT;');
}

/**
 * Closes the test database connection
 * Call this in afterAll() of integration tests
 */
export async function closeTestDatabase(): Promise<void> {
  if (testDataSource?.isInitialized) {
    await testDataSource.destroy();
    testDataSource = null;
    global.testDataSource = undefined;
  }
}

/**
 * Gets the current test database connection
 * Returns null if not initialized
 */
export function getTestDataSource(): DataSource | null {
  return testDataSource;
}

/**
 * Runs a test within a database transaction that rolls back after the test
 * Useful for tests that modify data but need to be isolated
 *
 * Usage:
 * it('should create user', () => runInTransaction(async (queryRunner) => {
 *   // Test code here - changes will be rolled back
 * }));
 */
export async function runInTransaction<T>(
  fn: (dataSource: DataSource) => Promise<T>,
): Promise<T> {
  if (!testDataSource?.isInitialized) {
    throw new Error('Test database not initialized. Call createTestDatabase() first.');
  }

  const queryRunner = testDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const result = await fn(testDataSource);
    return result;
  } finally {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  }
}
