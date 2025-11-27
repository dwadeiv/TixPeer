import { IsOptional, IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for querying message history
 * Supports pagination and filtering by conversation
 */
export class GetMessagesDto {
  @ApiPropertyOptional({
    description: 'Filter by conversation ID',
    example: 'd0900e8f-5305-4476-a745-2ec57357c0c1',
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiPropertyOptional({
    description: 'Filter by other user ID (finds or creates conversation)',
    example: 'd0900e8f-5305-4476-a745-2ec57357c0c1',
  })
  @IsOptional()
  @IsUUID()
  otherUserId?: string;

  @ApiPropertyOptional({
    description: 'Number of messages to return',
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Offset for pagination',
    example: 0,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
