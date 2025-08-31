import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';

// Configuration imports
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import rabbitmqConfig from './config/rabbitmq.config';
import cacheConfig from './config/cache.config';
import validationSchema from './config/validation.schema';

// Core modules
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Domain modules
import { AuthModule } from './domains/auth/auth.module';
import { WorkflowsModule } from './domains/workflows/workflows.module';
import { ExecutionsModule } from './domains/executions/executions.module';
import { CredentialsModule } from './domains/credentials/credentials.module';
import { NodesModule } from './domains/nodes/nodes.module';
import { SchedulingModule } from './domains/scheduling/scheduling.module';
import { WebhooksModule } from './domains/webhooks/webhooks.module';
import { TenantsModule } from './domains/tenants/tenants.module';
import { AuditModule } from './domains/audit/audit.module';
import { MarketplaceModule } from './domains/marketplace/marketplace.module';
import { PluginMarketplaceModule } from './domains/plugin-marketplace/plugin-marketplace.module';
import { AiAgentsModule } from './domains/ai-agents/ai-agents.module';
import { MonitoringModule } from './domains/monitoring/monitoring.module';
import { BillingModule } from './domains/billing/billing.module';
import { PoliciesModule } from './domains/policies/policies.module';

// Infrastructure modules
import { ObservabilityModule } from './observability/observability.module';
import { EventStreamingModule } from './event-streaming/event-streaming.module';
import { WebsocketModule } from './websocket/websocket.module';
import { MqModule } from './mq/mq.module';

// Health check module
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        jwtConfig,
        rabbitmqConfig,
        cacheConfig,
      ],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Caching
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('cache'),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('THROTTLE_TTL', 60),
        limit: configService.get('THROTTLE_LIMIT', 100),
      }),
      inject: [ConfigService],
    }),

    // Event emitter
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Microservices
    ClientsModule.registerAsync([
      {
        name: 'EXECUTION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URI')],
            queue: configService.get<string>('RABBITMQ_QUEUES_EXECUTIONS', 'executions'),
            queueOptions: {
              durable: true,
            },
            noAck: false,
            prefetchCount: 1,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'NODE_RUNNER_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URI')],
            queue: configService.get<string>('RABBITMQ_QUEUES_NODE_RUNNER', 'node_runner'),
            queueOptions: {
              durable: true,
            },
            noAck: false,
            prefetchCount: 1,
          },
        }),
        inject: [ConfigService],
      },
    ]),

    // Health check
    HealthModule,

    // Domain modules
    AuthModule,
    WorkflowsModule,
    ExecutionsModule,
    CredentialsModule,
    NodesModule,
    SchedulingModule,
    WebhooksModule,
    TenantsModule,
    AuditModule,
    MarketplaceModule,
    PluginMarketplaceModule,
    AiAgentsModule,
    MonitoringModule,
    BillingModule,
    PoliciesModule,

    // Infrastructure modules
    ObservabilityModule,
    EventStreamingModule,
    WebsocketModule,
    MqModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_GUARD',
      useClass: ThrottlerModule,
    },
  ],
})
export class AppModule {}
