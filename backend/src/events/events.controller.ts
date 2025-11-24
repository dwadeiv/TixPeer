import { Controller, Get, Param, Query, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Get all events endpoint
   *
   * Cache Strategy:
   * - Public cache for 60 seconds (events don't change frequently)
   * - stale-while-revalidate=300 allows serving stale cache while fetching fresh data
   * - Balances performance with data freshness for marketplace
   */
  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'category', required: false })
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  findAll(
    @Query('city') city?: string,
    @Query('category') category?: string,
  ): Promise<Event[]> {
    if (city) {
      return this.eventsService.findByCity(city);
    }
    if (category) {
      return this.eventsService.findByCategory(category);
    }
    return this.eventsService.findAll();
  }

  /**
   * Get single event endpoint
   *
   * Cache Strategy:
   * - Public cache for 30 seconds (listing counts may change more frequently)
   * - stale-while-revalidate=300 for better UX
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')
  findOne(@Param('id') id: string): Promise<Event | null> {
    return this.eventsService.findOne(id);
  }
}
