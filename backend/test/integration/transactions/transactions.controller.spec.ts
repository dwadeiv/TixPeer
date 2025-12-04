/**
 * TransactionsController Integration Tests
 *
 * Tests the full HTTP request/response cycle for transaction endpoints:
 * - POST /transactions - Create transaction (authenticated)
 * - GET /transactions/my-transactions - Get current user's transactions
 * - GET /transactions/:id - Get transaction by ID
 * - PATCH /transactions/:id/status - Update transaction status
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TransactionsController } from '../../../src/transactions/transactions.controller';
import { TransactionsService } from '../../../src/transactions/transactions.service';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionStatus } from '../../../src/transactions/entities/transaction.entity';

describe('TransactionsController (Integration)', () => {
  let app: INestApplication;
  let mockTransactionsService: {
    create: jest.Mock;
    findByUser: jest.Mock;
    findOne: jest.Mock;
    updateStatus: jest.Mock;
  };

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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeAll(async () => {
    mockTransactionsService = {
      create: jest.fn(),
      findByUser: jest.fn(),
      findOne: jest.fn(),
      updateStatus: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{ provide: TransactionsService, useValue: mockTransactionsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'buyer-123', email: 'buyer@example.com' };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /transactions', () => {
    const createTransactionDto = {
      ticketId: 'ticket-789',
      quantity: 1,
    };

    it('should create a transaction when authenticated', async () => {
      mockTransactionsService.create.mockResolvedValue(mockTransaction);

      const response = await request(app.getHttpServer())
        .post('/transactions')
        .send(createTransactionDto)
        .expect(201);

      expect(response.body).toEqual(mockTransaction);
      expect(mockTransactionsService.create).toHaveBeenCalledWith(
        createTransactionDto,
        'buyer-123',
      );
    });

    it('should return 400 when ticket is not available', async () => {
      mockTransactionsService.create.mockRejectedValue(
        new BadRequestException('Ticket is not available'),
      );

      const response = await request(app.getHttpServer())
        .post('/transactions')
        .send(createTransactionDto)
        .expect(400);

      expect(response.body.message).toBe('Ticket is not available');
    });

    it('should return 400 when insufficient quantity', async () => {
      mockTransactionsService.create.mockRejectedValue(
        new BadRequestException('Insufficient ticket quantity'),
      );

      const response = await request(app.getHttpServer())
        .post('/transactions')
        .send({ ticketId: 'ticket-789', quantity: 100 })
        .expect(400);

      expect(response.body.message).toBe('Insufficient ticket quantity');
    });

    it('should return 400 when buyer tries to buy own ticket', async () => {
      mockTransactionsService.create.mockRejectedValue(
        new BadRequestException('Cannot buy your own ticket'),
      );

      const response = await request(app.getHttpServer())
        .post('/transactions')
        .send(createTransactionDto)
        .expect(400);

      expect(response.body.message).toBe('Cannot buy your own ticket');
    });
  });

  describe('GET /transactions/my-transactions', () => {
    it('should return current user transactions', async () => {
      const transactions = [mockTransaction];
      mockTransactionsService.findByUser.mockResolvedValue(transactions);

      const response = await request(app.getHttpServer())
        .get('/transactions/my-transactions')
        .expect(200);

      expect(response.body).toEqual(transactions);
      expect(mockTransactionsService.findByUser).toHaveBeenCalledWith('buyer-123');
    });

    it('should return empty array when no transactions', async () => {
      mockTransactionsService.findByUser.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/transactions/my-transactions')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should include transactions where user is buyer or seller', async () => {
      const buyerTransaction = mockTransaction;
      const sellerTransaction = {
        ...mockTransaction,
        id: 'trans-456',
        buyerId: 'other-user',
        sellerId: 'buyer-123',
      };
      mockTransactionsService.findByUser.mockResolvedValue([
        buyerTransaction,
        sellerTransaction,
      ]);

      const response = await request(app.getHttpServer())
        .get('/transactions/my-transactions')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /transactions/:id', () => {
    it('should return transaction by ID', async () => {
      mockTransactionsService.findOne.mockResolvedValue(mockTransaction);

      const response = await request(app.getHttpServer())
        .get('/transactions/trans-123')
        .expect(200);

      expect(response.body).toEqual(mockTransaction);
      expect(mockTransactionsService.findOne).toHaveBeenCalledWith('trans-123');
    });

    it('should return 404 when transaction not found', async () => {
      mockTransactionsService.findOne.mockRejectedValue(
        new NotFoundException('Transaction not found'),
      );

      const response = await request(app.getHttpServer())
        .get('/transactions/nonexistent')
        .expect(404);

      expect(response.body.message).toBe('Transaction not found');
    });

    it('should include ticket, buyer, and seller relations', async () => {
      mockTransactionsService.findOne.mockResolvedValue(mockTransaction);

      const response = await request(app.getHttpServer())
        .get('/transactions/trans-123')
        .expect(200);

      expect(response.body.ticket).toBeDefined();
      expect(response.body.buyer).toBeDefined();
      expect(response.body.seller).toBeDefined();
    });
  });

  describe('PATCH /transactions/:id/status', () => {
    it('should update transaction status to completed', async () => {
      const completedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
      };
      mockTransactionsService.updateStatus.mockResolvedValue(completedTransaction);

      const response = await request(app.getHttpServer())
        .patch('/transactions/trans-123/status')
        .send({ status: TransactionStatus.COMPLETED })
        .expect(200);

      expect(response.body.status).toBe(TransactionStatus.COMPLETED);
      expect(mockTransactionsService.updateStatus).toHaveBeenCalledWith(
        'trans-123',
        TransactionStatus.COMPLETED,
      );
    });

    it('should update transaction status to cancelled', async () => {
      const cancelledTransaction = {
        ...mockTransaction,
        status: TransactionStatus.CANCELLED,
      };
      mockTransactionsService.updateStatus.mockResolvedValue(cancelledTransaction);

      const response = await request(app.getHttpServer())
        .patch('/transactions/trans-123/status')
        .send({ status: TransactionStatus.CANCELLED })
        .expect(200);

      expect(response.body.status).toBe(TransactionStatus.CANCELLED);
    });

    it('should return 404 when transaction not found', async () => {
      mockTransactionsService.updateStatus.mockRejectedValue(
        new NotFoundException('Transaction not found'),
      );

      const response = await request(app.getHttpServer())
        .patch('/transactions/nonexistent/status')
        .send({ status: TransactionStatus.COMPLETED })
        .expect(404);

      expect(response.body.message).toBe('Transaction not found');
    });
  });
});
