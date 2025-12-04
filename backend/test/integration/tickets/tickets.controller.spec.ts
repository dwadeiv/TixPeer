/**
 * TicketsController Integration Tests
 *
 * Tests the full HTTP request/response cycle for ticket endpoints:
 * - POST /tickets - Create ticket (authenticated)
 * - GET /tickets - Get all tickets with optional filters
 * - GET /tickets/my-tickets - Get current user's tickets (authenticated)
 * - GET /tickets/:id - Get ticket by ID
 * - PATCH /tickets/:id - Update ticket (authenticated)
 * - DELETE /tickets/:id - Delete ticket (authenticated)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TicketsController } from '../../../src/tickets/tickets.controller';
import { TicketsService } from '../../../src/tickets/tickets.service';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TicketStatus } from '../../../src/tickets/entities/ticket.entity';

describe('TicketsController (Integration)', () => {
  let app: INestApplication;
  let mockTicketsService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findByUser: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const mockSeller = {
    id: 'user-123',
    email: 'seller@example.com',
    name: 'Test Seller',
  };

  const mockTicket = {
    id: 'ticket-123',
    title: 'Concert Ticket',
    description: 'Front row seats',
    category: 'concert',
    eventDate: '2025-06-15',
    venue: 'Test Arena',
    location: 'Austin, TX',
    price: 150.0,
    quantity: 2,
    section: 'A',
    row: '1',
    seat: '5-6',
    status: TicketStatus.AVAILABLE,
    sellerId: 'user-123',
    seller: mockSeller,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockTickets = [
    mockTicket,
    {
      ...mockTicket,
      id: 'ticket-456',
      title: 'Sports Game',
      category: 'sports',
      price: 75.0,
    },
  ];

  beforeAll(async () => {
    mockTicketsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByUser: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [{ provide: TicketsService, useValue: mockTicketsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'user-123', email: 'seller@example.com' };
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

  describe('POST /tickets', () => {
    const createTicketDto = {
      title: 'Concert Ticket',
      description: 'Front row seats',
      category: 'concert',
      eventDate: '2025-06-15',
      venue: 'Test Arena',
      location: 'Austin, TX',
      price: 150.0,
      quantity: 2,
      section: 'A',
      row: '1',
    };

    it('should create a ticket when authenticated', async () => {
      mockTicketsService.create.mockResolvedValue(mockTicket);

      const response = await request(app.getHttpServer())
        .post('/tickets')
        .send(createTicketDto)
        .expect(201);

      expect(response.body).toEqual(mockTicket);
      expect(mockTicketsService.create).toHaveBeenCalledWith(
        createTicketDto,
        'user-123',
      );
    });

    it('should include seller ID from JWT in created ticket', async () => {
      mockTicketsService.create.mockResolvedValue(mockTicket);

      await request(app.getHttpServer())
        .post('/tickets')
        .send(createTicketDto)
        .expect(201);

      expect(mockTicketsService.create).toHaveBeenCalledWith(
        expect.anything(),
        'user-123',
      );
    });
  });

  describe('GET /tickets', () => {
    it('should return all tickets', async () => {
      mockTicketsService.findAll.mockResolvedValue(mockTickets);

      const response = await request(app.getHttpServer())
        .get('/tickets')
        .expect(200);

      expect(response.body).toEqual(mockTickets);
      expect(mockTicketsService.findAll).toHaveBeenCalledWith({
        category: undefined,
        search: undefined,
        status: undefined,
      });
    });

    it('should filter tickets by category', async () => {
      const concertTickets = [mockTicket];
      mockTicketsService.findAll.mockResolvedValue(concertTickets);

      const response = await request(app.getHttpServer())
        .get('/tickets')
        .query({ category: 'concert' })
        .expect(200);

      expect(response.body).toEqual(concertTickets);
      expect(mockTicketsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'concert' }),
      );
    });

    it('should filter tickets by search term', async () => {
      mockTicketsService.findAll.mockResolvedValue([mockTicket]);

      await request(app.getHttpServer())
        .get('/tickets')
        .query({ search: 'concert' })
        .expect(200);

      expect(mockTicketsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'concert' }),
      );
    });

    it('should filter tickets by status', async () => {
      mockTicketsService.findAll.mockResolvedValue([mockTicket]);

      await request(app.getHttpServer())
        .get('/tickets')
        .query({ status: TicketStatus.AVAILABLE })
        .expect(200);

      expect(mockTicketsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: TicketStatus.AVAILABLE }),
      );
    });

    it('should return empty array when no tickets', async () => {
      mockTicketsService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/tickets')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /tickets/my-tickets', () => {
    it('should return current user tickets', async () => {
      mockTicketsService.findByUser.mockResolvedValue([mockTicket]);

      const response = await request(app.getHttpServer())
        .get('/tickets/my-tickets')
        .expect(200);

      expect(response.body).toEqual([mockTicket]);
      expect(mockTicketsService.findByUser).toHaveBeenCalledWith('user-123');
    });

    it('should return empty array when user has no tickets', async () => {
      mockTicketsService.findByUser.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/tickets/my-tickets')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /tickets/:id', () => {
    it('should return ticket by ID', async () => {
      mockTicketsService.findOne.mockResolvedValue(mockTicket);

      const response = await request(app.getHttpServer())
        .get('/tickets/ticket-123')
        .expect(200);

      expect(response.body).toEqual(mockTicket);
      expect(mockTicketsService.findOne).toHaveBeenCalledWith('ticket-123');
    });

    it('should return 404 when ticket not found', async () => {
      mockTicketsService.findOne.mockRejectedValue(
        new NotFoundException('Ticket not found'),
      );

      const response = await request(app.getHttpServer())
        .get('/tickets/nonexistent')
        .expect(404);

      expect(response.body.message).toBe('Ticket not found');
    });

    it('should include seller relation', async () => {
      mockTicketsService.findOne.mockResolvedValue(mockTicket);

      const response = await request(app.getHttpServer())
        .get('/tickets/ticket-123')
        .expect(200);

      expect(response.body.seller).toBeDefined();
      expect(response.body.seller.id).toBe('user-123');
    });
  });

  describe('PATCH /tickets/:id', () => {
    const updateData = { price: 175.0, quantity: 1 };

    it('should update ticket when user is owner', async () => {
      const updatedTicket = { ...mockTicket, ...updateData };
      mockTicketsService.update.mockResolvedValue(updatedTicket);

      const response = await request(app.getHttpServer())
        .patch('/tickets/ticket-123')
        .send(updateData)
        .expect(200);

      expect(response.body.price).toBe(175.0);
      expect(response.body.quantity).toBe(1);
      expect(mockTicketsService.update).toHaveBeenCalledWith(
        'ticket-123',
        updateData,
        'user-123',
      );
    });

    it('should return 404 when ticket not found', async () => {
      mockTicketsService.update.mockRejectedValue(
        new NotFoundException('Ticket not found'),
      );

      const response = await request(app.getHttpServer())
        .patch('/tickets/nonexistent')
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe('Ticket not found');
    });

    it('should return 403 when user is not owner', async () => {
      mockTicketsService.update.mockRejectedValue(
        new ForbiddenException('Not authorized to update this ticket'),
      );

      const response = await request(app.getHttpServer())
        .patch('/tickets/other-ticket')
        .send(updateData)
        .expect(403);

      expect(response.body.message).toBe('Not authorized to update this ticket');
    });
  });

  describe('DELETE /tickets/:id', () => {
    it('should delete ticket when user is owner', async () => {
      mockTicketsService.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/tickets/ticket-123')
        .expect(200);

      expect(mockTicketsService.remove).toHaveBeenCalledWith('ticket-123', 'user-123');
    });

    it('should return 404 when ticket not found', async () => {
      mockTicketsService.remove.mockRejectedValue(
        new NotFoundException('Ticket not found'),
      );

      const response = await request(app.getHttpServer())
        .delete('/tickets/nonexistent')
        .expect(404);

      expect(response.body.message).toBe('Ticket not found');
    });

    it('should return 403 when user is not owner', async () => {
      mockTicketsService.remove.mockRejectedValue(
        new ForbiddenException('Not authorized to delete this ticket'),
      );

      const response = await request(app.getHttpServer())
        .delete('/tickets/other-ticket')
        .expect(403);

      expect(response.body.message).toBe('Not authorized to delete this ticket');
    });
  });
});
