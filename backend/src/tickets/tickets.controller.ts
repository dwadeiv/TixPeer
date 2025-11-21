import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TicketStatus } from './entities/ticket.entity';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new ticket listing' })
  create(@Body() createTicketDto: any, @Request() req: any) {
    return this.ticketsService.create(createTicketDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all available tickets' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('status') status?: TicketStatus,
  ) {
    return this.ticketsService.findAll({ category, search, status });
  }

  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user tickets' })
  findMyTickets(@Request() req: any) {
    return this.ticketsService.findByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket' })
  update(@Param('id') id: string, @Body() updateTicketDto: any, @Request() req: any) {
    return this.ticketsService.update(id, updateTicketDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete ticket' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.ticketsService.remove(id, req.user.id);
  }
}
