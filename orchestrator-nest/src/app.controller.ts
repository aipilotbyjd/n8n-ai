import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get application status' })
  @ApiResponse({
    status: 200,
    description: 'Application is running',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            timestamp: { type: 'string' },
            version: { type: 'string' },
            environment: { type: 'string' },
          },
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string' },
            correlationId: { type: 'string' },
            version: { type: 'string' },
            path: { type: 'string' },
            method: { type: 'string' },
          },
        },
      },
    },
  })
  getStatus() {
    return this.appService.getStatus();
  }

  @Get('ping')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simple ping endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Pong response',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  })
  ping() {
    return this.appService.ping();
  }

  @Get('version')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get application version information' })
  @ApiResponse({
    status: 200,
    description: 'Version information',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            environment: { type: 'string' },
            nodeVersion: { type: 'string' },
            platform: { type: 'string' },
          },
        },
      },
    },
  })
  getVersion() {
    return this.appService.getVersion();
  }
}
