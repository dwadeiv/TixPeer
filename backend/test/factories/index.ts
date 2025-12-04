/**
 * Test Factories Index
 *
 * Exports all factory functions for easy importing in tests
 *
 * Usage:
 * import { createUser, createListing, createEvent } from '@test/factories';
 */

// User factory exports
export {
  generateUserData,
  createUser,
  createUsers,
  createVerifiedUser,
  createUnverifiedUser,
  resetUserCounter,
} from './user.factory';

// Event factory exports
export {
  generateEventData,
  createEvent,
  createEvents,
  createPastEvent,
  createUpcomingEvent,
  createEventsOfCategories,
  resetEventCounter,
} from './event.factory';

// Listing factory exports
export {
  generateListingData,
  createListing,
  createListings,
  createListingsForSeller,
  createListingsForEvent,
  createSoldListing,
  createListingsWithPrices,
  resetListingCounter,
} from './listing.factory';

// Message factory exports
export {
  generateMessageData,
  createConversation,
  createMessage,
  createMessages,
  createConversationWithMessages,
  createUnreadMessages,
  createReadMessages,
  resetMessageCounter,
  resetConversationCounter,
  resetMessageFactoryCounters,
} from './message.factory';

// Transaction factory exports
export {
  generateTransactionData,
  createTransaction,
  createTransactions,
  createTransactionsForBuyer,
  createTransactionsForSeller,
  createCompletedTransaction,
  createCancelledTransaction,
  createRefundedTransaction,
  createTransactionsWithStatuses,
  resetTransactionCounter,
} from './transaction.factory';

/**
 * Resets all factory counters
 * Call this in beforeEach() if you need predictable IDs
 */
export function resetAllFactoryCounters(): void {
  const { resetUserCounter } = require('./user.factory');
  const { resetEventCounter } = require('./event.factory');
  const { resetListingCounter } = require('./listing.factory');
  const { resetMessageFactoryCounters } = require('./message.factory');
  const { resetTransactionCounter } = require('./transaction.factory');

  resetUserCounter();
  resetEventCounter();
  resetListingCounter();
  resetMessageFactoryCounters();
  resetTransactionCounter();
}
