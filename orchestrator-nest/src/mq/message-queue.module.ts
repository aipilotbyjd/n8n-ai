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
              durable: false,
            },
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

