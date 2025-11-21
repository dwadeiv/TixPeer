import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '../../..', '.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USER || 'ticket_exchange',
  password: process.env.DATABASE_PASSWORD || 'dev_password_123',
  database: process.env.DATABASE_NAME || 'ticket_exchange_db',
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
});
