import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';

/**
 * Messages REST API Controller
 *
 * Provides HTTP endpoints for:
 * - Retrieving conversations
 * - Retrieving message history
 * - Sending messages (also available via WebSocket)
 * - Searching messages
 * - Getting unread counts
 *
 * All endpoints require JWT authentication
 */
@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Get all conversations for the current user
   * Returns conversations sorted by most recent activity
   */
  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns array of conversations',
  })
  async getConversations(@Request() req: any) {
    return this.messagesService.getConversations(req.user.id);
  }

  /**
   * Get a specific conversation by ID
   */
  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns conversation details',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found or user not participant',
  })
  async getConversation(@Param('id') id: string, @Request() req: any) {
    return this.messagesService.getConversation(id, req.user.id);
  }

  /**
   * Get messages for a conversation or with a specific user
   * Supports pagination via limit and offset query params
   */
  @Get()
  @ApiOperation({
    summary: 'Get messages',
    description:
      'Get messages by conversationId or otherUserId. Supports pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns array of messages',
  })
  async getMessages(@Query() query: GetMessagesDto, @Request() req: any) {
    return this.messagesService.getMessages(query, req.user.id);
  }

  /**
   * Send a new message
   * Can also be done via WebSocket for real-time delivery
   */
  @Post()
  @ApiOperation({
    summary: 'Send a new message',
    description: 'Send a message via HTTP. For real-time, use WebSocket.',
  })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
  })
  async sendMessage(@Body() sendMessageDto: SendMessageDto, @Request() req: any) {
    return this.messagesService.sendMessage(
      req.user.id,
      sendMessageDto.receiverId,
      sendMessageDto.text,
    );
  }

  /**
   * Mark a conversation as read
   * Marks all unread messages in the conversation as read
   */
  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  @ApiResponse({
    status: 200,
    description: 'Messages marked as read',
  })
  async markConversationAsRead(@Param('id') conversationId: string, @Request() req: any) {
    return this.messagesService.markConversationAsRead(conversationId, req.user.id);
  }

  /**
   * Get total unread message count
   * Returns count of all unread messages across all conversations
   */
  @Get('unread/count')
  @ApiOperation({ summary: 'Get total unread message count' })
  @ApiResponse({
    status: 200,
    description: 'Returns total unread count',
  })
  async getUnreadCount(@Request() req: any) {
    const count = await this.messagesService.getUnreadCount(req.user.id);
    return { count };
  }

  /**
   * Search messages by text content
   * Searches only in user's conversations
   */
  @Get('search')
  @ApiOperation({ summary: 'Search messages by text' })
  @ApiResponse({
    status: 200,
    description: 'Returns matching messages',
  })
  async searchMessages(
    @Query('q') searchText: string,
    @Query('limit') limit: number = 50,
    @Request() req: any,
  ) {
    return this.messagesService.searchMessages(req.user.id, searchText, limit);
  }

  /**
   * Delete a message
   * Only the sender can delete their own messages
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
  })
  async deleteMessage(@Param('id') messageId: string, @Request() req: any) {
    await this.messagesService.deleteMessage(messageId, req.user.id);
    return { message: 'Message deleted successfully' };
  }
}
