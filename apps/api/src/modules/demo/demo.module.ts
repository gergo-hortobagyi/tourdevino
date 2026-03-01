import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { DemoController } from './demo.controller.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { OwnershipGuard } from '../../common/guards/ownership.guard.js';
import { PrismaService } from '../../common/services/prisma.service.js';

@Module({
  imports: [ConfigModule, JwtModule.register({})],
  controllers: [DemoController],
  providers: [RolesGuard, OwnershipGuard, PrismaService]
})
export class DemoModule {}
