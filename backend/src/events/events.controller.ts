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
   * Cache-Control header prevents browser/proxy caching to ensure users always see fresh event data
   * This is critical for marketplace freshness - new events should appear immediately for all users
   */
  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'category', required: false })
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
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
   * No caching to ensure event details (especially listing counts) stay fresh
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  findOne(@Param('id') id: string): Promise<Event | null> {
    return this.eventsService.findOne(id);
  }
}
