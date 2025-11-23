import { Injectable, Logger } from '@nestjs/common';

/**
 * Email Service
 * Handles sending emails for verification, notifications, etc.
 *
 * Development: Logs emails to console
 * Production: Can be configured to use SendGrid, AWS SES, or other providers
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /**
   * Sends email verification link to user
   * In development: Logs to console
   * In production: Would send via email provider
   */
  async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
    // Construct verification URL
    // In production, use actual domain from environment variables
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    // Development: Log to console instead of sending email
    this.logger.log('========================================');
    this.logger.log('EMAIL VERIFICATION');
    this.logger.log('========================================');
    this.logger.log(`To: ${email}`);
    this.logger.log(`Subject: Verify your TixPeer account`);
    this.logger.log('');
    this.logger.log('Click the link below to verify your email address:');
    this.logger.log(verificationUrl);
    this.logger.log('');
    this.logger.log('This link will expire in 24 hours.');
    this.logger.log('========================================');

    // TODO: Production implementation
    // For production, replace console logging with actual email sending:
    //
    // Example with SendGrid:
    // await this.sendGridService.send({
    //   to: email,
    //   from: 'noreply@tixpeer.com',
    //   subject: 'Verify your TixPeer account',
    //   html: this.getVerificationEmailTemplate(verificationUrl),
    // });
  }

  /**
   * Sends welcome email after email verification
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    this.logger.log('========================================');
    this.logger.log('WELCOME EMAIL');
    this.logger.log('========================================');
    this.logger.log(`To: ${email}`);
    this.logger.log(`Subject: Welcome to TixPeer, ${name}!`);
    this.logger.log('');
    this.logger.log(`Hi ${name},`);
    this.logger.log('');
    this.logger.log('Welcome to TixPeer! Your email has been verified.');
    this.logger.log('You can now start buying and selling tickets.');
    this.logger.log('========================================');
  }

  /**
   * Email template for verification (to be used with real email provider)
   */
  private getVerificationEmailTemplate(verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: linear-gradient(to bottom right, #9333ea, #ec4899);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
            }
            .footer { margin-top: 40px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Verify your TixPeer account</h1>
            <p>Thank you for signing up! Please verify your email address to get started.</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${verificationUrl}</p>
            <div class="footer">
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create a TixPeer account, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
