import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  findAll(): Promise<Event[]> {
    return this.eventsRepository.find({
      order: { date: 'ASC' },
    });
  }

  findOne(id: string): Promise<Event | null> {
    return this.eventsRepository.findOne({ where: { id } });
  }

  findByCity(city: string): Promise<Event[]> {
    return this.eventsRepository.find({
      where: { city },
      order: { date: 'ASC' },
    });
  }

  findByCategory(category: string): Promise<Event[]> {
    return this.eventsRepository.find({
      where: { category },
      order: { date: 'ASC' },
    });
  }
}
