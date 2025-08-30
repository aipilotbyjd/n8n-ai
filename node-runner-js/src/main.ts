import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const rabbitmqUri = configService.get<string>('rabbitmq.uri');
  const nodeExecutionsQueue = configService.get<string>(
    'rabbitmq.queues.nodeExecution',
  );

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUri],
      queue: nodeExecutionsQueue,
      queueOptions: {
        durable: false,
      },
    },
  });

  await app.startAllMicroservices();
  console.log('Node runner service is running');
}
bootstrap();
