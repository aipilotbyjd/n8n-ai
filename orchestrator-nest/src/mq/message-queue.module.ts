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
            urls: [configService.get<string>("rabbitmq.uri")],
            queue: configService.get<string>("rabbitmq.queues.executions"),
            queueOptions: {
              durable: true,  // Make queue durable for persistence
              arguments: {
                'x-max-retries': 3,  // Maximum retry attempts for workflow executions
                'x-message-ttl': 3600000,  // 1 hour TTL for workflow messages
                'x-dead-letter-exchange': 'workflow-execution-dlx',  // Dead letter exchange
                'x-dead-letter-routing-key': 'workflow-execution-dlq',  // Dead letter routing key
              },
            },
            socketOptions: {
              heartbeatIntervalInSeconds: 60,
              reconnectTimeInSeconds: 5,
              connectionOptions: {
                timeout: 10000,
              },
            },
            prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH_COUNT || '5'), // Lower prefetch for workflow orchestration
            noAck: false,  // Require explicit acknowledgment
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

