import { registerAs } from '@nestjs/config';

export default registerAs('cache', () => {
  const isRedisEnabled = process.env.REDIS_URI || process.env.REDIS_HOST;
  
  if (isRedisEnabled) {
    return {
      store: 'redis',
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_CACHE_DB || '0'),
      ttl: parseInt(process.env.CACHE_TTL || '300'), // 5 minutes default
      max: parseInt(process.env.CACHE_MAX_ITEMS || '1000'),
      // Connection pool settings
      family: 4, // IPv4
      keepAlive: true,
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
      commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000'),
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
      lazyConnect: true,
    };
  }

  // Default to memory cache
  return {
    store: 'memory',
    ttl: parseInt(process.env.CACHE_TTL || '300'),
    max: parseInt(process.env.CACHE_MAX_ITEMS || '1000'),
  };
});
