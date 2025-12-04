/**
 * AuthController Integration Tests
 *
 * Tests the full HTTP request/response cycle for authentication endpoints:
 * - POST /auth/register - User registration
 * - POST /auth/login - User login
 * - GET /auth/verify-email - Email verification
 * - POST /auth/resend-verification - Resend verification email
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { LocalAuthGuard } from '../../../src/auth/guards/local-auth.guard';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let mockAuthService: {
    register: jest.Mock;
    login: jest.Mock;
    verifyEmail: jest.Mock;
    resendVerificationEmail: jest.Mock;
    validateUser: jest.Mock;
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockLoginResponse = {
    access_token: 'jwt-token-123',
    user: mockUser,
  };

  beforeAll(async () => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      validateUser: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          // Simulate successful authentication by setting user on request
          req.user = mockUser;
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

  describe('POST /auth/register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      name: 'New User',
    };

    it('should register a new user and return access token', async () => {
      mockAuthService.register.mockResolvedValue(mockLoginResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toEqual(mockLoginResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.name,
      );
    });

    it('should return 409 when email already exists', async () => {
      mockAuthService.register.mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);

      expect(response.body.message).toBe('Email already registered');
    });

    it('should handle registration with missing email', async () => {
      // Note: Auth controller doesn't use class-validator DTOs, so validation
      // depends on service-level checks. This test verifies the request is handled.
      mockAuthService.register.mockRejectedValue(
        new BadRequestException('Email is required'),
      );

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ password: 'test123', name: 'Test' })
        .expect(400);

      expect(response.body.message).toBe('Email is required');
    });

    it('should handle registration with missing password', async () => {
      mockAuthService.register.mockRejectedValue(
        new BadRequestException('Password is required'),
      );

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@test.com', name: 'Test' })
        .expect(400);

      expect(response.body.message).toBe('Password is required');
    });
  });

  describe('POST /auth/login', () => {
    it('should login user and return access token', async () => {
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(201);

      expect(response.body).toEqual(mockLoginResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should call login with authenticated user from guard', async () => {
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(201);

      // The login method should be called with the user object set by the guard
      expect(mockAuthService.login).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
        }),
      );
    });
  });

  describe('GET /auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      mockAuthService.verifyEmail.mockResolvedValue({
        message: 'Email verified successfully!',
      });

      const response = await request(app.getHttpServer())
        .get('/auth/verify-email')
        .query({ token: 'valid-token-123' })
        .expect(200);

      expect(response.body.message).toBe('Email verified successfully!');
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('valid-token-123');
    });

    it('should return 400 for invalid token', async () => {
      mockAuthService.verifyEmail.mockRejectedValue(
        new BadRequestException('Invalid or expired verification token'),
      );

      const response = await request(app.getHttpServer())
        .get('/auth/verify-email')
        .query({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.message).toBe('Invalid or expired verification token');
    });

    it('should return 400 for expired token', async () => {
      mockAuthService.verifyEmail.mockRejectedValue(
        new BadRequestException('Verification token has expired'),
      );

      const response = await request(app.getHttpServer())
        .get('/auth/verify-email')
        .query({ token: 'expired-token' })
        .expect(400);

      expect(response.body.message).toBe('Verification token has expired');
    });
  });

  describe('POST /auth/resend-verification', () => {
    it('should resend verification email', async () => {
      mockAuthService.resendVerificationEmail.mockResolvedValue({
        message: 'Verification email sent!',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/resend-verification')
        .send({ email: 'unverified@example.com' })
        .expect(201);

      expect(response.body.message).toBe('Verification email sent!');
      expect(mockAuthService.resendVerificationEmail).toHaveBeenCalledWith('unverified@example.com');
    });

    it('should return 400 when user not found', async () => {
      mockAuthService.resendVerificationEmail.mockRejectedValue(
        new BadRequestException('User not found'),
      );

      const response = await request(app.getHttpServer())
        .post('/auth/resend-verification')
        .send({ email: 'nonexistent@example.com' })
        .expect(400);

      expect(response.body.message).toBe('User not found');
    });

    it('should return 400 when email already verified', async () => {
      mockAuthService.resendVerificationEmail.mockRejectedValue(
        new BadRequestException('Email is already verified'),
      );

      const response = await request(app.getHttpServer())
        .post('/auth/resend-verification')
        .send({ email: 'verified@example.com' })
        .expect(400);

      expect(response.body.message).toBe('Email is already verified');
    });
  });
});
