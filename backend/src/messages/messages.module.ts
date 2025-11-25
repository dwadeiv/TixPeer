import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { UsersModule } from '../users/users.module';

/**
 * Messages Module
 *
 * Provides real-time messaging functionality:
 * - WebSocket gateway for real-time message delivery
 * - REST API for message history and conversations
 * - Message and conversation entities
 *
 * Features:
 * - Peer-to-peer messaging
 * - Typing indicators
 * - Read receipts
 * - Online status tracking
 * - Message search
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Conversation]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    UsersModule, // Import UsersModule to access UsersService
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService],
})
export class MessagesModule {}
