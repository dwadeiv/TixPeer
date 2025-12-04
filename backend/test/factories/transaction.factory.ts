/**
 * Transaction Factory
 *
 * Generates Transaction entities for testing
 */

import { Transaction } from '../../src/transactions/entities/transaction.entity';
import { User } from '../../src/users/entities/user.entity';
import { Listing } from '../../src/listings/entities/listing.entity';
import { DataSource } from 'typeorm';
import { createUser } from './user.factory';
import { createListing } from './listing.factory';

interface TransactionFactoryOptions {
  buyer?: User;
  seller?: User;
  listing?: Listing;
  quantity?: number;
  totalPrice?: number;
  status?: 'pending' | 'completed' | 'cancelled' | 'refunded';
}

let transactionCounter = 0;

/**
 * Generates unique transaction data for testing
 */
export function generateTransactionData(
  options: TransactionFactoryOptions = {},
): Partial<Transaction> {
  transactionCounter++;

  return {
    quantity: options.quantity ?? 1,
    totalPrice: options.totalPrice ?? 99.99,
    status: options.status ?? 'pending',
  };
}

/**
 * Creates a Transaction entity in the database
 * Automatically creates buyer, seller, and listing if not provided
 */
export async function createTransaction(
  dataSource: DataSource,
  options: TransactionFactoryOptions = {},
): Promise<Transaction> {
  const transactionRepository = dataSource.getRepository(Transaction);

  // Create seller if not provided
  const seller = options.seller ?? (await createUser(dataSource));

  // Create listing if not provided (owned by seller)
  const listing =
    options.listing ??
    (await createListing(dataSource, {
      seller,
    }));

  // Create buyer if not provided (different from seller)
  const buyer = options.buyer ?? (await createUser(dataSource));

  const transactionData = generateTransactionData(options);

  // Calculate total price if not provided
  const totalPrice = options.totalPrice ?? listing.price * (options.quantity ?? 1);

  const transaction = transactionRepository.create({
    ...transactionData,
    totalPrice,
    buyer,
    buyerId: buyer.id,
    seller,
    sellerId: seller.id,
    listing,
    listingId: listing.id,
  });

  return transactionRepository.save(transaction);
}

/**
 * Creates multiple Transaction entities
 */
export async function createTransactions(
  dataSource: DataSource,
  count: number,
  options: TransactionFactoryOptions = {},
): Promise<Transaction[]> {
  const transactions: Transaction[] = [];

  for (let i = 0; i < count; i++) {
    const transaction = await createTransaction(dataSource, options);
    transactions.push(transaction);
  }

  return transactions;
}

/**
 * Creates transactions for a specific buyer
 */
export async function createTransactionsForBuyer(
  dataSource: DataSource,
  buyer: User,
  count: number,
  options: TransactionFactoryOptions = {},
): Promise<Transaction[]> {
  const transactions: Transaction[] = [];

  for (let i = 0; i < count; i++) {
    const transaction = await createTransaction(dataSource, {
      ...options,
      buyer,
    });
    transactions.push(transaction);
  }

  return transactions;
}

/**
 * Creates transactions for a specific seller
 */
export async function createTransactionsForSeller(
  dataSource: DataSource,
  seller: User,
  count: number,
  options: TransactionFactoryOptions = {},
): Promise<Transaction[]> {
  const transactions: Transaction[] = [];
  const listing = await createListing(dataSource, { seller });

  for (let i = 0; i < count; i++) {
    const transaction = await createTransaction(dataSource, {
      ...options,
      seller,
      listing,
    });
    transactions.push(transaction);
  }

  return transactions;
}

/**
 * Creates a completed transaction
 */
export async function createCompletedTransaction(
  dataSource: DataSource,
  options: TransactionFactoryOptions = {},
): Promise<Transaction> {
  return createTransaction(dataSource, {
    ...options,
    status: 'completed',
  });
}

/**
 * Creates a cancelled transaction
 */
export async function createCancelledTransaction(
  dataSource: DataSource,
  options: TransactionFactoryOptions = {},
): Promise<Transaction> {
  return createTransaction(dataSource, {
    ...options,
    status: 'cancelled',
  });
}

/**
 * Creates a refunded transaction
 */
export async function createRefundedTransaction(
  dataSource: DataSource,
  options: TransactionFactoryOptions = {},
): Promise<Transaction> {
  return createTransaction(dataSource, {
    ...options,
    status: 'refunded',
  });
}

/**
 * Creates transactions with different statuses
 */
export async function createTransactionsWithStatuses(
  dataSource: DataSource,
  statuses: Array<'pending' | 'completed' | 'cancelled' | 'refunded'>,
  options: TransactionFactoryOptions = {},
): Promise<Transaction[]> {
  const transactions: Transaction[] = [];

  for (const status of statuses) {
    const transaction = await createTransaction(dataSource, {
      ...options,
      status,
    });
    transactions.push(transaction);
  }

  return transactions;
}

/**
 * Resets the transaction counter (call in beforeEach if needed)
 */
export function resetTransactionCounter(): void {
  transactionCounter = 0;
}
