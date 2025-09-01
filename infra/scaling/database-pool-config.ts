// Ultra-Scalable Database Connection Pool Configuration
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const createScalableDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres-primary',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'n8n_ai',
  
  // Ultra-scalable connection pooling
  extra: {
    // Primary connection pool
    max: 20,              // Maximum connections
    min: 5,               // Minimum connections
    idleTimeoutMillis: 30000,  // Close idle connections after 30s
    acquireTimeoutMillis: 60000, // Connection acquisition timeout
    createTimeoutMillis: 30000,  // Connection creation timeout
    destroyTimeoutMillis: 5000,  // Connection destruction timeout
    reapIntervalMillis: 1000,    // Check for idle connections every 1s
    createRetryIntervalMillis: 200, // Retry connection creation every 200ms
    
    // Read replica configuration
    replication: {
      master: {
        host: process.env.DB_HOST || 'postgres-primary',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE || 'n8n_ai',
      },
      slaves: [
        {
          host: 'postgres-replica-1',
          port: 5432,
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE || 'n8n_ai',
        },
        {
          host: 'postgres-replica-2', 
          port: 5432,
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE || 'n8n_ai',
        },
      ],
      selector: 'RR', // Round-robin load balancing
    },
  },
  
  // Query optimization
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  maxQueryExecutionTime: 10000, // Log slow queries > 10s
  
  // Connection recovery
  retryAttempts: 10,
  retryDelay: 3000,
  
  // Entity loading optimization
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/database/migrations/*{.ts,.js}'],
  
  // Query result caching
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST || 'redis-cluster',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
    duration: 300000, // 5 minutes cache
    ignoreErrors: true,
  },
});
