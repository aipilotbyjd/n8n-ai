import { Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ExecutionContext, CallHandler } from '@nestjs/common';

@Injectable()
export class WebSocketLoggingInterceptor {
  private readonly logger = new Logger(WebSocketLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();
    const event = context.switchToWs().getPattern();

    const startTime = Date.now();
    const clientId = client.id;
    const userId = (client as any).userId;
    const tenantId = (client as any).tenantId;

    this.logger.debug(
      `WebSocket Event: ${event} | Client: ${clientId} | User: ${userId} | Tenant: ${tenantId} | Data: ${JSON.stringify(data)}`
    );

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;
        this.logger.debug(
          `WebSocket Response: ${event} | Client: ${clientId} | Duration: ${duration}ms | Response: ${JSON.stringify(response)}`
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.error(
          `WebSocket Error: ${event} | Client: ${clientId} | Duration: ${duration}ms | Error: ${error.message}`,
          error.stack
        );
        throw error;
      })
    );
  }
}