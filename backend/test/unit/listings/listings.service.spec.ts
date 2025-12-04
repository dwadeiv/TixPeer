/**
 * ListingsService Unit Tests
 *
 * Tests listing management logic including:
 * - Creating listings
 * - Retrieving listings (all, by ID, by event, by user)
 * - Updating listings
 * - Deleting listings
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ListingsService } from '../../../src/listings/listings.service';
import { Listing } from '../../../src/listings/entities/listing.entity';

describe('ListingsService', () => {
  let listingsService: ListingsService;
  let mockRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  // Mock data matching actual Listing entity structure
  const mockUser = {
    id: 'user-123',
    email: 'seller@example.com',
    name: 'Test Seller',
  };

  const mockEvent = {
    id: 'event-456',
    name: 'Test Concert',
    venue: 'Test Arena',
    date: '2025-06-15',
    location: 'Austin, TX',
    city: 'Austin',
    image: 'https://example.com/image.jpg',
    category: 'Music',
    activeListings: 5,
  };

  const mockListing = {
    id: 'listing-789',
    type: 'offer' as const,
    userId: 'user-123',
    eventId: 'event-456',
    eventName: 'Test Concert',
    eventDate: '2025-06-15',
    eventVenue: 'Test Arena',
    eventImage: 'https://example.com/image.jpg',
    ticketCount: 2,
    sectionInfo: 'Section A, Row 10',
    description: 'Great seats, selling due to conflict',
    lookingFor: 'Looking for Taylor Swift tickets',
    status: 'active' as const,
    user: mockUser,
    event: mockEvent,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createListingDto = {
    type: 'offer' as const,
    userId: 'user-123',
    eventId: 'event-456',
    eventName: 'Test Concert',
    eventDate: '2025-06-15',
    eventVenue: 'Test Arena',
    eventImage: 'https://example.com/image.jpg',
    ticketCount: 2,
    description: 'Test description',
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        {
          provide: getRepositoryToken(Listing),
          useValue: mockRepository,
        },
      ],
    }).compile();

    listingsService = module.get<ListingsService>(ListingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new listing', async () => {
      mockRepository.create.mockReturnValue(mockListing);
      mockRepository.save.mockResolvedValue(mockListing);

      const result = await listingsService.create(createListingDto as any);

      expect(mockRepository.create).toHaveBeenCalledWith(createListingDto);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockListing);
    });

    it('should include all DTO fields in created listing', async () => {
      const fullDto = {
        ...createListingDto,
        sectionInfo: 'Section B, Row 5',
        lookingFor: 'Looking for trade',
      };
      mockRepository.create.mockReturnValue({ ...mockListing, ...fullDto });
      mockRepository.save.mockImplementation((listing) => Promise.resolve(listing));

      const result = await listingsService.create(fullDto as any);

      expect(mockRepository.create).toHaveBeenCalledWith(fullDto);
      expect(result.sectionInfo).toBe('Section B, Row 5');
    });
  });

  describe('findAll', () => {
    it('should return all active listings with user and event relations', async () => {
      const mockListings = [mockListing, { ...mockListing, id: 'listing-999' }];
      mockRepository.find.mockResolvedValue(mockListings);

      const result = await listingsService.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['user', 'event'],
        where: { status: 'active' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockListings);
    });

    it('should return empty array when no listings exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await listingsService.findAll();

      expect(result).toEqual([]);
    });

    it('should only return active listings (not cancelled or completed)', async () => {
      mockRepository.find.mockResolvedValue([mockListing]);

      await listingsService.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a listing by ID with relations', async () => {
      mockRepository.findOne.mockResolvedValue(mockListing);

      const result = await listingsService.findOne('listing-789');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'listing-789' },
        relations: ['user', 'event'],
      });
      expect(result).toEqual(mockListing);
    });

    it('should return null when listing not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await listingsService.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEvent', () => {
    it('should return active listings for a specific event', async () => {
      const eventListings = [mockListing, { ...mockListing, id: 'listing-888' }];
      mockRepository.find.mockResolvedValue(eventListings);

      const result = await listingsService.findByEvent('event-456');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { eventId: 'event-456', status: 'active' },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(eventListings);
    });

    it('should return empty array when event has no listings', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await listingsService.findByEvent('event-no-listings');

      expect(result).toEqual([]);
    });
  });

  describe('findByUser', () => {
    it('should return active listings for a specific user', async () => {
      const userListings = [mockListing];
      mockRepository.find.mockResolvedValue(userListings);

      const result = await listingsService.findByUser('user-123');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-123', status: 'active' },
        relations: ['event'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(userListings);
    });

    it('should return empty array when user has no listings', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await listingsService.findByUser('user-no-listings');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update listing and return updated data', async () => {
      const updateData = { description: 'Updated description' };
      const updatedListing = { ...mockListing, ...updateData };
      mockRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      mockRepository.findOne.mockResolvedValue(updatedListing);

      const result = await listingsService.update('listing-789', updateData);

      expect(mockRepository.update).toHaveBeenCalledWith('listing-789', updateData);
      expect(result).toEqual(updatedListing);
    });

    it('should return null when listing to update not found', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });
      mockRepository.findOne.mockResolvedValue(null);

      const result = await listingsService.update('nonexistent', { description: 'test' });

      expect(result).toBeNull();
    });

    it('should allow updating status to completed or cancelled', async () => {
      const updateData = { status: 'completed' as const };
      mockRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      mockRepository.findOne.mockResolvedValue({ ...mockListing, status: 'completed' });

      const result = await listingsService.update('listing-789', updateData);

      expect(mockRepository.update).toHaveBeenCalledWith('listing-789', { status: 'completed' });
      expect(result?.status).toBe('completed');
    });
  });

  describe('remove', () => {
    it('should delete listing from database', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await listingsService.remove('listing-789');

      expect(mockRepository.delete).toHaveBeenCalledWith('listing-789');
    });

    it('should not throw when deleting non-existent listing', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      await expect(listingsService.remove('nonexistent')).resolves.not.toThrow();
    });
  });
});
