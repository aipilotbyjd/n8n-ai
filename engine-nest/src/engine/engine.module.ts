import { ExecutionStateService } from './state/execution-state.service';
import { NodeDispatcherService } from './dispatcher/node-dispatcher.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DagService } from './dag/dag.service';
import { Module } from '@nestjs/common';
import { ExecutionConsumer } from './consumers/execution.consumer';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'NODE_EXECUTION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('rabbitmq.uri')],
            queue: configService.get<string>('rabbitmq.queues.nodeExecution'),
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [],
  providers: [ExecutionConsumer, DagService, NodeDispatcherService, ExecutionStateService],
  exports: [ExecutionConsumer],
})
export class EngineModule {}
