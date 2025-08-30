import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EngineModule } from './engine/engine.module';
import rabbitmqConfig from './config/rabbitmq.config';
import redisConfig from './config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [rabbitmqConfig, redisConfig],
    }),
    EngineModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
