/**
 * ListingsController Integration Tests
 *
 * Tests the full HTTP request/response cycle for listing endpoints:
 * - POST /listings - Create listing (authenticated)
 * - GET /listings - Get all listings with optional filters
 * - GET /listings/:id - Get listing by ID
 * - PATCH /listings/:id - Update listing (authenticated)
 * - DELETE /listings/:id - Delete listing (authenticated)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ListingsController } from '../../../src/listings/listings.controller';
import { ListingsService } from '../../../src/listings/listings.service';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';
import { NotFoundException } from '@nestjs/common';

describe('ListingsController (Integration)', () => {
  let app: INestApplication;
  let mockListingsService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findByEvent: jest.Mock;
    findByUser: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const mockListing = {
    id: 'listing-123',
    userId: 'user-123',
    eventId: 'event-456',
    type: 'offer',
    ticketCount: 2,
    sectionInfo: 'Section A',
    eventName: 'Test Concert',
    eventDate: '2025-06-15',
    eventVenue: 'Test Arena',
    eventImage: 'https://example.com/image.jpg',
    description: 'Great seats!',
    lookingFor: undefined as string | undefined,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    },
    event: {
      id: 'event-456',
      name: 'Test Concert',
    },
  };

  const mockListings = [
    mockListing,
    {
      ...mockListing,
      id: 'listing-456',
      userId: 'user-789',
      ticketCount: 4,
    },
  ];

  beforeAll(async () => {
    mockListingsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByEvent: jest.fn(),
      findByUser: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ListingsController],
      providers: [{ provide: ListingsService, useValue: mockListingsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'user-123', email: 'test@example.com' };
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

  describe('POST /listings', () => {
    const createListingDto = {
      eventId: 'event-456',
      type: 'offer',
      ticketCount: 2,
      sectionInfo: 'Section A',
      eventName: 'Test Concert',
      eventDate: '2025-06-15',
      eventVenue: 'Test Arena',
      eventImage: 'https://example.com/image.jpg',
      description: 'Great seats!',
    };

    it('should create a new listing when authenticated', async () => {
      mockListingsService.create.mockResolvedValue(mockListing);

      const response = await request(app.getHttpServer())
        .post('/listings')
        .send(createListingDto)
        .expect(201);

      expect(response.body).toEqual(mockListing);
      expect(mockListingsService.create).toHaveBeenCalledWith({
        ...createListingDto,
        userId: 'user-123',
      });
    });

    it('should include user ID from JWT in created listing', async () => {
      mockListingsService.create.mockResolvedValue(mockListing);

      await request(app.getHttpServer())
        .post('/listings')
        .send(createListingDto)
        .expect(201);

      expect(mockListingsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
        }),
      );
    });
  });

  describe('GET /listings', () => {
    it('should return all listings', async () => {
      mockListingsService.findAll.mockResolvedValue(mockListings);

      const response = await request(app.getHttpServer())
        .get('/listings')
        .expect(200);

      expect(response.body).toEqual(mockListings);
      expect(mockListingsService.findAll).toHaveBeenCalled();
    });

    it('should return listings filtered by eventId', async () => {
      mockListingsService.findByEvent.mockResolvedValue([mockListing]);

      const response = await request(app.getHttpServer())
        .get('/listings')
        .query({ eventId: 'event-456' })
        .expect(200);

      expect(response.body).toEqual([mockListing]);
      expect(mockListingsService.findByEvent).toHaveBeenCalledWith('event-456');
      expect(mockListingsService.findAll).not.toHaveBeenCalled();
    });

    it('should return listings filtered by userId', async () => {
      mockListingsService.findByUser.mockResolvedValue([mockListing]);

      const response = await request(app.getHttpServer())
        .get('/listings')
        .query({ userId: 'user-123' })
        .expect(200);

      expect(response.body).toEqual([mockListing]);
      expect(mockListingsService.findByUser).toHaveBeenCalledWith('user-123');
      expect(mockListingsService.findAll).not.toHaveBeenCalled();
    });

    it('should return empty array when no listings', async () => {
      mockListingsService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/listings')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should include Cache-Control header', async () => {
      mockListingsService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/listings')
        .expect(200);

      expect(response.headers['cache-control']).toBe(
        'public, max-age=30, stale-while-revalidate=300',
      );
    });
  });

  describe('GET /listings/:id', () => {
    it('should return listing by ID', async () => {
      mockListingsService.findOne.mockResolvedValue(mockListing);

      const response = await request(app.getHttpServer())
        .get('/listings/listing-123')
        .expect(200);

      expect(response.body).toEqual(mockListing);
      expect(mockListingsService.findOne).toHaveBeenCalledWith('listing-123');
    });

    it('should return null when listing not found', async () => {
      mockListingsService.findOne.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get('/listings/nonexistent')
        .expect(200);

      expect(response.body).toEqual({});
    });

    it('should include Cache-Control header', async () => {
      mockListingsService.findOne.mockResolvedValue(mockListing);

      const response = await request(app.getHttpServer())
        .get('/listings/listing-123')
        .expect(200);

      expect(response.headers['cache-control']).toBe(
        'public, max-age=30, stale-while-revalidate=300',
      );
    });
  });

  describe('PATCH /listings/:id', () => {
    it('should update listing', async () => {
      const updateData = { ticketCount: 4, description: 'Updated description' };
      const updatedListing = { ...mockListing, ...updateData };
      mockListingsService.update.mockResolvedValue(updatedListing);

      const response = await request(app.getHttpServer())
        .patch('/listings/listing-123')
        .send(updateData)
        .expect(200);

      expect(response.body.ticketCount).toBe(4);
      expect(response.body.description).toBe('Updated description');
      expect(mockListingsService.update).toHaveBeenCalledWith('listing-123', updateData);
    });

    it('should return null when updating non-existent listing', async () => {
      mockListingsService.update.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .patch('/listings/nonexistent')
        .send({ ticketCount: 4 })
        .expect(200);

      expect(response.body).toEqual({});
    });
  });

  describe('DELETE /listings/:id', () => {
    it('should delete listing', async () => {
      mockListingsService.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/listings/listing-123')
        .expect(200);

      expect(mockListingsService.remove).toHaveBeenCalledWith('listing-123');
    });

    it('should handle delete of non-existent listing', async () => {
      mockListingsService.remove.mockRejectedValue(
        new NotFoundException('Listing not found'),
      );

      const response = await request(app.getHttpServer())
        .delete('/listings/nonexistent')
        .expect(404);

      expect(response.body.message).toBe('Listing not found');
    });
  });
});
