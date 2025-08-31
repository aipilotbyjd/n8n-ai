import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DagService } from './dag/dag.service';
import { ExecutionConsumer } from './consumers/execution.consumer';
import { NodeDispatcherService } from './dispatcher/node-dispatcher.service';
import { ExecutionStateService } from './state/execution-state.service';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'NODE_EXECUTION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('rabbitmq.uri') || 'amqp://localhost:5672'],
            queue: configService.get<string>('rabbitmq.queues.nodeExecution') || 'node-execution',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get<string>('redis.host') || 'localhost',
            port: configService.get<number>('redis.port') || 6379,
          }
        }),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [
    ExecutionConsumer,
    DagService,
    NodeDispatcherService,
    ExecutionStateService,
  ],
  exports: [ExecutionConsumer],
})
export class EngineModule {}
