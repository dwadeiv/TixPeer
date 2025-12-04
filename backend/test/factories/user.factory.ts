/**
 * User Factory
 *
 * Generates User entities for testing with realistic data
 */

import { User } from '../../src/users/entities/user.entity';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

interface UserFactoryOptions {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  isVerified?: boolean;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  responseRate?: number;
  conversationsReceived?: number;
  conversationsReplied?: number;
}

let userCounter = 0;

/**
 * Generates unique user data for testing
 */
export function generateUserData(options: UserFactoryOptions = {}): Partial<User> {
  userCounter++;
  const timestamp = Date.now();

  return {
    email: options.email ?? `testuser${userCounter}_${timestamp}@example.com`,
    password: options.password ?? 'TestPassword123!',
    firstName: options.firstName ?? `Test${userCounter}`,
    lastName: options.lastName ?? `User${userCounter}`,
    isVerified: options.isVerified ?? true,
    avatarUrl: options.avatarUrl ?? null,
    bio: options.bio ?? null,
    phone: options.phone ?? null,
    responseRate: options.responseRate ?? 100.0,
    conversationsReceived: options.conversationsReceived ?? 0,
    conversationsReplied: options.conversationsReplied ?? 0,
  };
}

/**
 * Creates a User entity in the database
 */
export async function createUser(
  dataSource: DataSource,
  options: UserFactoryOptions = {},
): Promise<User> {
  const userRepository = dataSource.getRepository(User);
  const userData = generateUserData(options);

  // Hash the password
  const hashedPassword = await bcrypt.hash(userData.password as string, 10);

  const user = userRepository.create({
    ...userData,
    password: hashedPassword,
  });

  return userRepository.save(user);
}

/**
 * Creates multiple User entities
 */
export async function createUsers(
  dataSource: DataSource,
  count: number,
  options: UserFactoryOptions = {},
): Promise<User[]> {
  const users: User[] = [];

  for (let i = 0; i < count; i++) {
    const user = await createUser(dataSource, options);
    users.push(user);
  }

  return users;
}

/**
 * Creates a verified user ready for authentication tests
 */
export async function createVerifiedUser(
  dataSource: DataSource,
  options: UserFactoryOptions = {},
): Promise<{ user: User; plainPassword: string }> {
  const plainPassword = options.password ?? 'TestPassword123!';

  const user = await createUser(dataSource, {
    ...options,
    password: plainPassword,
    isVerified: true,
  });

  return { user, plainPassword };
}

/**
 * Creates an unverified user for email verification tests
 */
export async function createUnverifiedUser(
  dataSource: DataSource,
  options: UserFactoryOptions = {},
): Promise<User> {
  return createUser(dataSource, {
    ...options,
    isVerified: false,
  });
}

/**
 * Resets the user counter (call in beforeEach if needed)
 */
export function resetUserCounter(): void {
  userCounter = 0;
}
