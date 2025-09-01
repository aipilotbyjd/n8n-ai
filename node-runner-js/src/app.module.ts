import { NodeExecutorService } from './services/node-executor.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NodeExecutionConsumer } from './consumers/node-execution.consumer';
import rabbitmqConfig from './config/rabbitmq.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [rabbitmqConfig],
    }),
    ClientsModule.registerAsync([
      {
        name: 'NODE_EXECUTION_QUEUE',
        imports: [ConfigModule],
        useFactory: (configService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('rabbitmq.uri')],
            queue: configService.get<string>('rabbitmq.queues.nodeExecution'),
            queueOptions: {
              durable: true,  // Make queue durable for persistence
              arguments: {
                'x-max-retries': 3,  // Maximum retry attempts
                'x-message-ttl': 1800000,  // 30 minutes TTL for node messages
                'x-dead-letter-exchange': 'node-execution-dlx',  // Dead letter exchange
                'x-dead-letter-routing-key': 'node-execution-dlq',  // Dead letter routing key
              },
            },
            socketOptions: {
              heartbeatIntervalInSeconds: 60,
              reconnectTimeInSeconds: 5,
              connectionOptions: {
                timeout: 10000,
              },
            },
            prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH_COUNT || '20'), // Higher prefetch for node execution
            noAck: false,  // Require explicit acknowledgment
          },
        }),
        inject: ['ConfigService'],
      },
    ]),
  ],
  controllers: [NodeExecutionConsumer],
  providers: [NodeExecutorService],
})
export class AppModule {}
