import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { BookingStatus, TourStatus, VendorApprovalStatus } from '@prisma/client';

import { AuditLogService } from '../../common/services/audit-log.service.js';
import { CacheService } from '../../common/services/cache.service.js';
import { PrismaService } from '../../common/services/prisma.service.js';
import { type AuthenticatedUser } from '../auth/auth.types.js';
import { ListVendorBookingsDto } from './dto/list-vendor-bookings.dto.js';
import { ListVendorToursDto } from './dto/list-vendor-tours.dto.js';
import { RespondVendorReviewDto } from './dto/respond-vendor-review.dto.js';
import { UpdateVendorBookingStatusDto } from './dto/update-vendor-booking-status.dto.js';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto.js';
import { UpdateVendorTourStatusDto } from './dto/update-vendor-tour-status.dto.js';
import { CreateVendorTourDto, UpdateVendorTourDto } from './dto/upsert-vendor-tour.dto.js';
import { UpsertTourAvailabilityDto } from './dto/upsert-tour-availability.dto.js';
import { CreateVendorApplicationDto } from './dto/create-vendor-application.dto.js';

@Injectable()
export class VendorService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditLogService) private readonly auditLog: AuditLogService,
    @Inject(CacheService) private readonly cache: CacheService
  ) {}

  async profile(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        companyName: true,
        description: true,
        payoutProvider: true,
        payoutAccountMasked: true,
        payoutConfiguredAt: true,
        approvalStatus: true,
        rejectionReason: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!profile) {
      throw new NotFoundException({ code: 'VENDOR_PROFILE_NOT_FOUND', message: 'Vendor profile not found' });
    }

    return profile;
  }

  async createApplication(user: AuthenticatedUser, dto: CreateVendorApplicationDto) {
    const profile = await this.prisma.vendorProfile.findUnique({
      where: { userId: user.id }
    });

    if (!profile) {
      const created = await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            role: 'VENDOR'
          }
        });

        return tx.vendorProfile.create({
          data: {
            userId: user.id,
            companyName: dto.companyName,
            description: [dto.description, dto.legalName, dto.contactPhone].filter(Boolean).join('\n') || null,
            payoutProvider: dto.payoutProvider,
            payoutAccountMasked: dto.payoutAccountMasked,
            payoutConfiguredAt: dto.payoutAccountMasked ? new Date() : null,
            approvalStatus: VendorApprovalStatus.PENDING,
            reviewedAt: null,
            reviewedById: null,
            rejectionReason: null
          }
        });
      });

      this.auditLog.write({ action: 'vendor.application.created', actorId: user.id, targetId: created.id });
      return created;
    }

    if (profile.approvalStatus === VendorApprovalStatus.APPROVED) {
      throw new ConflictException({ code: 'VENDOR_ALREADY_APPROVED', message: 'Vendor account is already approved' });
    }

    if (profile.approvalStatus === VendorApprovalStatus.PENDING) {
      throw new ConflictException({ code: 'VENDOR_APPLICATION_PENDING', message: 'Vendor application is already pending review' });
    }

    const updated = await this.prisma.vendorProfile.update({
      where: { userId: user.id },
      data: {
        companyName: dto.companyName,
        description: [dto.description, dto.legalName, dto.contactPhone].filter(Boolean).join('\n') || null,
        payoutProvider: dto.payoutProvider,
        payoutAccountMasked: dto.payoutAccountMasked,
        payoutConfiguredAt: dto.payoutAccountMasked ? new Date() : null,
        approvalStatus: VendorApprovalStatus.PENDING,
        reviewedAt: null,
        reviewedById: null,
        rejectionReason: null
      }
    });

    this.auditLog.write({ action: 'vendor.application.resubmitted', actorId: user.id, targetId: updated.id });
    return updated;
  }

  async updateProfile(userId: string, dto: UpdateVendorProfileDto) {
    const existing = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!existing) {
      throw new NotFoundException({ code: 'VENDOR_PROFILE_NOT_FOUND', message: 'Vendor profile not found' });
    }

    const updated = await this.prisma.vendorProfile.update({
      where: { userId },
      data: {
        ...(dto.companyName !== undefined ? { companyName: dto.companyName } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.payoutProvider !== undefined ? { payoutProvider: dto.payoutProvider } : {}),
        ...(dto.payoutAccountMasked !== undefined
          ? {
              payoutAccountMasked: dto.payoutAccountMasked,
              payoutConfiguredAt: dto.payoutAccountMasked ? new Date() : null
            }
          : {})
      }
    });

    this.auditLog.write({ action: 'vendor.profile.updated', actorId: userId, targetId: updated.id });
    return updated;
  }

  async dashboard(userId: string) {
    await this.requireApprovedVendor(userId);

    const cacheKey = `vendor:dashboard:${userId}`;
    const cached = this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) {
      return cached;
    }

    const [activeTours, upcomingBookings, paidBookings, ratings] = await this.prisma.$transaction([
      this.prisma.tour.count({ where: { vendorId: userId, status: TourStatus.ACTIVE } }),
      this.prisma.booking.count({
        where: {
          tour: { vendorId: userId },
          scheduledAt: { gte: new Date() },
          status: { in: [BookingStatus.PAID, BookingStatus.PENDING_PAYMENT] }
        }
      }),
      this.prisma.booking.count({
        where: {
          tour: { vendorId: userId },
          status: { in: [BookingStatus.PAID, BookingStatus.COMPLETED] }
        }
      }),
      this.prisma.review.findMany({
        where: { tour: { vendorId: userId } },
        select: { rating: true }
      })
    ]);

    const averageRating =
      ratings.length > 0 ? Number((ratings.reduce((sum, review) => sum + review.rating, 0) / ratings.length).toFixed(2)) : 0;

    const payload = {
      activeTours,
      upcomingBookings,
      totalPaidBookings: paidBookings,
      averageRating,
      totalReviews: ratings.length
    };

    this.cache.set(cacheKey, payload, 30_000);
    return payload;
  }

  async analyticsOverview(userId: string) {
    await this.requireApprovedVendor(userId);

    const [pendingPayment, paid, cancelled, completed, revenue] = await this.prisma.$transaction([
      this.prisma.booking.count({ where: { tour: { vendorId: userId }, status: BookingStatus.PENDING_PAYMENT } }),
      this.prisma.booking.count({ where: { tour: { vendorId: userId }, status: BookingStatus.PAID } }),
      this.prisma.booking.count({ where: { tour: { vendorId: userId }, status: BookingStatus.CANCELLED } }),
      this.prisma.booking.count({ where: { tour: { vendorId: userId }, status: BookingStatus.COMPLETED } }),
      this.prisma.booking.aggregate({
        where: {
          tour: { vendorId: userId },
          status: { in: [BookingStatus.PAID, BookingStatus.COMPLETED] }
        },
        _sum: { totalCents: true }
      })
    ]);

    return {
      bookingsByStatus: [
        { status: BookingStatus.PENDING_PAYMENT, count: pendingPayment },
        { status: BookingStatus.PAID, count: paid },
        { status: BookingStatus.CANCELLED, count: cancelled },
        { status: BookingStatus.COMPLETED, count: completed }
      ],
      totalRevenueCents: revenue._sum.totalCents ?? 0
    };
  }

  async tourAnalytics(userId: string, tourId: string) {
    await this.requireApprovedVendor(userId);
    await this.assertTourOwnership(userId, tourId);

    const [pendingPayment, paid, cancelled, completed, revenue, reviews] = await this.prisma.$transaction([
      this.prisma.booking.count({ where: { tourId, status: BookingStatus.PENDING_PAYMENT } }),
      this.prisma.booking.count({ where: { tourId, status: BookingStatus.PAID } }),
      this.prisma.booking.count({ where: { tourId, status: BookingStatus.CANCELLED } }),
      this.prisma.booking.count({ where: { tourId, status: BookingStatus.COMPLETED } }),
      this.prisma.booking.aggregate({
        where: {
          tourId,
          status: { in: [BookingStatus.PAID, BookingStatus.COMPLETED] }
        },
        _sum: { totalCents: true }
      }),
      this.prisma.review.findMany({ where: { tourId }, select: { rating: true } })
    ]);

    return {
      bookingsByStatus: [
        { status: BookingStatus.PENDING_PAYMENT, count: pendingPayment },
        { status: BookingStatus.PAID, count: paid },
        { status: BookingStatus.CANCELLED, count: cancelled },
        { status: BookingStatus.COMPLETED, count: completed }
      ],
      totalRevenueCents: revenue._sum.totalCents ?? 0,
      totalReviews: reviews.length,
      averageRating: reviews.length > 0 ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)) : 0
    };
  }

  async listTours(user: AuthenticatedUser, query: ListVendorToursDto) {
    await this.requireApprovedVendor(user.id);
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;

    const where = {
      vendorId: user.id,
      ...(query.status ? { status: query.status } : {}),
      ...(query.query
        ? {
            OR: [
              { title: { contains: query.query, mode: 'insensitive' as const } },
              { region: { contains: query.query, mode: 'insensitive' as const } }
            ]
          }
        : {})
    };

    const [total, tours] = await this.prisma.$transaction([
      this.prisma.tour.count({ where }),
      this.prisma.tour.findMany({
        where,
        include: {
          media: { orderBy: { sortOrder: 'asc' }, take: 1 },
          availability: { take: 1, orderBy: { date: 'asc' } }
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      data: tours,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    };
  }

  async createTour(user: AuthenticatedUser, dto: CreateVendorTourDto) {
    await this.requireApprovedVendor(user.id);

    const existing = await this.prisma.tour.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException({ code: 'TOUR_SLUG_TAKEN', message: 'Tour slug already in use' });
    }

    const tour = await this.prisma.tour.create({
      data: {
        vendorId: user.id,
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        region: dto.region,
        priceCents: dto.priceCents,
        durationHours: dto.durationHours,
        latitude: dto.latitude,
        longitude: dto.longitude,
        status: dto.status ?? TourStatus.DRAFT,
        media: dto.media
          ? {
              createMany: {
                data: dto.media
              }
            }
          : undefined
      },
      include: {
        media: { orderBy: { sortOrder: 'asc' } }
      }
    });

    this.invalidateReadCaches();
    this.auditLog.write({ action: 'vendor.tour.created', actorId: user.id, targetId: tour.id, meta: { slug: tour.slug } });
    return tour;
  }

  async tourById(user: AuthenticatedUser, tourId: string) {
    await this.requireApprovedVendor(user.id);

    const tour = await this.prisma.tour.findFirst({
      where: {
        id: tourId,
        vendorId: user.id
      },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        availability: { orderBy: { date: 'asc' }, take: 60 }
      }
    });

    if (!tour) {
      throw new NotFoundException({ code: 'TOUR_NOT_FOUND', message: 'Tour not found' });
    }

    return tour;
  }

  async updateTour(user: AuthenticatedUser, tourId: string, dto: UpdateVendorTourDto) {
    await this.requireApprovedVendor(user.id);

    const existing = await this.assertTourOwnership(user.id, tourId);

    if (dto.slug && dto.slug !== existing.slug) {
      const slugTaken = await this.prisma.tour.findFirst({ where: { slug: dto.slug, id: { not: tourId } } });
      if (slugTaken) {
        throw new ConflictException({ code: 'TOUR_SLUG_TAKEN', message: 'Tour slug already in use' });
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.tour.update({
        where: { id: tourId },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.region !== undefined ? { region: dto.region } : {}),
          ...(dto.priceCents !== undefined ? { priceCents: dto.priceCents } : {}),
          ...(dto.durationHours !== undefined ? { durationHours: dto.durationHours } : {}),
          ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
          ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {})
        }
      });

      if (dto.media) {
        await tx.tourMedia.deleteMany({ where: { tourId } });
        if (dto.media.length > 0) {
          await tx.tourMedia.createMany({
            data: dto.media.map((item) => ({
              tourId,
              type: item.type,
              url: item.url,
              sortOrder: item.sortOrder
            }))
          });
        }
      }

      return result;
    });

    this.invalidateReadCaches();
    this.auditLog.write({ action: 'vendor.tour.updated', actorId: user.id, targetId: updated.id });
    return updated;
  }

  async deleteTour(user: AuthenticatedUser, tourId: string) {
    await this.requireApprovedVendor(user.id);

    const tour = await this.assertTourOwnership(user.id, tourId);

    const activeBookings = await this.prisma.booking.count({
      where: {
        tourId,
        status: {
          in: [BookingStatus.PENDING_PAYMENT, BookingStatus.PAID]
        }
      }
    });

    if (activeBookings > 0) {
      throw new BadRequestException({ code: 'TOUR_HAS_ACTIVE_BOOKINGS', message: 'Cannot delete tour with active bookings' });
    }

    const deleted = await this.prisma.tour.update({
      where: { id: tour.id },
      data: {
        status: TourStatus.INACTIVE
      }
    });

    this.invalidateReadCaches();
    this.auditLog.write({ action: 'vendor.tour.deleted', actorId: user.id, targetId: deleted.id });
    return { success: true };
  }

  async updateTourStatus(user: AuthenticatedUser, tourId: string, dto: UpdateVendorTourStatusDto) {
    await this.requireApprovedVendor(user.id);
    await this.assertTourOwnership(user.id, tourId);

    const updated = await this.prisma.tour.update({
      where: { id: tourId },
      data: { status: dto.status }
    });

    this.invalidateReadCaches();
    this.auditLog.write({ action: 'vendor.tour.status.updated', actorId: user.id, targetId: updated.id, meta: { status: dto.status } });
    return updated;
  }

  async upsertAvailability(user: AuthenticatedUser, tourId: string, dto: UpsertTourAvailabilityDto) {
    await this.requireApprovedVendor(user.id);
    await this.assertTourOwnership(user.id, tourId);

    const uniqueDates = new Map<string, number>();
    for (const entry of dto.entries) {
      const key = new Date(entry.date).toISOString().slice(0, 10);
      if (uniqueDates.has(key)) {
        throw new BadRequestException({ code: 'DUPLICATE_AVAILABILITY_DATE', message: 'Duplicate availability date in payload' });
      }
      uniqueDates.set(key, entry.capacity);
    }

    const existing = await this.prisma.tourAvailability.findMany({ where: { tourId } });
    const existingByDate = new Map(existing.map((item) => [item.date.toISOString().slice(0, 10), item]));

    await this.prisma.$transaction(async (tx) => {
      for (const [dateKey, capacity] of uniqueDates.entries()) {
        const date = new Date(dateKey);
        const current = existingByDate.get(dateKey);
        if (current) {
          if (capacity < current.bookedCount) {
            throw new BadRequestException({ code: 'CAPACITY_BELOW_BOOKED', message: 'Capacity cannot be below booked seats' });
          }
          await tx.tourAvailability.update({
            where: { id: current.id },
            data: { capacity }
          });
        } else {
          await tx.tourAvailability.create({
            data: {
              tourId,
              date,
              capacity,
              bookedCount: 0
            }
          });
        }
      }
    });

    this.invalidateReadCaches();
    this.auditLog.write({ action: 'vendor.tour.availability.upserted', actorId: user.id, targetId: tourId, meta: { entries: dto.entries.length } });

    return this.prisma.tourAvailability.findMany({
      where: { tourId },
      orderBy: { date: 'asc' },
      take: 60
    });
  }

  async listBookings(userId: string, query: ListVendorBookingsDto) {
    await this.requireApprovedVendor(userId);
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;

    const where = {
      tour: { vendorId: userId },
      ...(query.status ? { status: query.status } : {})
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          tour: { select: { id: true, title: true, slug: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    };
  }

  async bookingById(userId: string, bookingId: string) {
    await this.requireApprovedVendor(userId);

    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        tour: {
          vendorId: userId
        }
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        tour: { select: { id: true, title: true, slug: true } },
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 20 }
      }
    });

    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }

    return booking;
  }

  async updateBookingStatus(userId: string, bookingId: string, dto: UpdateVendorBookingStatusDto) {
    await this.requireApprovedVendor(userId);

    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        tour: { vendorId: userId }
      }
    });

    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }

    this.assertBookingTransition(booking.status, dto.status);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.booking.update({
        where: { id: bookingId },
        data: { status: dto.status }
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: booking.status,
          toStatus: dto.status,
          changedById: userId
        }
      });

      return result;
    });

    this.auditLog.write({ action: 'vendor.booking.status.updated', actorId: userId, targetId: bookingId, meta: { status: dto.status } });
    return updated;
  }

  async listReviews(userId: string) {
    await this.requireApprovedVendor(userId);

    return this.prisma.review.findMany({
      where: {
        tour: {
          vendorId: userId
        }
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        tour: { select: { id: true, title: true } },
        vendorResponses: {
          where: { vendorId: userId },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async respondReview(userId: string, reviewId: string, dto: RespondVendorReviewDto) {
    await this.requireApprovedVendor(userId);

    const review = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        tour: {
          vendorId: userId
        }
      },
      select: { id: true }
    });

    if (!review) {
      throw new NotFoundException({ code: 'REVIEW_NOT_FOUND', message: 'Review not found' });
    }

    const existingResponse = await this.prisma.vendorResponse.findFirst({
      where: {
        reviewId,
        vendorId: userId
      }
    });

    const response = existingResponse
      ? await this.prisma.vendorResponse.update({
          where: { id: existingResponse.id },
          data: { comment: dto.comment }
        })
      : await this.prisma.vendorResponse.create({
          data: {
            reviewId,
            vendorId: userId,
            comment: dto.comment
          }
        });

    this.auditLog.write({ action: 'vendor.review.responded', actorId: userId, targetId: reviewId });
    return response;
  }

  private async requireApprovedVendor(userId: string): Promise<void> {
    const profile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
      select: { approvalStatus: true }
    });

    if (!profile) {
      throw new NotFoundException({ code: 'VENDOR_PROFILE_NOT_FOUND', message: 'Vendor profile not found' });
    }

    if (profile.approvalStatus !== VendorApprovalStatus.APPROVED) {
      throw new ForbiddenException({
        code: 'VENDOR_NOT_APPROVED',
        message: 'Vendor account is not approved for this operation'
      });
    }
  }

  private async assertTourOwnership(userId: string, tourId: string) {
    const tour = await this.prisma.tour.findFirst({
      where: {
        id: tourId,
        vendorId: userId
      }
    });

    if (!tour) {
      throw new NotFoundException({ code: 'TOUR_NOT_FOUND', message: 'Tour not found' });
    }

    return tour;
  }

  private assertBookingTransition(current: BookingStatus, next: BookingStatus): void {
    if (current === next) {
      return;
    }

    const allowed: Record<BookingStatus, BookingStatus[]> = {
      DRAFT: [BookingStatus.PENDING_PAYMENT],
      PENDING_PAYMENT: [BookingStatus.CANCELLED],
      PAID: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      CANCELLED: [],
      COMPLETED: []
    };

    if (!allowed[current]?.includes(next)) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_STATUS_TRANSITION',
        message: `Cannot transition booking from ${current} to ${next}`
      });
    }
  }

  private invalidateReadCaches(): void {
    this.cache.clearPrefix('tours:list:');
    this.cache.clearPrefix('tours:map:');
    this.cache.clearPrefix('vendor:dashboard:');
  }
}
