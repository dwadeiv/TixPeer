import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { TicketsService } from '../tickets/tickets.service';
import { TicketStatus } from '../tickets/entities/ticket.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private ticketsService: TicketsService,
  ) {}

  async create(createTransactionDto: any, buyerId: string): Promise<Transaction> {
    const ticket = await this.ticketsService.findOne(createTransactionDto.ticketId);

    if (ticket.status !== TicketStatus.AVAILABLE) {
      throw new BadRequestException('Ticket is not available for purchase');
    }

    if (ticket.quantity < (createTransactionDto.quantity || 1)) {
      throw new BadRequestException('Insufficient ticket quantity');
    }

    if (ticket.sellerId === buyerId) {
      throw new BadRequestException('You cannot purchase your own ticket');
    }

    const transaction = this.transactionsRepository.create({
      ticketId: createTransactionDto.ticketId,
      buyerId,
      sellerId: ticket.sellerId,
      amount: ticket.price * (createTransactionDto.quantity || 1),
      quantity: createTransactionDto.quantity || 1,
    });

    return this.transactionsRepository.save(transaction);
  }

  async findAll(): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      relations: ['ticket', 'buyer', 'seller'],
    });
  }

  async findByUser(userId: string): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      relations: ['ticket', 'buyer', 'seller'],
    });
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['ticket', 'buyer', 'seller'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async updateStatus(id: string, status: TransactionStatus): Promise<Transaction> {
    const transaction = await this.findOne(id);
    transaction.status = status;
    return this.transactionsRepository.save(transaction);
  }
}
