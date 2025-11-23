import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(user, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email address before logging in. Check your inbox for the verification link.');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async register(email: string, password: string, name: string) {
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Create user account
    const user = await this.usersService.create(email, password, name);

    // Generate email verification token
    const verificationToken = this.generateVerificationToken();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hour expiry

    // Save verification token to user
    await this.usersService.update(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiry: tokenExpiry,
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(email, verificationToken);

    const { password: _, ...result } = user;
    return this.login(result);
  }

  /**
   * Verifies user's email address using the token sent via email
   */
  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Check if token has expired
    if (user.emailVerificationTokenExpiry < new Date()) {
      throw new BadRequestException('Verification token has expired. Please request a new one.');
    }

    // Mark email as verified and clear token
    await this.usersService.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationTokenExpiry: undefined,
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name);

    return { message: 'Email verified successfully!' };
  }

  /**
   * Resends verification email to user
   */
  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = this.generateVerificationToken();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);

    // Update user with new token
    await this.usersService.update(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiry: tokenExpiry,
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(email, verificationToken);

    return { message: 'Verification email sent!' };
  }

  /**
   * Generates a secure random token for email verification
   */
  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
