import { registerAs } from '@nestjs/config';
import { join } from 'path';

export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.DB_HOST || process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.DATABASE_URL?.split(':')[2]?.split('/')[0] || '5432', 10),
  username: process.env.DB_USERNAME || process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || 'postgres',
  database: process.env.DB_DATABASE || process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'n8n_work',
  entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, '..', '..', 'database', 'migrations', '*{.ts,.js}')],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
}));