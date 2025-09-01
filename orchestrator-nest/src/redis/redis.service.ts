import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const redisConfig: RedisOptions = {
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
        password: this.configService.get<string>('REDIS_PASSWORD'),
        db: this.configService.get<number>('REDIS_DB', 0),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        connectTimeout: 10000,
        commandTimeout: 5000,
      };

      // Use Redis URI if provided
      const redisUri = this.configService.get<string>('REDIS_URI');
      if (redisUri) {
        this.client = new Redis(redisUri, {
          ...redisConfig,
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 100,
        });
      } else {
        this.client = new Redis(redisConfig);
      }

      // Event listeners
      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Connected to Redis');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        this.logger.error(`Redis connection error: ${error.message}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        this.logger.log('Reconnecting to Redis...');
      });

      await this.client.connect();
      this.logger.log('Redis service initialized');
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error.message}`);
      throw error;
    }
  }

  private async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      this.logger.log('Disconnected from Redis');
    }
  }

  // Basic Redis operations
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async setWithExpiry(key: string, value: string, ttl: number): Promise<void> {
    await this.client.setex(key, ttl, value);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.client.hset(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return this.client.hdel(key, ...fields);
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.client.lpush(key, ...values);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.client.rpush(key, ...values);
  }

  async lpop(key: string): Promise<string | null> {
    return this.client.lpop(key);
  }

  async rpop(key: string): Promise<string | null> {
    return this.client.rpop(key);
  }

  async llen(key: string): Promise<number> {
    return this.client.llen(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.client.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async sismember(key: string, member: string): Promise<number> {
    return this.client.sismember(key, member);
  }

  // Stream operations (for event streaming)
  async xAdd(
    key: string,
    id: string,
    field: string,
    value: string,
    options?: { maxLength?: number; approximateMaxLength?: boolean }
  ): Promise<string> {
    const args = [key, id, field, value];
    if (options?.maxLength) {
      if (options.approximateMaxLength) {
        args.splice(2, 0, 'MAXLEN', '~', options.maxLength.toString());
      } else {
        args.splice(2, 0, 'MAXLEN', options.maxLength.toString());
      }
    }
    return this.client.xadd(...args);
  }

  async xReadGroup(
    group: string,
    consumer: string,
    streams: [string, string][],
    options?: { count?: number; block?: number }
  ): Promise<any[]> {
    const args = ['GROUP', group, consumer];
    if (options?.count) {
      args.push('COUNT', options.count.toString());
    }
    if (options?.block) {
      args.push('BLOCK', options.block.toString());
    }
    args.push('STREAMS');
    streams.forEach(([stream, id]) => {
      args.push(stream, id);
    });
    return this.client.xreadgroup(...args);
  }

  async xGroupCreate(
    key: string,
    groupName: string,
    id: string,
    options?: { mkstream?: boolean }
  ): Promise<string> {
    const args = [key, groupName, id];
    if (options?.mkstream) {
      args.push('MKSTREAM');
    }
    return this.client.xgroup('CREATE', ...args);
  }

  async xAck(key: string, group: string, ...ids: string[]): Promise<number> {
    return this.client.xack(key, group, ...ids);
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<number> {
    return this.client.publish(channel, message);
  }

  async subscribe(channel: string): Promise<void> {
    return this.client.subscribe(channel);
  }

  async unsubscribe(channel?: string): Promise<void> {
    return this.client.unsubscribe(channel);
  }

  // Utility methods
  getClient(): Redis {
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected && this.client.status === 'ready';
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async flushdb(): Promise<string> {
    return this.client.flushdb();
  }

  async info(section?: string): Promise<string> {
    return this.client.info(section);
  }

  // Transaction support
  async multi(): Promise<any> {
    return this.client.multi();
  }

  async exec(): Promise<any[]> {
    return this.client.exec();
  }

  // Lua script support
  async eval(script: string, numKeys: number, ...args: (string | number)[]): Promise<any> {
    return this.client.eval(script, numKeys, ...args);
  }

  async evalsha(sha: string, numKeys: number, ...args: (string | number)[]): Promise<any> {
    return this.client.evalsha(sha, numKeys, ...args);
  }
}
