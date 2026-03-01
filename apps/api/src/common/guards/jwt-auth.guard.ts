import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';

import type { AuthTokenPayload, AuthenticatedUser } from '../../modules/auth/auth.types.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: AuthenticatedUser }>();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Missing bearer token' });
    }

    const token = authHeader.slice('Bearer '.length);
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET ?? 'change_me_access') as AuthTokenPayload;
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role
      };
      return true;
    } catch {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Invalid token' });
    }
  }
}
