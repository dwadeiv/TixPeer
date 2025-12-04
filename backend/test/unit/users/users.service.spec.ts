/**
 * UsersService Unit Tests
 *
 * Tests user management logic including:
 * - User creation with password hashing
 * - User retrieval (findOne, findAll, findByEmail)
 * - User updates
 * - User deletion
 * - Password validation
 * - Online status updates
 * - Response rate tracking
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../../../src/users/users.service';
import { User } from '../../../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let usersService: UsersService;
  let mockRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
    increment: jest.Mock;
  };

  // Mock user data - using undefined instead of null for optional fields
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword123',
    name: 'Test User',
    isEmailVerified: true,
    emailVerificationToken: undefined as string | undefined,
    emailVerificationTokenExpiry: undefined as Date | undefined,
    isOnline: false,
    lastSeen: new Date(),
    responseRate: 100,
    conversationsReceived: 0,
    conversationsReplied: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      increment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const email = 'newuser@example.com';
      const password = 'PlainPassword123!';
      const name = 'New User';
      const hashedPassword = 'hashedPassword456';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.create.mockReturnValue({ email, password: hashedPassword, name });
      mockRepository.save.mockResolvedValue({ ...mockUser, email, password: hashedPassword, name });

      const result = await usersService.create(email, password, name);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        email,
        password: hashedPassword,
        name,
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.email).toBe(email);
      expect(result.name).toBe(name);
    });
  });

  describe('findAll', () => {
    it('should return an array of all users', async () => {
      const mockUsers = [mockUser, { ...mockUser, id: 'user-456' }];
      mockRepository.find.mockResolvedValue(mockUsers);

      const result = await usersService.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await usersService.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await usersService.findOne('user-123');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'user-123' } });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(usersService.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await usersService.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });

    it('should return null when user not found by email', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await usersService.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByVerificationToken', () => {
    it('should return user when found by verification token', async () => {
      const userWithToken = { ...mockUser, emailVerificationToken: 'valid-token' };
      mockRepository.findOne.mockResolvedValue(userWithToken);

      const result = await usersService.findByVerificationToken('valid-token');

      expect(result).toEqual(userWithToken);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { emailVerificationToken: 'valid-token' } });
    });

    it('should return null when token not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await usersService.findByVerificationToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user and return updated user', async () => {
      const updateData = { name: 'Updated Name', isEmailVerified: true };
      const updatedUser = { ...mockUser, ...updateData };
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await usersService.update('user-123', updateData);

      expect(result.name).toBe('Updated Name');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user to update not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(usersService.update('nonexistent-id', { name: 'New Name' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await expect(usersService.remove('user-123')).resolves.not.toThrow();
      expect(mockRepository.delete).toHaveBeenCalledWith('user-123');
    });

    it('should throw NotFoundException when user to delete not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      await expect(usersService.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validatePassword', () => {
    it('should return true when password matches', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await usersService.validatePassword(mockUser as User, 'correctPassword');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', mockUser.password);
    });

    it('should return false when password does not match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await usersService.validatePassword(mockUser as User, 'wrongPassword');

      expect(result).toBe(false);
    });
  });

  describe('updateOnlineStatus', () => {
    it('should update online status and lastSeen timestamp', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await usersService.updateOnlineStatus('user-123', true);

      expect(mockRepository.update).toHaveBeenCalledWith('user-123', {
        isOnline: true,
        lastSeen: expect.any(Date),
      });
    });
  });

  describe('incrementConversationsReceived', () => {
    it('should increment conversations received and recalculate response rate', async () => {
      mockRepository.increment.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      mockRepository.findOne.mockResolvedValue({
        ...mockUser,
        conversationsReceived: 1,
        conversationsReplied: 0,
      });
      mockRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await usersService.incrementConversationsReceived('user-123');

      expect(mockRepository.increment).toHaveBeenCalledWith(
        { id: 'user-123' },
        'conversationsReceived',
        1,
      );
    });
  });

  describe('recalculateResponseRate', () => {
    it('should calculate response rate as (replied / received) * 100', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 'user-123',
        conversationsReceived: 10,
        conversationsReplied: 8,
      });
      mockRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await usersService.recalculateResponseRate('user-123');

      expect(mockRepository.update).toHaveBeenCalledWith('user-123', { responseRate: 80 });
    });

    it('should default to 100% when no conversations received', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 'user-123',
        conversationsReceived: 0,
        conversationsReplied: 0,
      });
      mockRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await usersService.recalculateResponseRate('user-123');

      expect(mockRepository.update).toHaveBeenCalledWith('user-123', { responseRate: 100 });
    });

    it('should cap response rate at 100%', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 'user-123',
        conversationsReceived: 5,
        conversationsReplied: 10,
      });
      mockRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await usersService.recalculateResponseRate('user-123');

      expect(mockRepository.update).toHaveBeenCalledWith('user-123', { responseRate: 100 });
    });

    it('should do nothing if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await usersService.recalculateResponseRate('nonexistent-id');

      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('getResponseRate', () => {
    it('should return user response rate', async () => {
      mockRepository.findOne.mockResolvedValue({
        responseRate: 85.5,
      });

      const result = await usersService.getResponseRate('user-123');

      expect(result).toBe(85.5);
    });

    it('should return 100 when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await usersService.getResponseRate('nonexistent-id');

      expect(result).toBe(100);
    });
  });
});
