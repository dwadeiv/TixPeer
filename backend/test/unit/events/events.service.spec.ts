/**
 * EventsService Unit Tests
 *
 * Tests event management logic including:
 * - Retrieving all events with accurate listing counts
 * - Finding events by ID
 * - Filtering by city
 * - Filtering by category
 * - Geo-based search with Haversine distance calculation
 * - Text search by name
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
    lat: null,
    lng: null,
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
    lat: null,
    lng: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Known city coordinates for geo-search tests
  // Distances are pre-calculated and verified
  const TEST_LOCATIONS = {
    NYC: { lat: 40.7128, lng: -74.006, city: 'New York' },
    LA: { lat: 34.0522, lng: -118.2437, city: 'Los Angeles' }, // ~2,451 miles from NYC
    CHICAGO: { lat: 41.8781, lng: -87.6298, city: 'Chicago' }, // ~713 miles from NYC
    BOSTON: { lat: 42.3601, lng: -71.0589, city: 'Boston' }, // ~190 miles from NYC
    PHILLY: { lat: 39.9526, lng: -75.1652, city: 'Philadelphia' }, // ~80 miles from NYC
  };

  // Mock events with geo-coordinates for searchNearby tests
  const createGeoEvent = (id: string, name: string, city: string, lat: number, lng: number, category = 'concert') => ({
    id,
    name,
    venue: `${city} Arena`,
    location: `${city}, USA`,
    city,
    date: '2025-06-15',
    image: null,
    category,
    activeListings: '3',
    lat: lat.toString(),
    lng: lng.toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Helper to create mock query builder
  const createMockQueryBuilder = () => ({
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
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

  describe('searchByName', () => {
    it('should return events matching the search query', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      const taylorEvent = { ...mockRawEvent, name: 'Taylor Swift Concert' };
      mockQueryBuilder.getRawMany.mockResolvedValue([taylorEvent]);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.searchByName('Taylor');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(event.name) LIKE LOWER(:query)',
        { query: '%Taylor%' },
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Taylor Swift Concert');
    });

    it('should return empty array when no events match', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.searchByName('nonexistent');

      expect(result).toEqual([]);
    });

    it('should perform case-insensitive search', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([mockRawEvent]);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await eventsService.searchByName('CONCERT');

      // Verify LOWER() is used for case-insensitive matching
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(event.name) LIKE LOWER(:query)',
        { query: '%CONCERT%' },
      );
    });
  });

  describe('searchNearby', () => {
    it('should return events within the specified radius', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      // Create events: NYC, Philly (80mi), Boston (190mi), Chicago (713mi)
      const geoEvents = [
        createGeoEvent('1', 'NYC Event', 'New York', TEST_LOCATIONS.NYC.lat, TEST_LOCATIONS.NYC.lng),
        createGeoEvent('2', 'Philly Event', 'Philadelphia', TEST_LOCATIONS.PHILLY.lat, TEST_LOCATIONS.PHILLY.lng),
        createGeoEvent('3', 'Boston Event', 'Boston', TEST_LOCATIONS.BOSTON.lat, TEST_LOCATIONS.BOSTON.lng),
        createGeoEvent('4', 'Chicago Event', 'Chicago', TEST_LOCATIONS.CHICAGO.lat, TEST_LOCATIONS.CHICAGO.lng),
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(geoEvents);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Search from NYC with 100 mile radius - should include NYC and Philly
      const result = await eventsService.searchNearby({
        lat: TEST_LOCATIONS.NYC.lat,
        lng: TEST_LOCATIONS.NYC.lng,
        radius: 100,
      });

      expect(result.searchedNearby).toBe(true);
      expect(result.events).toHaveLength(2); // NYC (0mi) and Philly (~80mi)
      expect(result.events.map(e => e.city)).toContain('New York');
      expect(result.events.map(e => e.city)).toContain('Philadelphia');
    });

    it('should sort results by distance from search location', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      // Events listed in non-distance order
      const geoEvents = [
        createGeoEvent('2', 'Philly Event', 'Philadelphia', TEST_LOCATIONS.PHILLY.lat, TEST_LOCATIONS.PHILLY.lng),
        createGeoEvent('1', 'NYC Event', 'New York', TEST_LOCATIONS.NYC.lat, TEST_LOCATIONS.NYC.lng),
        createGeoEvent('3', 'Boston Event', 'Boston', TEST_LOCATIONS.BOSTON.lat, TEST_LOCATIONS.BOSTON.lng),
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(geoEvents);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.searchNearby({
        lat: TEST_LOCATIONS.NYC.lat,
        lng: TEST_LOCATIONS.NYC.lng,
        radius: 250, // Include all three
      });

      // Should be sorted: NYC (closest), Philly, Boston
      expect(result.events[0].city).toBe('New York');
      expect(result.events[1].city).toBe('Philadelphia');
      expect(result.events[2].city).toBe('Boston');
    });

    it('should include distance in result events', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      const geoEvents = [
        createGeoEvent('1', 'NYC Event', 'New York', TEST_LOCATIONS.NYC.lat, TEST_LOCATIONS.NYC.lng),
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(geoEvents);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.searchNearby({
        lat: TEST_LOCATIONS.NYC.lat,
        lng: TEST_LOCATIONS.NYC.lng,
        radius: 100,
      });

      // Distance should be ~0 when searching from same location
      // Cast to any since distance is added dynamically by searchNearby
      expect((result.events[0] as any).distance).toBeDefined();
      expect((result.events[0] as any).distance).toBeLessThan(1);
    });

    it('should filter events by text query when provided', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      const geoEvents = [
        createGeoEvent('1', 'Taylor Swift NYC', 'New York', TEST_LOCATIONS.NYC.lat, TEST_LOCATIONS.NYC.lng),
        createGeoEvent('2', 'Basketball Game NYC', 'New York', TEST_LOCATIONS.NYC.lat, TEST_LOCATIONS.NYC.lng),
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(geoEvents);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await eventsService.searchNearby({
        lat: TEST_LOCATIONS.NYC.lat,
        lng: TEST_LOCATIONS.NYC.lng,
        radius: 100,
        searchQuery: 'Taylor',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(event.name) LIKE LOWER(:searchQuery)',
        { searchQuery: '%Taylor%' },
      );
    });

    it('should filter events by category when provided', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      const geoEvents = [
        createGeoEvent('1', 'Concert NYC', 'New York', TEST_LOCATIONS.NYC.lat, TEST_LOCATIONS.NYC.lng, 'concert'),
        createGeoEvent('2', 'Sports NYC', 'New York', TEST_LOCATIONS.NYC.lat, TEST_LOCATIONS.NYC.lng, 'sports'),
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(geoEvents);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await eventsService.searchNearby({
        lat: TEST_LOCATIONS.NYC.lat,
        lng: TEST_LOCATIONS.NYC.lng,
        radius: 100,
        category: 'concert',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('event.category = :category', {
        category: 'concert',
      });
    });

    it('should return empty array when no events have coordinates', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.searchNearby({
        lat: TEST_LOCATIONS.NYC.lat,
        lng: TEST_LOCATIONS.NYC.lng,
        radius: 100,
      });

      expect(result.events).toEqual([]);
      expect(result.searchedNearby).toBe(true);
    });

    it('should set locationName from closest event city', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      const geoEvents = [
        createGeoEvent('1', 'Philly Event', 'Philadelphia', TEST_LOCATIONS.PHILLY.lat, TEST_LOCATIONS.PHILLY.lng),
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(geoEvents);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.searchNearby({
        lat: TEST_LOCATIONS.NYC.lat,
        lng: TEST_LOCATIONS.NYC.lng,
        radius: 100,
      });

      // Closest event is Philly, so locationName should be Philadelphia
      expect(result.locationName).toBe('Philadelphia');
    });

    it('should only include events with non-null coordinates', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await eventsService.searchNearby({
        lat: TEST_LOCATIONS.NYC.lat,
        lng: TEST_LOCATIONS.NYC.lng,
        radius: 100,
      });

      // Verify the WHERE clause filters for non-null coordinates
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'event.lat IS NOT NULL AND event.lng IS NOT NULL',
      );
    });
  });

  describe('calculateDistance (Haversine formula)', () => {
    // Access private method via type assertion for testing
    // These tests verify the Haversine formula accuracy

    it('should calculate NYC to Philadelphia as approximately 80 miles', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      const geoEvents = [
        createGeoEvent('1', 'Philly Event', 'Philadelphia', TEST_LOCATIONS.PHILLY.lat, TEST_LOCATIONS.PHILLY.lng),
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(geoEvents);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.searchNearby({
        lat: TEST_LOCATIONS.NYC.lat,
        lng: TEST_LOCATIONS.NYC.lng,
        radius: 100,
      });

      // Philly is ~80 miles from NYC
      // Cast to any since distance is added dynamically
      const phillyEvent = result.events.find(e => e.city === 'Philadelphia') as any;
      expect(phillyEvent).toBeDefined();
      expect(phillyEvent.distance).toBeGreaterThan(75);
      expect(phillyEvent.distance).toBeLessThan(85);
    });

    it('should calculate NYC to Boston as approximately 190 miles', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      const geoEvents = [
        createGeoEvent('1', 'Boston Event', 'Boston', TEST_LOCATIONS.BOSTON.lat, TEST_LOCATIONS.BOSTON.lng),
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(geoEvents);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.searchNearby({
        lat: TEST_LOCATIONS.NYC.lat,
        lng: TEST_LOCATIONS.NYC.lng,
        radius: 250,
      });

      // Cast to any since distance is added dynamically
      const bostonEvent = result.events.find(e => e.city === 'Boston') as any;
      expect(bostonEvent).toBeDefined();
      expect(bostonEvent.distance).toBeGreaterThan(180);
      expect(bostonEvent.distance).toBeLessThan(200);
    });

    it('should calculate NYC to Chicago as approximately 713 miles', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      const geoEvents = [
        createGeoEvent('1', 'Chicago Event', 'Chicago', TEST_LOCATIONS.CHICAGO.lat, TEST_LOCATIONS.CHICAGO.lng),
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(geoEvents);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.searchNearby({
        lat: TEST_LOCATIONS.NYC.lat,
        lng: TEST_LOCATIONS.NYC.lng,
        radius: 800,
      });

      // Cast to any since distance is added dynamically
      const chicagoEvent = result.events.find(e => e.city === 'Chicago') as any;
      expect(chicagoEvent).toBeDefined();
      expect(chicagoEvent.distance).toBeGreaterThan(700);
      expect(chicagoEvent.distance).toBeLessThan(730);
    });

    it('should return 0 distance for same location', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      const geoEvents = [
        createGeoEvent('1', 'NYC Event', 'New York', TEST_LOCATIONS.NYC.lat, TEST_LOCATIONS.NYC.lng),
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(geoEvents);
      eventsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await eventsService.searchNearby({
        lat: TEST_LOCATIONS.NYC.lat,
        lng: TEST_LOCATIONS.NYC.lng,
        radius: 100,
      });

      // Cast to any since distance is added dynamically
      expect((result.events[0] as any).distance).toBe(0);
    });
  });
});
