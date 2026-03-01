import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { ReviewsService } from './reviews.service.js';

@Controller()
export class ReviewsController {
  constructor(@Inject(ReviewsService) private readonly reviewsService: ReviewsService) {}

  @Get('tours/:id/reviews')
  async listPublic(@Param('id') id: string) {
    return this.reviewsService.listTourReviews(id);
  }

  @Get('reviews/me')
  @UseGuards(JwtAuthGuard)
  async myReviews(@CurrentUser() user: AuthenticatedUser) {
    return this.reviewsService.myReviews(user.id);
  }

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(user.id, dto);
  }

  @Patch('reviews/:id')
  @UseGuards(JwtAuthGuard)
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') reviewId: string, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.updateReview(user.id, reviewId, dto);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') reviewId: string) {
    return this.reviewsService.deleteReview(user.id, reviewId);
  }
}
