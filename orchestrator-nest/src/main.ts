import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import helmet from 'helmet';
import compression from 'compression';
import { version } from '../package.json';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Create NestJS application
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
      cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Correlation-ID'],
      },
    });

    const configService = app.get(ConfigService);

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // Compression middleware
    app.use(compression());

    // Global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        disableErrorMessages: configService.get('NODE_ENV') === 'production',
        validationError: {
          target: false,
          value: false,
        },
      }),
    );

    // Global filters
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Global interceptors
    app.useGlobalInterceptors(
      new RequestIdInterceptor(),
      new LoggingInterceptor(),
      new ResponseTransformInterceptor(),
    );

    // Global prefix
    app.setGlobalPrefix('api/v1', {
      exclude: ['health', 'ready', 'live', 'metrics'],
    });

    // Swagger documentation
    if (configService.get('NODE_ENV') !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('N8N-Work Orchestrator API')
        .setDescription('Production-ready workflow automation platform orchestrator service')
        .setVersion(version)
        .addBearerAuth()
        .addTag('auth', 'Authentication and authorization')
        .addTag('workflows', 'Workflow management')
        .addTag('executions', 'Workflow executions')
        .addTag('nodes', 'Node management')
        .addTag('credentials', 'Credential management')
        .addTag('webhooks', 'Webhook management')
        .addTag('scheduling', 'Workflow scheduling')
        .addTag('monitoring', 'System monitoring')
        .addTag('admin', 'Administrative operations')
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
        },
      });
    }

    // Microservice configuration for RabbitMQ
    const rabbitmqUrl = configService.get<string>('RABBITMQ_URI');
    if (rabbitmqUrl) {
      app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
          urls: [rabbitmqUrl],
          queue: 'orchestrator_queue',
          queueOptions: {
            durable: true,
          },
          noAck: false,
          prefetchCount: 1,
        },
      });
    }

    // Start microservices
    await app.startAllMicroservices();

    // Start HTTP server
    const port = configService.get<number>('PORT', 3000);
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 N8N-Work Orchestrator is running on: http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
    logger.log(`🔍 Health Check: http://localhost:${port}/health`);
    logger.log(`📊 Metrics: http://localhost:${port}/metrics`);
    logger.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);
    logger.log(`📦 Version: ${version}`);

    // Graceful shutdown
    const signals = ['SIGTERM', 'SIGINT'];
    signals.forEach(signal => {
      process.on(signal, async () => {
        logger.log(`Received ${signal}, starting graceful shutdown...`);
        await app.close();
        logger.log('Application closed gracefully');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
