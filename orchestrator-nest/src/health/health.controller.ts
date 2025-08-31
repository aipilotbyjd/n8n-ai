import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly healthService: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check(): Promise<HealthIndicatorResult> {
    return this.health.check([
      // Database health check
      () => this.db.pingCheck('database'),
      
      // Memory health check
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB
      
      // Disk health check
      () => this.disk.checkStorage('disk', { thresholdPercent: 0.9, path: '/' }),
      
      // Custom health checks
      () => this.healthService.checkRabbitMQ(),
      () => this.healthService.checkRedis(),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness(): Promise<HealthIndicatorResult> {
    return this.health.check([
      // Database readiness
      () => this.db.pingCheck('database'),
      
      // External dependencies readiness
      () => this.healthService.checkRabbitMQ(),
      () => this.healthService.checkRedis(),
    ]);
  }

  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  @ApiResponse({ status: 503, description: 'Service is not alive' })
  async liveness(): Promise<HealthIndicatorResult> {
    return this.health.check([
      // Basic liveness check - just check if the service is responding
      () => Promise.resolve({
        service: {
          status: 'up',
          message: 'Service is alive',
        },
      }),
    ]);
  }

  @Get('info')
  @ApiOperation({ summary: 'Service information' })
  @ApiResponse({ status: 200, description: 'Service information' })
  async info() {
    return this.healthService.getServiceInfo();
  }
}