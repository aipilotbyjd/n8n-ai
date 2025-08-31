import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorResult, HealthIndicator } from '@nestjs/terminus';
import * as amqp from 'amqplib';
import * as Redis from 'ioredis';
import { version } from '../../package.json';

@Injectable()
export class HealthService extends HealthIndicator {
  private readonly logger = new Logger(HealthService.name);
  private redisClient: Redis.Redis;

  constructor(private readonly configService: ConfigService) {
    super();
    this.initializeRedis();
  }

  private initializeRedis() {
    const redisUrl = this.configService.get<string>('REDIS_URI');
    if (redisUrl) {
      this.redisClient = new Redis(redisUrl);
    }
  }

  async checkRabbitMQ(): Promise<HealthIndicatorResult> {
    try {
      const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URI');
      if (!rabbitmqUrl) {
        return this.getStatus('rabbitmq', false, { message: 'RabbitMQ URL not configured' });
      }

      const connection = await amqp.connect(rabbitmqUrl);
      await connection.close();

      return this.getStatus('rabbitmq', true, { message: 'RabbitMQ is healthy' });
    } catch (error) {
      this.logger.error('RabbitMQ health check failed:', error);
      return this.getStatus('rabbitmq', false, { 
        message: 'RabbitMQ is unhealthy',
        error: error.message 
      });
    }
  }

  async checkRedis(): Promise<HealthIndicatorResult> {
    try {
      if (!this.redisClient) {
        return this.getStatus('redis', false, { message: 'Redis not configured' });
      }

      await this.redisClient.ping();

      return this.getStatus('redis', true, { message: 'Redis is healthy' });
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return this.getStatus('redis', false, { 
        message: 'Redis is unhealthy',
        error: error.message 
      });
    }
  }

  async getServiceInfo() {
    return {
      service: 'n8n-work-orchestrator',
      version,
      environment: this.configService.get('NODE_ENV', 'development'),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}