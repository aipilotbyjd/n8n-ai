import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerModule } from "@nestjs/throttler";
import { JwtModule } from "@nestjs/jwt";
import { WorkflowWebSocketGateway } from "./workflow-websocket.gateway";
import { WebSocketService } from "./websocket.service";
import { WebSocketAuthGuard } from "./guards/websocket-auth.guard";
import { WebSocketLoggingInterceptor } from "./interceptors/websocket-logging.interceptor";
import { WorkflowsModule } from "../domains/workflows/workflows.module";
import { ExecutionsModule } from "../domains/executions/executions.module";
import { AuthModule } from "../domains/auth/auth.module";

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Use this instance throughout the app
      global: true,
      // Set this to `true` to use wildcards
      wildcard: false,
      // The delimiter used to segment namespaces
      delimiter: ".",
      // Set this to `true` if you want to emit the newListener event
      newListener: false,
      // Set this to `true` if you want to emit the removeListener event
      removeListener: false,
      // The maximum amount of listeners that can be assigned to an event
      maxListeners: 20,
      // Show event name in memory leak message when more than maximum amount of listeners is assigned
      verboseMemoryLeak: false,
      // Disable throwing uncaughtException if an error event is emitted and it has no listeners
      ignoreErrors: false,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // Time to live in milliseconds
      limit: 100, // Maximum number of requests within TTL
    }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || "default-secret",
      signOptions: { expiresIn: "24h" },
    }),
    WorkflowsModule,
    ExecutionsModule,
    AuthModule,
  ],
  providers: [WorkflowWebSocketGateway, WebSocketService, WebSocketAuthGuard, WebSocketLoggingInterceptor],
  exports: [WorkflowWebSocketGateway, WebSocketService],
})
export class WebSocketModule {}
