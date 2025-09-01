import { registerAs } from '@nestjs/config';
import { join } from 'path';

export default registerAs('database', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const useReadReplicas = process.env.DB_USE_READ_REPLICAS === 'true';

  const baseConfig = {
    type: 'postgres' as const,
    host: process.env.DB_HOST || process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'postgres-primary',
    port: parseInt(process.env.DB_PORT || process.env.DATABASE_URL?.split(':')[2]?.split('/')[0] || '5432', 10),
    username: process.env.DB_USERNAME || process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'n8n_ai',
    password: process.env.DB_PASSWORD || process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || 'n8n_ai_dev',
    database: process.env.DB_DATABASE || process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'orchestrator',

    // Entity and migration paths
    entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    migrations: [join(__dirname, '..', '..', 'database', 'migrations', '*{.ts,.js}')],

    // Development settings
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',

    // Ultra-scalable connection pool configuration
    extra: {
      // Primary connection pool
      max: parseInt(process.env.DB_POOL_MAX || '20'),              // Maximum connections
      min: parseInt(process.env.DB_POOL_MIN || '5'),               // Minimum connections
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),  // Close idle connections after 30s
      acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'), // Connection acquisition timeout
      createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT || '30000'),  // Connection creation timeout
      destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT || '5000'),  // Connection destruction timeout
      reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL || '1000'),    // Check for idle connections every 1s
      createRetryIntervalMillis: parseInt(process.env.DB_CREATE_RETRY_INTERVAL || '200'), // Retry connection creation every 200ms

      // Query optimization
      statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'), // 30 second query timeout
      query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),        // 30 second query timeout
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'), // 10 second connection timeout

      // SSL configuration for production
      ...(isProduction && {
        ssl: {
          rejectUnauthorized: false,
          ca: process.env.DB_SSL_CA,
          cert: process.env.DB_SSL_CERT,
          key: process.env.DB_SSL_KEY,
        },
      }),
    },

    // Connection recovery and retry
    retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '10'),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000'),

    // Cache configuration for queries
    cache: {
      type: 'redis',
      options: {
        host: process.env.REDIS_HOST || 'redis-cluster',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '1'), // Separate DB for query cache
      },
      duration: parseInt(process.env.DB_CACHE_DURATION || '300000'), // 5 minutes cache
      ignoreErrors: true,
    },
  };

  // Add read replica configuration if enabled
  if (useReadReplicas) {
    baseConfig.extra.replication = {
      master: {
        host: process.env.DB_HOST || 'postgres-primary',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE || 'orchestrator',
      },
      slaves: [
        {
          host: process.env.DB_REPLICA1_HOST || 'postgres-replica-1',
          port: parseInt(process.env.DB_REPLICA1_PORT || '5432'),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE || 'orchestrator',
        },
        {
          host: process.env.DB_REPLICA2_HOST || 'postgres-replica-2',
          port: parseInt(process.env.DB_REPLICA2_PORT || '5432'),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE || 'orchestrator',
        },
      ],
      selector: process.env.DB_REPLICATION_SELECTOR || 'RR', // Round-robin load balancing
    };
  }

  return baseConfig;
});