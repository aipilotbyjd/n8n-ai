import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  tenantId: string;
  user?: any;
}

@Injectable()
export class WebSocketAuthGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = this.extractToken(client);

      if (!token) {
        throw new WsException('Authentication token required');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'default-secret',
      });

      if (!payload || !payload.sub || !payload.tenantId) {
        throw new WsException('Invalid token payload');
      }

      // Attach user info to socket
      (client as AuthenticatedSocket).userId = payload.sub;
      (client as AuthenticatedSocket).tenantId = payload.tenantId;
      (client as AuthenticatedSocket).user = payload;

      this.logger.debug(`WebSocket authenticated: User ${payload.sub}, Tenant ${payload.tenantId}`);
      return true;
    } catch (error) {
      this.logger.error(`WebSocket authentication failed: ${error.message}`);
      throw new WsException('Authentication failed');
    }
  }

  private extractToken(client: Socket): string | null {
    // Try to get token from auth object first
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }

    // Fallback to query parameters
    if (client.handshake.query?.token) {
      return client.handshake.query.token as string;
    }

    // Try headers
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}