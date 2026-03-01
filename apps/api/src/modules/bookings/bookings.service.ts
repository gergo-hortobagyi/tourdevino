import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

import { PrismaService } from '../../common/services/prisma.service.js';

@Injectable()
export class BookingsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createBooking(
    userId: string,
    payload: { tourId: string; scheduledAt: string; guestCount: number; specialRequests?: string; idempotencyKey?: string },
    requestIdempotencyKey?: string
  ) {
    const scheduledAt = new Date(payload.scheduledAt);
    const idempotencyKey = requestIdempotencyKey ?? payload.idempotencyKey;

    if (idempotencyKey) {
      const existing = await this.prisma.booking.findFirst({
        where: { idempotencyKey },
        include: { tour: { select: { id: true } } }
      });

      if (existing) {
        if (existing.userId !== userId) {
          throw new ConflictException({ code: 'IDEMPOTENCY_KEY_CONFLICT', message: 'Idempotency key already in use' });
        }

        const existingDate = existing.scheduledAt.toISOString();
        if (existing.tourId !== payload.tourId || existingDate !== scheduledAt.toISOString() || existing.guestCount !== payload.guestCount) {
          throw new ConflictException({
            code: 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD',
            message: 'Idempotency key reused with different payload'
          });
        }

        return existing;
      }
    }

    const tour = await this.prisma.tour.findFirst({
      where: {
        id: payload.tourId,
        status: 'ACTIVE'
      }
    });

    if (!tour) {
      throw new NotFoundException({ code: 'TOUR_NOT_FOUND', message: 'Tour not found' });
    }

    const availabilityDate = new Date(scheduledAt.toISOString().slice(0, 10));

    const availability = await this.prisma.tourAvailability.findFirst({
      where: {
        tourId: payload.tourId,
        date: availabilityDate
      }
    });

    if (!availability) {
      throw new BadRequestException({ code: 'NO_AVAILABILITY', message: 'No availability for selected date' });
    }

    if (availability.bookedCount + payload.guestCount > availability.capacity) {
      throw new BadRequestException({ code: 'CAPACITY_EXCEEDED', message: 'Capacity exceeded for selected date' });
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          userId,
          tourId: payload.tourId,
          scheduledAt,
          guestCount: payload.guestCount,
          specialRequests: payload.specialRequests,
          status: BookingStatus.PENDING_PAYMENT,
          totalCents: tour.priceCents * payload.guestCount,
          idempotencyKey
        }
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: null,
          toStatus: BookingStatus.PENDING_PAYMENT,
          changedById: userId
        }
      });

      await tx.tourAvailability.update({
        where: {
          tourId_date: {
            tourId: payload.tourId,
            date: availabilityDate
          }
        },
        data: {
          bookedCount: { increment: payload.guestCount }
        }
      });

      return booking;
    });

    return created;
  }

  async myBookings(userId: string) {
    const cancellationWindowHours = Number(process.env.CANCELLATION_WINDOW_HOURS ?? '24');

    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      include: {
        tour: {
          select: { id: true, slug: true, title: true, region: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const now = Date.now();
    const cancellationWindowMs = cancellationWindowHours * 60 * 60 * 1000;
    const cancellableStatuses = new Set<BookingStatus>([BookingStatus.PENDING_PAYMENT, BookingStatus.PAID]);

    return {
      data: bookings.map((booking) => {
        const withinWindow = booking.scheduledAt.getTime() - now <= cancellationWindowMs;
        const canCancel = cancellableStatuses.has(booking.status) && !withinWindow;

        return {
          ...booking,
          canCancel,
          cancellationPolicyHours: cancellationWindowHours,
          cancellationReason: canCancel ? null : 'Cancellation is only available more than 24 hours before departure.'
        };
      }),
      meta: { total: bookings.length }
    };
  }

  async bookingById(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tour: {
          select: { id: true, slug: true, title: true, region: true }
        }
      }
    });

    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Booking access denied' });
    }

    return booking;
  }

  async cancelBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }
    if (booking.userId !== userId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Booking access denied' });
    }
    if (booking.status === BookingStatus.CANCELLED) {
      return booking;
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException({ code: 'CANCELLATION_NOT_ALLOWED', message: 'Completed bookings cannot be cancelled' });
    }

    const cancellationWindowHours = Number(process.env.CANCELLATION_WINDOW_HOURS ?? '24');
    const cutoff = booking.scheduledAt.getTime() - cancellationWindowHours * 60 * 60 * 1000;
    if (Date.now() > cutoff) {
      throw new BadRequestException({
        code: 'CANCELLATION_WINDOW_CLOSED',
        message: `Cancellation is only allowed at least ${cancellationWindowHours} hours before departure`
      });
    }

    const dateOnly = new Date(booking.scheduledAt.toISOString().slice(0, 10));

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED }
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: booking.status,
          toStatus: BookingStatus.CANCELLED,
          changedById: userId
        }
      });

      await tx.tourAvailability.updateMany({
        where: { tourId: booking.tourId, date: dateOnly },
        data: { bookedCount: { decrement: booking.guestCount } }
      });

      return updated;
    });
  }
}
