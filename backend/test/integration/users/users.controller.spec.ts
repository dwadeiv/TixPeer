/**
 * UsersController Integration Tests
 *
 * Tests the full HTTP request/response cycle for user endpoints:
 * - GET /users - Get all users
 * - GET /users/profile - Get current user profile (authenticated)
 * - GET /users/:id - Get user by ID
 * - PATCH /users/profile - Update current user profile (authenticated)
 * - POST /users/profile/avatar - Upload avatar (authenticated)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UsersController } from '../../../src/users/users.controller';
import { UsersService } from '../../../src/users/users.service';
import { CloudinaryService } from '../../../src/common/services/cloudinary.service';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';
import { NotFoundException } from '@nestjs/common';

describe('UsersController (Integration)', () => {
  let app: INestApplication;
  let mockUsersService: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };
  let mockCloudinaryService: {
    uploadImage: jest.Mock;
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    isEmailVerified: true,
    avatar: null,
    responseRate: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockUsers = [
    mockUser,
    {
      id: 'user-456',
      email: 'user2@example.com',
      name: 'User Two',
      isEmailVerified: true,
      avatar: null,
      responseRate: 95,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeAll(async () => {
    mockUsersService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    mockCloudinaryService = {
      uploadImage: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          // Simulate authenticated user
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

  describe('GET /users', () => {
    it('should return all users', async () => {
      mockUsersService.findAll.mockResolvedValue(mockUsers);

      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(response.body).toEqual(mockUsers);
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no users', async () => {
      mockUsersService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /users/profile', () => {
    it('should return current user profile when authenticated', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .expect(200);

      expect(response.body).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-123');
    });

    it('should return 404 when user not found', async () => {
      mockUsersService.findOne.mockRejectedValue(
        new NotFoundException('User with ID user-123 not found'),
      );

      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .expect(404);

      expect(response.body.message).toBe('User with ID user-123 not found');
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by ID', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .get('/users/user-123')
        .expect(200);

      expect(response.body).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-123');
    });

    it('should return 404 when user not found', async () => {
      mockUsersService.findOne.mockRejectedValue(
        new NotFoundException('User with ID nonexistent not found'),
      );

      const response = await request(app.getHttpServer())
        .get('/users/nonexistent')
        .expect(404);

      expect(response.body.message).toBe('User with ID nonexistent not found');
    });
  });

  describe('PATCH /users/profile', () => {
    it('should update current user profile', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const response = await request(app.getHttpServer())
        .patch('/users/profile')
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(mockUsersService.update).toHaveBeenCalledWith('user-123', updateData);
    });

    it('should update multiple fields', async () => {
      const updateData = { name: 'New Name', phone: '+1234567890' };
      const updatedUser = { ...mockUser, ...updateData };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const response = await request(app.getHttpServer())
        .patch('/users/profile')
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('New Name');
      expect(response.body.phone).toBe('+1234567890');
    });
  });

  describe('POST /users/profile/avatar', () => {
    it('should upload avatar and return URL', async () => {
      const cloudinaryResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/avatar.jpg',
      };
      const updatedUser = {
        ...mockUser,
        avatar: cloudinaryResult.secure_url,
      };

      mockCloudinaryService.uploadImage.mockResolvedValue(cloudinaryResult);
      mockUsersService.update.mockResolvedValue(updatedUser);

      const response = await request(app.getHttpServer())
        .post('/users/profile/avatar')
        .attach('avatar', Buffer.from('fake-image-data'), {
          filename: 'avatar.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(response.body.message).toBe('Avatar uploaded successfully to Cloudinary');
      expect(response.body.avatar).toBe(cloudinaryResult.secure_url);
      expect(mockCloudinaryService.uploadImage).toHaveBeenCalled();
      expect(mockUsersService.update).toHaveBeenCalledWith('user-123', {
        avatar: cloudinaryResult.secure_url,
      });
    });

    it('should return 400 when no file uploaded', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/profile/avatar')
        .expect(400);

      expect(response.body.message).toBe('No file uploaded');
    });
  });
});
