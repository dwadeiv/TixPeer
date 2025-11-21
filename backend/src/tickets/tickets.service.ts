import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
  ) {}

  async create(createTicketDto: any, sellerId: string): Promise<Ticket> {
    const ticket = this.ticketsRepository.create({
      ...createTicketDto,
      sellerId,
    } as any);
    return this.ticketsRepository.save(ticket) as unknown as Promise<Ticket>;
  }

  async findAll(filters?: {
    category?: string;
    search?: string;
    status?: TicketStatus;
  }): Promise<Ticket[]> {
    const queryBuilder = this.ticketsRepository.createQueryBuilder('ticket');

    if (filters?.category) {
      queryBuilder.andWhere('ticket.category = :category', { category: filters.category });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(ticket.title ILIKE :search OR ticket.description ILIKE :search OR ticket.venue ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.status) {
      queryBuilder.andWhere('ticket.status = :status', { status: filters.status });
    } else {
      queryBuilder.andWhere('ticket.status = :status', { status: TicketStatus.AVAILABLE });
    }

    return queryBuilder.leftJoinAndSelect('ticket.seller', 'seller').getMany();
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['seller'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async findByUser(userId: string): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      where: { sellerId: userId },
      relations: ['seller'],
    });
  }

  async update(id: string, updateTicketDto: any, userId: string): Promise<Ticket> {
    const ticket = await this.findOne(id);

    if (ticket.sellerId !== userId) {
      throw new ForbiddenException('You can only update your own tickets');
    }

    Object.assign(ticket, updateTicketDto);
    return this.ticketsRepository.save(ticket);
  }

  async remove(id: string, userId: string): Promise<void> {
    const ticket = await this.findOne(id);

    if (ticket.sellerId !== userId) {
      throw new ForbiddenException('You can only delete your own tickets');
    }

    await this.ticketsRepository.delete(id);
  }
}
