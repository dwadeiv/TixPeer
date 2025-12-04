/**
 * TransactionsService Unit Tests
 *
 * Tests transaction management logic including:
 * - Creating transactions with validation
 * - Retrieving transactions
 * - Updating transaction status
 * - User-specific transaction queries
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionsService } from '../../../src/transactions/transactions.service';
import { Transaction, TransactionStatus } from '../../../src/transactions/entities/transaction.entity';
import { TicketsService } from '../../../src/tickets/tickets.service';
import { TicketStatus } from '../../../src/tickets/entities/ticket.entity';

describe('TransactionsService', () => {
  let transactionsService: TransactionsService;
  let mockRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let mockTicketsService: {
    findOne: jest.Mock;
  };

  // Mock data
  const mockBuyer = {
    id: 'buyer-123',
    email: 'buyer@example.com',
    name: 'Test Buyer',
  };

  const mockSeller = {
    id: 'seller-456',
    email: 'seller@example.com',
    name: 'Test Seller',
  };

  const mockTicket = {
    id: 'ticket-789',
    title: 'Concert Ticket',
    price: 100.0,
    quantity: 5,
    status: TicketStatus.AVAILABLE,
    sellerId: 'seller-456',
    seller: mockSeller,
  };

  const mockTransaction = {
    id: 'trans-123',
    ticketId: 'ticket-789',
    buyerId: 'buyer-123',
    sellerId: 'seller-456',
    amount: 100.0,
    quantity: 1,
    status: TransactionStatus.PENDING,
    ticket: mockTicket,
    buyer: mockBuyer,
    seller: mockSeller,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockTicketsService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockRepository,
        },
        {
          provide: TicketsService,
          useValue: mockTicketsService,
        },
      ],
    }).compile();

    transactionsService = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      ticketId: 'ticket-789',
      quantity: 1,
    };

    it('should create a transaction when ticket is available', async () => {
      mockTicketsService.findOne.mockResolvedValue(mockTicket);
      mockRepository.create.mockReturnValue(mockTransaction);
      mockRepository.save.mockResolvedValue(mockTransaction);

      const result = await transactionsService.create(createDto, 'buyer-123');

      expect(mockTicketsService.findOne).toHaveBeenCalledWith('ticket-789');
      expect(mockRepository.create).toHaveBeenCalledWith({
        ticketId: 'ticket-789',
        buyerId: 'buyer-123',
        sellerId: 'seller-456',
        amount: 100.0,
        quantity: 1,
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should calculate correct amount for multiple tickets', async () => {
      const multiTicketDto = { ticketId: 'ticket-789', quantity: 3 };
      mockTicketsService.findOne.mockResolvedValue(mockTicket);
      mockRepository.create.mockReturnValue(mockTransaction);
      mockRepository.save.mockResolvedValue(mockTransaction);

      await transactionsService.create(multiTicketDto, 'buyer-123');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 300.0,
          quantity: 3,
        }),
      );
    });

    it('should default quantity to 1 when not provided', async () => {
      const noQuantityDto = { ticketId: 'ticket-789' };
      mockTicketsService.findOne.mockResolvedValue(mockTicket);
      mockRepository.create.mockReturnValue(mockTransaction);
      mockRepository.save.mockResolvedValue(mockTransaction);

      await transactionsService.create(noQuantityDto, 'buyer-123');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100.0,
          quantity: 1,
        }),
      );
    });

    it('should throw BadRequestException when ticket is not available', async () => {
      const soldTicket = { ...mockTicket, status: TicketStatus.SOLD };
      mockTicketsService.findOne.mockResolvedValue(soldTicket);

      await expect(transactionsService.create(createDto, 'buyer-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when ticket is reserved', async () => {
      const reservedTicket = { ...mockTicket, status: TicketStatus.RESERVED };
      mockTicketsService.findOne.mockResolvedValue(reservedTicket);

      await expect(transactionsService.create(createDto, 'buyer-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when insufficient quantity', async () => {
      const lowQuantityTicket = { ...mockTicket, quantity: 2 };
      mockTicketsService.findOne.mockResolvedValue(lowQuantityTicket);
      const tooManyDto = { ticketId: 'ticket-789', quantity: 5 };

      await expect(transactionsService.create(tooManyDto, 'buyer-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when buyer tries to buy own ticket', async () => {
      mockTicketsService.findOne.mockResolvedValue(mockTicket);

      await expect(transactionsService.create(createDto, 'seller-456')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all transactions with relations', async () => {
      const transactions = [mockTransaction, { ...mockTransaction, id: 'trans-456' }];
      mockRepository.find.mockResolvedValue(transactions);

      const result = await transactionsService.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['ticket', 'buyer', 'seller'],
      });
      expect(result).toEqual(transactions);
    });

    it('should return empty array when no transactions exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await transactionsService.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByUser', () => {
    it('should return transactions where user is buyer or seller', async () => {
      const userTransactions = [mockTransaction];
      mockRepository.find.mockResolvedValue(userTransactions);

      const result = await transactionsService.findByUser('buyer-123');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: [{ buyerId: 'buyer-123' }, { sellerId: 'buyer-123' }],
        relations: ['ticket', 'buyer', 'seller'],
      });
      expect(result).toEqual(userTransactions);
    });

    it('should return empty array when user has no transactions', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await transactionsService.findByUser('user-with-no-transactions');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return transaction by ID with relations', async () => {
      mockRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await transactionsService.findOne('trans-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'trans-123' },
        relations: ['ticket', 'buyer', 'seller'],
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(transactionsService.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update transaction status to completed', async () => {
      const pendingTransaction = { ...mockTransaction, status: TransactionStatus.PENDING };
      const completedTransaction = { ...mockTransaction, status: TransactionStatus.COMPLETED };
      mockRepository.findOne.mockResolvedValue(pendingTransaction);
      mockRepository.save.mockResolvedValue(completedTransaction);

      const result = await transactionsService.updateStatus('trans-123', TransactionStatus.COMPLETED);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TransactionStatus.COMPLETED,
        }),
      );
      expect(result.status).toBe(TransactionStatus.COMPLETED);
    });

    it('should update transaction status to cancelled', async () => {
      const pendingTransaction = { ...mockTransaction, status: TransactionStatus.PENDING };
      const cancelledTransaction = { ...mockTransaction, status: TransactionStatus.CANCELLED };
      mockRepository.findOne.mockResolvedValue(pendingTransaction);
      mockRepository.save.mockResolvedValue(cancelledTransaction);

      const result = await transactionsService.updateStatus('trans-123', TransactionStatus.CANCELLED);

      expect(result.status).toBe(TransactionStatus.CANCELLED);
    });

    it('should throw NotFoundException when transaction to update not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        transactionsService.updateStatus('nonexistent', TransactionStatus.COMPLETED),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
