import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(email: string, password: string, name: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      name,
    });
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  /**
   * Finds user by email verification token
   */
  async findByVerificationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { emailVerificationToken: token } });
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  /**
   * Update user's online status and lastSeen timestamp
   * Called when user connects/disconnects from WebSocket
   * @param userId - User ID to update
   * @param isOnline - Whether user is online
   */
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await this.usersRepository.update(userId, {
      isOnline,
      lastSeen: new Date(),
    });
  }

  /**
   * Increment the count of conversations received by a user
   * Called when another user initiates a new conversation with this user
   * @param userId - User ID who received a new conversation
   */
  async incrementConversationsReceived(userId: string): Promise<void> {
    await this.usersRepository.increment({ id: userId }, 'conversationsReceived', 1);
    await this.recalculateResponseRate(userId);
  }

  /**
   * Increment the count of conversations replied to by a user
   * Called when user sends their first reply in a conversation they didn't initiate
   * @param userId - User ID who replied to a conversation
   */
  async incrementConversationsReplied(userId: string): Promise<void> {
    await this.usersRepository.increment({ id: userId }, 'conversationsReplied', 1);
    await this.recalculateResponseRate(userId);
  }

  /**
   * Recalculate and update a user's response rate
   * Response rate = (conversationsReplied / conversationsReceived) * 100
   * New users with 0 conversations received default to 100%
   * @param userId - User ID to recalculate response rate for
   */
  async recalculateResponseRate(userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'conversationsReceived', 'conversationsReplied'],
    });

    if (!user) return;

    // Default to 100% if no conversations received yet
    let responseRate = 100.0;

    if (user.conversationsReceived > 0) {
      responseRate = (user.conversationsReplied / user.conversationsReceived) * 100;
      // Cap at 100% (shouldn't happen, but safety check)
      responseRate = Math.min(100, responseRate);
      // Round to 2 decimal places
      responseRate = Math.round(responseRate * 100) / 100;
    }

    await this.usersRepository.update(userId, { responseRate });
  }

  /**
   * Get a user's response rate
   * @param userId - User ID to get response rate for
   * @returns Response rate as a percentage (0-100)
   */
  async getResponseRate(userId: string): Promise<number> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['responseRate'],
    });

    return user?.responseRate ?? 100;
  }
}
