import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

import { PrismaService } from '../../common/services/prisma.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listTourReviews(tourIdOrSlug: string): Promise<{ data: Array<{ id: string; rating: number; comment: string | null; authorName: string; createdAt: Date }>; meta: Record<string, unknown> }> {
    const tour = await this.prisma.tour.findFirst({
      where: {
        OR: [{ id: tourIdOrSlug }, { slug: tourIdOrSlug }],
        status: 'ACTIVE'
      },
      select: { id: true }
    });

    if (!tour) {
      return {
        data: [],
        meta: { total: 0 }
      };
    }

    const reviews = await this.prisma.review.findMany({
      where: { tourId: tour.id },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      data: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        authorName: `${review.user.firstName} ${review.user.lastName}`
      })),
      meta: {
        total: reviews.length
      }
    };
  }

  async myReviews(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      include: {
        tour: {
          select: {
            id: true,
            slug: true,
            title: true,
            region: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return {
      data: reviews,
      meta: {
        total: reviews.length
      }
    };
  }

  async createReview(userId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: dto.bookingId } });
    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }
    if (booking.userId !== userId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Booking access denied' });
    }
    if (booking.tourId !== dto.tourId) {
      throw new BadRequestException({ code: 'BOOKING_TOUR_MISMATCH', message: 'Booking does not belong to this tour' });
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException({ code: 'REVIEW_NOT_ELIGIBLE', message: 'Review is allowed only after completed booking' });
    }

    const existing = await this.prisma.review.findFirst({
      where: { userId, bookingId: booking.id }
    });
    if (existing) {
      throw new BadRequestException({ code: 'REVIEW_ALREADY_EXISTS', message: 'Review already exists for this booking' });
    }

    return this.prisma.review.create({
      data: {
        userId,
        tourId: dto.tourId,
        bookingId: dto.bookingId,
        rating: dto.rating,
        comment: dto.comment
      }
    });
  }

  async updateReview(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException({ code: 'REVIEW_NOT_FOUND', message: 'Review not found' });
    }
    if (review.userId !== userId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Review access denied' });
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
        ...(dto.comment !== undefined ? { comment: dto.comment } : {})
      }
    });
  }

  async deleteReview(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException({ code: 'REVIEW_NOT_FOUND', message: 'Review not found' });
    }
    if (review.userId !== userId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Review access denied' });
    }

    await this.prisma.review.delete({ where: { id: reviewId } });
    return { success: true };
  }
}
