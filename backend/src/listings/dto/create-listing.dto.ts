import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateListingDto {
  @ApiProperty({ enum: ['offer', 'request'] })
  @IsEnum(['offer', 'request'])
  type: 'offer' | 'request';

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  eventId: string;

  @ApiProperty()
  @IsString()
  eventName: string;

  @ApiProperty()
  @IsString()
  eventDate: string;

  @ApiProperty()
  @IsString()
  eventVenue: string;

  @ApiProperty()
  @IsString()
  eventImage: string;

  @ApiProperty()
  @IsNumber()
  ticketCount: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sectionInfo?: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lookingFor?: string;
}
