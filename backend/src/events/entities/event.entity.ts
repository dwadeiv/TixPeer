import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('events')
export class Event {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  date: string;

  @Column()
  venue: string;

  @Column()
  location: string;

  @Column()
  city: string;

  @Column()
  image: string;

  @Column()
  category: string;

  @Column({ default: 0 })
  activeListings: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
