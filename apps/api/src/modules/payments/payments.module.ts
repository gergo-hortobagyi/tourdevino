import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/services/prisma.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService, JwtAuthGuard],
  exports: [PaymentsService]
})
export class PaymentsModule {}
