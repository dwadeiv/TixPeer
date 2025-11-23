import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: 'offer' | 'request';

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  eventId: string;

  @Column()
  eventName: string;

  @Column()
  eventDate: string;

  @Column()
  eventVenue: string;

  @Column()
  eventImage: string;

  @Column()
  ticketCount: number;

  @Column({ nullable: true })
  sectionInfo: string;

  @Column('text')
  description: string;

  @Column({ nullable: true, type: 'text' })
  lookingFor: string;

  @Column({ default: 'active' })
  status: 'active' | 'completed' | 'cancelled';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
