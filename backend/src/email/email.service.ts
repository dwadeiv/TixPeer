import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

/**
 * Email Service
 * Handles sending emails for verification, notifications, etc.
 *
 * Uses SendGrid for email delivery
 * Falls back to console logging if SENDGRID_API_KEY is not configured
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private sendGridConfigured = false;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');

    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.sendGridConfigured = true;
      this.logger.log('SendGrid email service initialized');
    } else {
      this.logger.warn('SENDGRID_API_KEY not found - emails will be logged to console');
    }

    // Configure the "from" email address
    this.fromEmail = this.configService.get<string>('FROM_EMAIL') || 'noreply@tixpeer.com';
  }

  /**
   * Sends email verification link to user
   * Uses SendGrid if configured, otherwise logs to console
   */
  async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    // If SendGrid is configured, send real email
    if (this.sendGridConfigured) {
      try {
        await sgMail.send({
          to: email,
          from: this.fromEmail,
          subject: 'Verify your TixPeer account',
          html: this.getVerificationEmailTemplate(verificationUrl),
        });

        this.logger.log(`Verification email sent to ${email}`);
      } catch (error) {
        this.logger.error('Error sending verification email via SendGrid', error);
        throw new Error('Failed to send verification email');
      }
    } else {
      // Fallback to console logging for development
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
    }
  }

  /**
   * Sends welcome email after email verification
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    if (this.sendGridConfigured) {
      try {
        await sgMail.send({
          to: email,
          from: this.fromEmail,
          subject: `Welcome to TixPeer, ${name}!`,
          html: this.getWelcomeEmailTemplate(name),
        });

        this.logger.log(`Welcome email sent to ${email}`);
      } catch (error) {
        this.logger.error('Error sending welcome email via SendGrid', error);
        // Don't throw error for welcome email failure
      }
    } else {
      // Fallback to console logging
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
  }

  /**
   * Welcome email template
   */
  private getWelcomeEmailTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
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
            <div class="header">
              <h1>Welcome to TixPeer! 🎉</h1>
            </div>
            <p>Hi ${name},</p>
            <p>Your email has been verified! You're all set to start using TixPeer.</p>
            <p>TixPeer is your peer-to-peer ticket marketplace where you can:</p>
            <ul>
              <li>Buy tickets directly from other fans</li>
              <li>Sell your spare tickets safely</li>
              <li>Browse upcoming events</li>
            </ul>
            <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}" class="button">Get Started</a>
            <div class="footer">
              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Email template for verification
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
