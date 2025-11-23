import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  // Profile fields
  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 0 })
  trustScore: number;

  @Column({ default: 0 })
  completedTrades: number;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'simple-array', nullable: true })
  favoriteEvents: string[];

  @Column({ type: 'simple-array', nullable: true })
  badges: string[];

  @Column({ nullable: true })
  responseTime: string;

  @Column({ default: false })
  verifiedUser: boolean;

  @OneToMany(() => Ticket, (ticket) => ticket.seller)
  ticketsForSale: Ticket[];

  @OneToMany(() => Transaction, (transaction) => transaction.buyer)
  purchases: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.seller)
  sales: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
