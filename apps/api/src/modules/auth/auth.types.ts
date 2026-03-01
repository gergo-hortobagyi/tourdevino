import type { Role } from '@prisma/client';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: Role;
  tokenType: 'access' | 'refresh';
  jti: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}
