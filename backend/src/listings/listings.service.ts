import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from './entities/listing.entity';
import { CreateListingDto } from './dto/create-listing.dto';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
  ) {}

  create(createListingDto: CreateListingDto): Promise<Listing> {
    const listing = this.listingsRepository.create(createListingDto);
    return this.listingsRepository.save(listing);
  }

  findAll(): Promise<Listing[]> {
    return this.listingsRepository.find({
      relations: ['user', 'event'],
      where: { status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  findOne(id: string): Promise<Listing | null> {
    return this.listingsRepository.findOne({
      where: { id },
      relations: ['user', 'event'],
    });
  }

  findByEvent(eventId: string): Promise<Listing[]> {
    return this.listingsRepository.find({
      where: { eventId, status: 'active' },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  findByUser(userId: string): Promise<Listing[]> {
    return this.listingsRepository.find({
      where: { userId, status: 'active' },
      relations: ['event'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateData: Partial<Listing>): Promise<Listing | null> {
    await this.listingsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.listingsRepository.delete(id);
  }
}
