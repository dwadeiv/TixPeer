import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Header,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { Listing } from './entities/listing.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  /**
   * Create a new listing
   * Authenticated endpoint - extracts userId from JWT token
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new listing' })
  create(@Body() createListingDto: CreateListingDto, @Request() req: any): Promise<Listing> {
    // Extract userId from JWT token and add to DTO
    // Convert to string to ensure it passes DTO validation
    const listingData = {
      ...createListingDto,
      userId: String(req.user.id),
    };
    return this.listingsService.create(listingData);
  }

  /**
   * Get all listings endpoint
   *
   * Cache Strategy:
   * - Public cache for 30 seconds (active marketplace with frequent updates)
   * - stale-while-revalidate=300 for better UX when listings change
   * - Balances marketplace freshness with performance
   */
  @Get()
  @ApiOperation({ summary: 'Get all listings' })
  @ApiQuery({ name: 'eventId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')
  findAll(
    @Query('eventId') eventId?: string,
    @Query('userId') userId?: string,
  ): Promise<Listing[]> {
    if (eventId) {
      return this.listingsService.findByEvent(eventId);
    }
    if (userId) {
      return this.listingsService.findByUser(userId);
    }
    return this.listingsService.findAll();
  }

  /**
   * Get single listing endpoint
   *
   * Cache Strategy:
   * - Public cache for 30 seconds (listing details may change as users interact)
   * - stale-while-revalidate=300 for better UX
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get listing by ID' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')
  findOne(@Param('id') id: string): Promise<Listing | null> {
    return this.listingsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a listing' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  update(
    @Param('id') id: string,
    @Body() updateData: Partial<Listing>,
  ): Promise<Listing | null> {
    return this.listingsService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a listing' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  remove(@Param('id') id: string): Promise<void> {
    return this.listingsService.remove(id);
  }
}
