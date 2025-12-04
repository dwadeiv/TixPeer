/**
 * AuthService Unit Tests
 *
 * Tests authentication logic including:
 * - User validation (login)
 * - JWT token generation
 * - User registration
 * - Email verification flow
 * - Token validation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { AuthService } from '../../../src/auth/auth.service';
import { UsersService } from '../../../src/users/users.service';
import { EmailService } from '../../../src/email/email.service';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: {
    findByEmail: jest.Mock;
    validatePassword: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    findByVerificationToken: jest.Mock;
  };
  let mockJwtService: {
    sign: jest.Mock;
    verify: jest.Mock;
  };
  let mockEmailService: {
    sendVerificationEmail: jest.Mock;
    sendWelcomeEmail: jest.Mock;
  };

  // Mock user data
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword123',
    name: 'Test User',
    isEmailVerified: true,
    emailVerificationToken: undefined,
    emailVerificationTokenExpiry: undefined,
  };

  const mockUnverifiedUser = {
    ...mockUser,
    id: 'user-456',
    email: 'unverified@example.com',
    isEmailVerified: false,
    emailVerificationToken: 'valid-token-123',
    emailVerificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      validatePassword: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findByVerificationToken: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    mockEmailService = {
      sendVerificationEmail: jest.fn(),
      sendWelcomeEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      const result = await authService.validateUser('test@example.com', 'validPassword');

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(mockUser.email);
      expect(result.name).toBe(mockUser.name);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUsersService.validatePassword).toHaveBeenCalledWith(mockUser, 'validPassword');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(authService.validateUser('nonexistent@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);

      await expect(authService.validateUser('test@example.com', 'wrongPassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when email is not verified', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUnverifiedUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      await expect(authService.validateUser('unverified@example.com', 'validPassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const mockToken = 'jwt-token-123';
      mockJwtService.sign.mockReturnValue(mockToken);

      const userWithoutPassword = { id: mockUser.id, email: mockUser.email, name: mockUser.name };
      const result = await authService.login(userWithoutPassword);

      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
      });
    });
  });

  describe('register', () => {
    const newUserEmail = 'newuser@example.com';
    const newUserPassword = 'SecurePassword123!';
    const newUserName = 'New User';

    it('should create user, send verification email, and return login response', async () => {
      const createdUser = { ...mockUnverifiedUser, email: newUserEmail, name: newUserName };
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(createdUser);
      mockUsersService.update.mockResolvedValue(undefined);
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);
      mockJwtService.sign.mockReturnValue('new-user-token');

      const result = await authService.register(newUserEmail, newUserPassword, newUserName);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(newUserEmail);
      expect(mockUsersService.create).toHaveBeenCalledWith(newUserEmail, newUserPassword, newUserName);
      expect(mockUsersService.update).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(newUserEmail, expect.any(String));
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.register(mockUser.email, newUserPassword, newUserName)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and send welcome email when token is valid', async () => {
      mockUsersService.findByVerificationToken.mockResolvedValue(mockUnverifiedUser);
      mockUsersService.update.mockResolvedValue(undefined);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await authService.verifyEmail('valid-token-123');

      expect(result).toEqual({ message: 'Email verified successfully!' });
      expect(mockUsersService.update).toHaveBeenCalledWith(mockUnverifiedUser.id, {
        isEmailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationTokenExpiry: undefined,
      });
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(mockUnverifiedUser.email, mockUnverifiedUser.name);
    });

    it('should throw BadRequestException when token is invalid', async () => {
      mockUsersService.findByVerificationToken.mockResolvedValue(null);

      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when token has expired', async () => {
      const expiredUser = {
        ...mockUnverifiedUser,
        emailVerificationTokenExpiry: new Date(Date.now() - 60 * 60 * 1000),
      };
      mockUsersService.findByVerificationToken.mockResolvedValue(expiredUser);

      await expect(authService.verifyEmail('expired-token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email when user exists and email not verified', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUnverifiedUser);
      mockUsersService.update.mockResolvedValue(undefined);
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await authService.resendVerificationEmail(mockUnverifiedUser.email);

      expect(result).toEqual({ message: 'Verification email sent!' });
      expect(mockUsersService.update).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(mockUnverifiedUser.email, expect.any(String));
    });

    it('should throw BadRequestException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(authService.resendVerificationEmail('nonexistent@example.com')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when email is already verified', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.resendVerificationEmail(mockUser.email)).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateToken', () => {
    it('should return payload when token is valid', async () => {
      const mockPayload = { email: mockUser.email, sub: mockUser.id };
      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = await authService.validateToken('valid-jwt-token');

      expect(result).toEqual(mockPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-jwt-token');
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await expect(authService.validateToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
