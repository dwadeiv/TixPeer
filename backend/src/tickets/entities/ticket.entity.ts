import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum TicketStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  RESERVED = 'reserved',
  CANCELLED = 'cancelled',
}

export enum TicketCategory {
  CONCERT = 'concert',
  SPORTS = 'sports',
  THEATER = 'theater',
  COMEDY = 'comedy',
  FESTIVAL = 'festival',
  OTHER = 'other',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: TicketCategory,
    default: TicketCategory.OTHER,
  })
  category: TicketCategory;

  @Column()
  eventDate: Date;

  @Column()
  venue: string;

  @Column()
  location: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.AVAILABLE,
  })
  status: TicketStatus;

  @Column({ nullable: true })
  section: string;

  @Column({ nullable: true })
  row: string;

  @Column({ nullable: true })
  seat: string;

  @ManyToOne(() => User, (user) => user.ticketsForSale, { eager: true })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column()
  sellerId: string;

  @OneToMany(() => Transaction, (transaction) => transaction.ticket)
  transactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
