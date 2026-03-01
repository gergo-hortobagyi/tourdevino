import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../../common/services/prisma.service.js';
import { AuditLogService } from '../../common/services/audit-log.service.js';

@Module({
  imports: [ConfigModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, AuditLogService],
  exports: [AuthService]
})
export class AuthModule {}
