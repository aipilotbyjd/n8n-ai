import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { version } from '../package.json';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) { }

  getStatus() {
    return {
      message: 'N8N-Work Orchestrator is running',
      timestamp: new Date().toISOString(),
      version,
      environment: this.configService.get('NODE_ENV', 'development'),
    };
  }

  ping() {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
    };
  }

  getVersion() {
    return {
      version,
      name: 'n8n-work-orchestrator',
      description: 'Production-ready workflow automation platform orchestrator service',
      environment: this.configService.get('NODE_ENV', 'development'),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }
}
