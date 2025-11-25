import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for sending a new message
 */
export class SendMessageDto {
  @ApiProperty({
    description: 'ID of the user to send the message to',
    example: 'd0900e8f-5305-4476-a745-2ec57357c0c1',
  })
  @IsUUID()
  @IsNotEmpty()
  receiverId: string;

  @ApiProperty({
    description: 'Message text content',
    example: 'Hi! Is this ticket still available?',
    maxLength: 10000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, { message: 'Message cannot exceed 10,000 characters' })
  text: string;
}
