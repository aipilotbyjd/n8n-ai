import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import rabbitmqConfig from './config/rabbitmq.config';

// Domain Modules
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

// Infrastructure Modules
import { ObservabilityModule } from './observability/observability.module';
import { EventStreamingModule } from './event-streaming/event-streaming.module';
import { WebsocketModule } from './websocket/websocket.module';
import { MqModule } from './mq/mq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [rabbitmqConfig, jwtConfig, databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('database'),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: 'EXECUTION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('rabbitmq.uri')],
            queue: configService.get<string>('rabbitmq.queues.executions'),
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    EventEmitterModule.forRoot(),

    // Domain Modules
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

    // Infrastructure Modules
    ObservabilityModule,
    EventStreamingModule,
    WebsocketModule,
    MqModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
