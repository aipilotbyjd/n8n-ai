import { Module } from "@nestjs/common";
import { MessageQueueService } from "./message-queue.service";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: "ENGINE_SERVICE",
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>("RABBITMQ_URI")],
            queue: configService.get<string>("RABBITMQ_QUEUES_EXECUTIONS", "executions"),
            queueOptions: {
              durable: true,
              arguments: {
                'x-max-retries': 3,
                'x-message-ttl': 3600000,
                'x-dead-letter-exchange': 'workflow-execution-dlx',
                'x-dead-letter-routing-key': 'workflow-execution-dlq',
              },
            },
            socketOptions: {
              heartbeatIntervalInSeconds: 60,
              reconnectTimeInSeconds: 5,
              connectionOptions: {
                timeout: 10000,
              },
            },
            prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH_COUNT || '5'),
            noAck: false,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: "NODE_RUNNER_SERVICE",
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>("RABBITMQ_URI")],
            queue: configService.get<string>("RABBITMQ_QUEUES_NODE_RUNNER", "node_runner"),
            queueOptions: {
              durable: true,
              arguments: {
                'x-max-retries': 5,
                'x-message-ttl': 1800000, // 30 minutes TTL for node messages
                'x-dead-letter-exchange': 'node-execution-dlx',
                'x-dead-letter-routing-key': 'node-execution-dlq',
              },
            },
            socketOptions: {
              heartbeatIntervalInSeconds: 60,
              reconnectTimeInSeconds: 5,
              connectionOptions: {
                timeout: 10000,
              },
            },
            prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH_COUNT || '10'),
            noAck: false,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [MessageQueueService],
  exports: [MessageQueueService],
})
export class MessageQueueModule {}

