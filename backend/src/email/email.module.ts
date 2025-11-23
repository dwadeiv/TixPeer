import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';

/**
 * Email Module
 * Provides email sending functionality across the application
 * Exports EmailService for use in auth, notifications, etc.
 */
@Module({
  imports: [ConfigModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
