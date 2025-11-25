import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * WebSocket JWT Authentication Guard
 *
 * Validates JWT tokens for WebSocket connections.
 * Token should be passed in the handshake auth object.
 *
 * Usage:
 * - Client connects with: socket.auth = { token: 'jwt_token' }
 * - Guard validates token and extracts user ID
 * - User ID stored in socket.handshake.auth.userId for use in handlers
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = client.handshake.auth?.token;

      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      // Verify and decode the JWT token
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });

      // Attach user ID to the socket for use in message handlers
      client.handshake.auth.userId = payload.sub;

      return true;
    } catch (error) {
      throw new WsException('Unauthorized: Invalid token');
    }
  }
}
