import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/services/prisma.service.js';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, PrismaService],
  exports: [ReviewsService]
})
export class ReviewsModule {}
