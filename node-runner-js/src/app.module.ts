import { NodeExecutorService } from './services/node-executor.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NodeExecutionConsumer } from './consumers/node-execution.consumer';
import rabbitmqConfig from './config/rabbitmq.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [rabbitmqConfig],
    }),
  ],
  controllers: [NodeExecutionConsumer],
  providers: [NodeExecutorService],
})
export class AppModule {}
