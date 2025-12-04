/**
 * Message and Conversation Factory
 *
 * Generates Message and Conversation entities for testing
 */

import { Message } from '../../src/messages/entities/message.entity';
import { Conversation } from '../../src/messages/entities/conversation.entity';
import { User } from '../../src/users/entities/user.entity';
import { Listing } from '../../src/listings/entities/listing.entity';
import { DataSource } from 'typeorm';
import { createUser } from './user.factory';
import { createListing } from './listing.factory';

interface ConversationFactoryOptions {
  buyer?: User;
  seller?: User;
  listing?: Listing;
}

interface MessageFactoryOptions {
  conversation?: Conversation;
  sender?: User;
  content?: string;
  isRead?: boolean;
}

let messageCounter = 0;
let conversationCounter = 0;

/**
 * Generates unique message data for testing
 */
export function generateMessageData(options: MessageFactoryOptions = {}): Partial<Message> {
  messageCounter++;
  const timestamp = Date.now();

  return {
    content: options.content ?? `Test message ${messageCounter}_${timestamp}`,
    isRead: options.isRead ?? false,
  };
}

/**
 * Creates a Conversation entity in the database
 * Automatically creates buyer, seller, and listing if not provided
 */
export async function createConversation(
  dataSource: DataSource,
  options: ConversationFactoryOptions = {},
): Promise<Conversation> {
  const conversationRepository = dataSource.getRepository(Conversation);
  conversationCounter++;

  // Create users if not provided
  const buyer = options.buyer ?? (await createUser(dataSource));
  const seller = options.seller ?? (await createUser(dataSource));

  // Create listing if not provided (owned by seller)
  const listing =
    options.listing ??
    (await createListing(dataSource, {
      seller,
    }));

  const conversation = conversationRepository.create({
    buyer,
    buyerId: buyer.id,
    seller,
    sellerId: seller.id,
    listing,
    listingId: listing.id,
  });

  return conversationRepository.save(conversation);
}

/**
 * Creates a Message entity in the database
 * Automatically creates conversation if not provided
 */
export async function createMessage(
  dataSource: DataSource,
  options: MessageFactoryOptions = {},
): Promise<Message> {
  const messageRepository = dataSource.getRepository(Message);

  // Create conversation if not provided
  const conversation = options.conversation ?? (await createConversation(dataSource));

  // Default sender to buyer if not specified
  const sender = options.sender ?? conversation.buyer;

  const messageData = generateMessageData(options);

  const message = messageRepository.create({
    ...messageData,
    conversation,
    conversationId: conversation.id,
    sender,
    senderId: sender.id,
  });

  return messageRepository.save(message);
}

/**
 * Creates multiple messages in a conversation
 */
export async function createMessages(
  dataSource: DataSource,
  count: number,
  options: MessageFactoryOptions = {},
): Promise<Message[]> {
  const messages: Message[] = [];
  const conversation = options.conversation ?? (await createConversation(dataSource));

  for (let i = 0; i < count; i++) {
    const message = await createMessage(dataSource, {
      ...options,
      conversation,
    });
    messages.push(message);
  }

  return messages;
}

/**
 * Creates a conversation with back-and-forth messages
 */
export async function createConversationWithMessages(
  dataSource: DataSource,
  messageCount: number,
  options: ConversationFactoryOptions = {},
): Promise<{ conversation: Conversation; messages: Message[] }> {
  const conversation = await createConversation(dataSource, options);
  const messages: Message[] = [];

  // Alternate between buyer and seller sending messages
  for (let i = 0; i < messageCount; i++) {
    const sender = i % 2 === 0 ? conversation.buyer : conversation.seller;
    const message = await createMessage(dataSource, {
      conversation,
      sender,
      content: `Message ${i + 1} from ${sender.firstName}`,
    });
    messages.push(message);
  }

  return { conversation, messages };
}

/**
 * Creates unread messages for testing notification scenarios
 */
export async function createUnreadMessages(
  dataSource: DataSource,
  count: number,
  receiver: User,
  options: MessageFactoryOptions = {},
): Promise<Message[]> {
  const messages: Message[] = [];

  // Create a conversation where the receiver is the buyer
  const seller = await createUser(dataSource);
  const listing = await createListing(dataSource, { seller });
  const conversation = await createConversation(dataSource, {
    buyer: receiver,
    seller,
    listing,
  });

  for (let i = 0; i < count; i++) {
    const message = await createMessage(dataSource, {
      ...options,
      conversation,
      sender: seller, // Sender is NOT the receiver
      isRead: false,
    });
    messages.push(message);
  }

  return messages;
}

/**
 * Creates read messages
 */
export async function createReadMessages(
  dataSource: DataSource,
  count: number,
  options: MessageFactoryOptions = {},
): Promise<Message[]> {
  const messages: Message[] = [];
  const conversation = options.conversation ?? (await createConversation(dataSource));

  for (let i = 0; i < count; i++) {
    const message = await createMessage(dataSource, {
      ...options,
      conversation,
      isRead: true,
    });
    messages.push(message);
  }

  return messages;
}

/**
 * Resets the counters (call in beforeEach if needed)
 */
export function resetMessageCounter(): void {
  messageCounter = 0;
}

export function resetConversationCounter(): void {
  conversationCounter = 0;
}

export function resetMessageFactoryCounters(): void {
  messageCounter = 0;
  conversationCounter = 0;
}
