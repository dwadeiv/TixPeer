/**
 * Health Check Controller
 *
 * Provides a simple health endpoint for load balancers and monitoring.
 * Exempt from rate limiting to ensure availability checks always work.
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @SkipThrottle({ default: true })
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  check() {
    return { status: 'ok' };
  }
}
