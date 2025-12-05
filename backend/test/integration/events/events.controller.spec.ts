/**
 * EventsController Integration Tests
 *
 * Tests the full HTTP request/response cycle for event endpoints:
 * - GET /events - Get all events with optional filters
 * - GET /events/:id - Get event by ID
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { EventsController } from '../../../src/events/events.controller';
import { EventsService } from '../../../src/events/events.service';

describe('EventsController (Integration)', () => {
  let app: INestApplication;
  let mockEventsService: {
    findAll: jest.Mock;
    findByCity: jest.Mock;
    findByCategory: jest.Mock;
    findOne: jest.Mock;
  };

  const mockEvent = {
    id: 'event-123',
    name: 'Test Concert',
    venue: 'Test Arena',
    location: 'Austin, TX',
    city: 'Austin',
    date: '2025-06-15',
    image: 'https://example.com/image.jpg',
    category: 'Music',
    activeListings: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockEvents = [
    mockEvent,
    {
      ...mockEvent,
      id: 'event-456',
      name: 'Sports Game',
      category: 'Sports',
      city: 'Dallas',
      activeListings: 10,
    },
  ];

  beforeAll(async () => {
    mockEventsService = {
      findAll: jest.fn(),
      findByCity: jest.fn(),
      findByCategory: jest.fn(),
      findOne: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: mockEventsService }],
    }).compile();

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

  describe('GET /events', () => {
    it('should return all events wrapped in response object', async () => {
      mockEventsService.findAll.mockResolvedValue(mockEvents);

      const response = await request(app.getHttpServer())
        .get('/events')
        .expect(200);

      // Response format changed to { events: [...], searchedNearby: boolean }
      expect(response.body.events).toEqual(mockEvents);
      expect(response.body.searchedNearby).toBe(false);
      expect(mockEventsService.findAll).toHaveBeenCalled();
    });

    it('should return events filtered by city', async () => {
      const austinEvents = [mockEvent];
      mockEventsService.findByCity.mockResolvedValue(austinEvents);

      const response = await request(app.getHttpServer())
        .get('/events')
        .query({ city: 'Austin' })
        .expect(200);

      expect(response.body.events).toEqual(austinEvents);
      expect(response.body.searchedNearby).toBe(false);
      expect(mockEventsService.findByCity).toHaveBeenCalledWith('Austin');
      expect(mockEventsService.findAll).not.toHaveBeenCalled();
    });

    it('should return events filtered by category', async () => {
      const musicEvents = [mockEvent];
      mockEventsService.findByCategory.mockResolvedValue(musicEvents);

      const response = await request(app.getHttpServer())
        .get('/events')
        .query({ category: 'Music' })
        .expect(200);

      expect(response.body.events).toEqual(musicEvents);
      expect(response.body.searchedNearby).toBe(false);
      expect(mockEventsService.findByCategory).toHaveBeenCalledWith('Music');
      expect(mockEventsService.findAll).not.toHaveBeenCalled();
    });

    it('should prioritize city filter over category', async () => {
      mockEventsService.findByCity.mockResolvedValue([mockEvent]);

      await request(app.getHttpServer())
        .get('/events')
        .query({ city: 'Austin', category: 'Music' })
        .expect(200);

      expect(mockEventsService.findByCity).toHaveBeenCalledWith('Austin');
      expect(mockEventsService.findByCategory).not.toHaveBeenCalled();
    });

    it('should return empty events array when no events', async () => {
      mockEventsService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/events')
        .expect(200);

      expect(response.body.events).toEqual([]);
      expect(response.body.searchedNearby).toBe(false);
    });

    it('should include Cache-Control header', async () => {
      mockEventsService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/events')
        .expect(200);

      expect(response.headers['cache-control']).toBe(
        'public, max-age=60, stale-while-revalidate=300',
      );
    });
  });

  describe('GET /events/:id', () => {
    it('should return event by ID', async () => {
      mockEventsService.findOne.mockResolvedValue(mockEvent);

      const response = await request(app.getHttpServer())
        .get('/events/event-123')
        .expect(200);

      expect(response.body).toEqual(mockEvent);
      expect(mockEventsService.findOne).toHaveBeenCalledWith('event-123');
    });

    it('should return null when event not found', async () => {
      mockEventsService.findOne.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get('/events/nonexistent')
        .expect(200);

      expect(response.body).toEqual({});
    });

    it('should include activeListings count', async () => {
      mockEventsService.findOne.mockResolvedValue(mockEvent);

      const response = await request(app.getHttpServer())
        .get('/events/event-123')
        .expect(200);

      expect(response.body.activeListings).toBe(5);
    });

    it('should include Cache-Control header', async () => {
      mockEventsService.findOne.mockResolvedValue(mockEvent);

      const response = await request(app.getHttpServer())
        .get('/events/event-123')
        .expect(200);

      expect(response.headers['cache-control']).toBe(
        'public, max-age=30, stale-while-revalidate=300',
      );
    });
  });
});
