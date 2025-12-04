/**
 * EventsService Unit Tests
 *
 * Tests event management logic including:
 * - Retrieving all events with accurate listing counts
 * - Finding events by ID
 * - Filtering by city
 * - Filtering by category
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { EventsService } from '../../../src/events/events.service';
import { Event } from '../../../src/events/entities/event.entity';

describe('EventsService', () => {
  let eventsService: EventsService;
  let eventsRepository: jest.Mocked<Repository<Event>>;

  // Mock event data matching actual Event entity
  const mockEvent = {
    id: 'event-123',
    name: 'Test Concert',
    venue: 'Test Arena',
    location: 'Austin, TX',
    city: 'Austin',
    date: '2025-06-15', // Event entity uses string dates
    image: 'https://example.com/image.jpg',
    category: 'Music',
    activeListings: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock raw result from query builder
  const mockRawEvent = {
    id: 'event-123',
    name: 'Test Concert',
    venue: 'Test Arena',
    location: 'Austin, TX',
    city: 'Austin',
    date: '2025-06-15',
    image: 'https://example.com/image.jpg',
    category: 'Music',
    activeListings: '5', // Comes as string from raw query
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Helper to create mock query builder
  const createMockQueryBuilder = () => ({
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
  });

  beforeEach(async () => {
    const mockRepository = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockRepository,
        },
      ],
    }).compile();

    eventsService = module.get<EventsService>(EventsService);
    eventsRepository = module.get(getRepositoryToken(Event));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all events with accurate activeListings count', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([mockRawEvent]);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.findAll();

      expect(eventsRepository.createQueryBuilder).toHaveBeenCalledWith('event');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'listings',
        'listing',
        'listing.eventId = event.id AND listing.status = :status',
        { status: 'active' },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('event.date', 'ASC');
      expect(result).toHaveLength(1);
      expect(result[0].activeListings).toBe(5); // Parsed from string
    });

    it('should return empty array when no events exist', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.findAll();

      expect(result).toEqual([]);
    });

    it('should convert activeListings string to number', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { ...mockRawEvent, activeListings: '10' },
        { ...mockRawEvent, id: 'event-456', activeListings: '0' },
      ]);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.findAll();

      expect(result[0].activeListings).toBe(10);
      expect(result[1].activeListings).toBe(0);
    });

    it('should default activeListings to 0 when null', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { ...mockRawEvent, activeListings: null },
      ]);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.findAll();

      expect(result[0].activeListings).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return event by ID with accurate activeListings', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawOne.mockResolvedValue(mockRawEvent);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.findOne('event-123');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('event.id = :id', { id: 'event-123' });
      expect(result).not.toBeNull();
      expect(result!.id).toBe('event-123');
      expect(result!.activeListings).toBe(5);
    });

    it('should return null when event not found', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawOne.mockResolvedValue(null);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.findOne('nonexistent');

      expect(result).toBeNull();
    });

    it('should count only active listings', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawOne.mockResolvedValue(mockRawEvent);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await eventsService.findOne('event-123');

      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'listings',
        'listing',
        'listing.eventId = event.id AND listing.status = :status',
        { status: 'active' },
      );
    });
  });

  describe('findByCity', () => {
    it('should return events filtered by city', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      const austinEvents = [mockRawEvent, { ...mockRawEvent, id: 'event-456' }];
      mockQueryBuilder.getRawMany.mockResolvedValue(austinEvents);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.findByCity('Austin');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('event.city = :city', { city: 'Austin' });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no events in city', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.findByCity('Unknown City');

      expect(result).toEqual([]);
    });

    it('should order results by date ascending', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await eventsService.findByCity('Austin');

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('event.date', 'ASC');
    });

    it('should include accurate activeListings for city events', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([{ ...mockRawEvent, activeListings: '15' }]);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.findByCity('Austin');

      expect(result[0].activeListings).toBe(15);
    });
  });

  describe('findByCategory', () => {
    it('should return events filtered by category', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      const concertEvents = [mockRawEvent, { ...mockRawEvent, id: 'event-789' }];
      mockQueryBuilder.getRawMany.mockResolvedValue(concertEvents);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.findByCategory('concert');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('event.category = :category', {
        category: 'concert',
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no events in category', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.findByCategory('unknown');

      expect(result).toEqual([]);
    });

    it('should order results by date ascending', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await eventsService.findByCategory('sports');

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('event.date', 'ASC');
    });

    it('should include accurate activeListings for category events', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([{ ...mockRawEvent, activeListings: '25' }]);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.findByCategory('concert');

      expect(result[0].activeListings).toBe(25);
    });

    it('should handle various categories', async () => {
      const categories = ['concert', 'sports', 'theater', 'comedy', 'festival'];
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      for (const category of categories) {
        await eventsService.findByCategory(category);
        expect(mockQueryBuilder.where).toHaveBeenLastCalledWith('event.category = :category', {
          category,
        });
      }
    });
  });
});
