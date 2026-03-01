import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import { hash, verify } from 'argon2';
import { randomBytes, createHash } from 'node:crypto';

import { PrismaService } from '../../common/services/prisma.service.js';
import { AuditLogService } from '../../common/services/audit-log.service.js';
import type { AuthTokenPayload, AuthenticatedUser } from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';
import type { SignupDto } from './dto/signup.dto.js';
import type { RefreshDto } from './dto/refresh.dto.js';
import type { LogoutDto } from './dto/logout.dto.js';
import type { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import type { ResetPasswordDto } from './dto/reset-password.dto.js';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(AuditLogService)
    private readonly auditLogService: AuditLogService
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException({
        code: 'EMAIL_ALREADY_IN_USE',
        message: 'Email is already in use'
      });
    }

    const passwordHash = await hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role ?? Role.CLIENT,
        vendorProfile:
          dto.role === Role.VENDOR
            ? {
                create: {
                  companyName: `${dto.firstName} ${dto.lastName} Wines`
                }
              }
            : undefined
      }
    });

    this.auditLogService.write({ action: 'auth.signup', actorId: user.id });

    return this.issueTokenPair(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    const validPassword = await verify(user.passwordHash, dto.password);
    if (!validPassword) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    this.auditLogService.write({ action: 'auth.login', actorId: user.id });

    return this.issueTokenPair(user);
  }

  async refresh(dto: RefreshDto): Promise<Pick<AuthResponse, 'accessToken' | 'refreshToken'>> {
    const payload = this.verifyRefreshToken(dto.refreshToken);
    const tokenHash = this.hashToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    if (!storedToken) {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' });
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Invalid refresh token owner' });
    }

    const nextPair = await this.createTokenPair(user);
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date(),
        replacedBy: nextPair.refreshTokenId
      }
    });

    this.auditLogService.write({ action: 'auth.refresh', actorId: user.id });

    return {
      accessToken: nextPair.accessToken,
      refreshToken: nextPair.refreshToken
    };
  }

  async logout(dto: LogoutDto): Promise<{ success: true }> {
    const payload = this.verifyRefreshToken(dto.refreshToken);
    const tokenHash = this.hashToken(dto.refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: {
        userId: payload.sub,
        tokenHash,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });

    this.auditLogService.write({ action: 'auth.logout', actorId: payload.sub });

    return { success: true };
  }

  async me(user: AuthenticatedUser): Promise<AuthenticatedUser & { firstName: string; lastName: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true
      }
    });

    if (!existingUser) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'User not found' });
    }

    return existingUser;
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ success: true }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (user) {
      const rawToken = randomBytes(24).toString('hex');
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(rawToken),
          expiresAt: new Date(Date.now() + 1000 * 60 * 15)
        }
      });
      this.auditLogService.write({ action: 'auth.password_reset_requested', actorId: user.id });
    }

    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: true }> {
    const tokenHash = this.hashToken(dto.token);
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    if (!resetToken) {
      throw new BadRequestException({ code: 'INVALID_RESET_TOKEN', message: 'Invalid or expired token' });
    }

    const passwordHash = await hash(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() }
      }),
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash }
      })
    ]);

    this.auditLogService.write({ action: 'auth.password_reset_completed', actorId: resetToken.userId });

    return { success: true };
  }

  private async issueTokenPair(user: User): Promise<AuthResponse> {
    const tokenPair = await this.createTokenPair(user);
    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
  }

  private async createTokenPair(user: User): Promise<{ accessToken: string; refreshToken: string; refreshTokenId: string }> {
    const accessPayload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType: 'access',
      jti: randomBytes(12).toString('hex')
    };
    const refreshPayload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType: 'refresh',
      jti: randomBytes(12).toString('hex')
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'change_me_access'),
      expiresIn: this.ttlToSeconds(this.configService.get<string>('JWT_ACCESS_TTL', '15m'))
    });
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'change_me_refresh'),
      expiresIn: this.ttlToSeconds(this.configService.get<string>('JWT_REFRESH_TTL', '7d'))
    });

    const refreshTokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: this.calculateRefreshExpiry()
      }
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenId: refreshTokenRecord.id
    };
  }

  private verifyRefreshToken(token: string): AuthTokenPayload {
    try {
      const payload = this.jwtService.verify<AuthTokenPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'change_me_refresh')
      });
      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token type' });
      }
      return payload;
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' });
    }
  }

  private hashToken(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private calculateRefreshExpiry(): Date {
    const ttl = this.configService.get<string>('JWT_REFRESH_TTL', '7d');
    const ttlMatch = ttl.match(/^(\d+)([smhd])$/);
    if (!ttlMatch) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const amount = Number(ttlMatch[1]);
    const unit = ttlMatch[2];
    if (!unit) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const unitMs: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000
    };
    const unitValue = unitMs[unit];
    if (!unitValue) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    return new Date(Date.now() + amount * unitValue);
  }

  private ttlToSeconds(ttl: string): number {
    const ttlMatch = ttl.match(/^(\d+)([smhd])$/);
    if (!ttlMatch) {
      return 900;
    }
    const amount = Number(ttlMatch[1]);
    const unit = ttlMatch[2];
    if (!unit) {
      return 900;
    }
    const unitSeconds: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400
    };
    const unitValue = unitSeconds[unit];
    return unitValue ? amount * unitValue : 900;
  }
}
