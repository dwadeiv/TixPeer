import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { TransactionsModule } from './transactions/transactions.module';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './events/events.module';
import { ListingsModule } from './listings/listings.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'ticket_exchange',
      password: process.env.DATABASE_PASSWORD || 'dev_password_123',
      database: process.env.DATABASE_NAME || 'ticket_exchange_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production', // Auto-sync in development only
      logging: process.env.NODE_ENV === 'development',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    TransactionsModule,
    EventsModule,
    ListingsModule,
    MessagesModule,
  ],
})
export class AppModule {}
