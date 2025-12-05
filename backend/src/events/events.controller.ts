import { Controller, Get, Param, Query, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Search events with optional location-based filtering
   *
   * Supports:
   * - Text search by event name
   * - Location-based search with radius (lat/lng/radius)
   * - City-based filtering
   * - Category filtering
   *
   * When location is provided:
   * - Returns events within the specified radius (default 100 miles)
   * - Results sorted by distance
   *
   * Cache Strategy:
   * - Public cache for 60 seconds (events don't change frequently)
   * - stale-while-revalidate=300 allows serving stale cache while fetching fresh data
   */
  @Get()
  @ApiOperation({ summary: 'Search events with optional location filtering' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query for event name' })
  @ApiQuery({ name: 'lat', required: false, description: 'Latitude for location-based search' })
  @ApiQuery({ name: 'lng', required: false, description: 'Longitude for location-based search' })
  @ApiQuery({ name: 'radius', required: false, description: 'Search radius in miles (default: 100)' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city name' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  async findAll(
    @Query('q') searchQuery?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
    @Query('city') city?: string,
    @Query('category') category?: string,
  ): Promise<{ events: Event[]; searchedNearby: boolean; locationName?: string }> {
    // Parse location parameters
    const latNum = lat ? parseFloat(lat) : undefined;
    const lngNum = lng ? parseFloat(lng) : undefined;
    const radiusNum = radius ? parseFloat(radius) : 100; // Default 100 miles

    // If location is provided, use geo-search
    if (latNum !== undefined && lngNum !== undefined) {
      return this.eventsService.searchNearby({
        lat: latNum,
        lng: lngNum,
        radius: radiusNum,
        searchQuery,
        category,
      });
    }

    // Fallback to existing methods for non-geo queries
    let events: Event[];
    if (city) {
      events = await this.eventsService.findByCity(city);
    } else if (category) {
      events = await this.eventsService.findByCategory(category);
    } else if (searchQuery) {
      events = await this.eventsService.searchByName(searchQuery);
    } else {
      events = await this.eventsService.findAll();
    }

    return { events, searchedNearby: false };
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
