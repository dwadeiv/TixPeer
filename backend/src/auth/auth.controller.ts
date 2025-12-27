import { Controller, Post, Body, UseGuards, Request, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Stricter rate limit for registration: 5 requests per 60 seconds
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(
    @Body() registerDto: { email: string; password: string; name: string },
  ) {
    return this.authService.register(registerDto.email, registerDto.password, registerDto.name);
  }

  // Stricter rate limit for login: 5 requests per 60 seconds (prevents brute-force)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  /**
   * Verify email using token sent via email
   * GET /auth/verify-email?token=xxx
   */
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address with token' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  /**
   * Resend verification email
   * POST /auth/resend-verification
   */
  // Stricter rate limit: 5 requests per 60 seconds (prevents email spam)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  async resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerificationEmail(body.email);
  }
}
