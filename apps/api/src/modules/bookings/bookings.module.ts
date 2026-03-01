import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/services/prisma.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, PrismaService, JwtAuthGuard],
  exports: [BookingsService]
})
export class BookingsModule {}
