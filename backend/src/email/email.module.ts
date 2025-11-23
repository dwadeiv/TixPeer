import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

/**
 * Email Module
 * Provides email sending functionality across the application
 * Exports EmailService for use in auth, notifications, etc.
 */
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
