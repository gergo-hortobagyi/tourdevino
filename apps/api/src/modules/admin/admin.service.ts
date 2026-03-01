import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { BookingStatus, PaymentStatus, Role, TourStatus, UserStatus, VendorApprovalStatus } from '@prisma/client';

import { AuditLogService } from '../../common/services/audit-log.service.js';
import { CacheService } from '../../common/services/cache.service.js';
import { PrismaService } from '../../common/services/prisma.service.js';
import { type AuthenticatedUser } from '../auth/auth.types.js';
import { AdminCancelBookingDto } from './dto/admin-cancel-booking.dto.js';
import { PatchContentPageDto, PatchFaqDto, UpsertContentPageDto, UpsertFaqDto } from './dto/admin-content.dto.js';
import { AdminQueryDto } from './dto/admin-query.dto.js';
import { AdminRefundDto } from './dto/admin-refund.dto.js';
import { ListAdminBookingsDto } from './dto/list-admin-bookings.dto.js';
import { ListAdminToursDto } from './dto/list-admin-tours.dto.js';
import { ListAdminUsersDto } from './dto/list-admin-users.dto.js';
import { ListAdminVendorsDto } from './dto/list-admin-vendors.dto.js';
import { ReportsQueryDto } from './dto/reports-query.dto.js';
import { UpdateAdminTourStatusDto } from './dto/update-admin-tour-status.dto.js';
import { UpdateAdminUserRoleDto, UpdateAdminUserStatusDto } from './dto/update-admin-user.dto.js';
import { VendorDecisionDto } from './dto/vendor-decision.dto.js';
import { ModerateReviewDto } from './dto/moderate-review.dto.js';
import { CreateAdminTourDto, UpdateAdminTourDto } from './dto/upsert-admin-tour.dto.js';
import { UpdateAdminSettingsDto } from './dto/admin-settings.dto.js';

@Injectable()
export class AdminService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditLogService) private readonly auditLog: AuditLogService,
    @Inject(CacheService) private readonly cache: CacheService
  ) {}

  async dashboard(): Promise<Record<string, unknown>> {
    const cacheKey = 'admin:dashboard';
    const cached = this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) {
      return cached;
    }

    const [totalUsers, pendingVendors, totalTours, activeTours, paidBookings, pendingBookings, grossRevenue] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.vendorProfile.count({ where: { approvalStatus: VendorApprovalStatus.PENDING } }),
      this.prisma.tour.count(),
      this.prisma.tour.count({ where: { status: TourStatus.ACTIVE } }),
      this.prisma.booking.count({ where: { status: BookingStatus.PAID } }),
      this.prisma.booking.count({ where: { status: BookingStatus.PENDING_PAYMENT } }),
      this.prisma.booking.aggregate({
        where: {
          status: {
            in: [BookingStatus.PAID, BookingStatus.COMPLETED]
          }
        },
        _sum: {
          totalCents: true
        }
      })
    ]);

    const payload = {
      totalUsers,
      pendingVendors,
      totalTours,
      activeTours,
      paidBookings,
      pendingBookings,
      grossRevenueCents: grossRevenue._sum.totalCents ?? 0
    };

    this.cache.set(cacheKey, payload, 30_000);
    return payload;
  }

  async settings() {
    const stored = await this.prisma.appSetting.findUnique({
      where: { key: 'platform' }
    });

    if (!stored) {
      return {
        supportEmail: 'support@tourdevino.local',
        bookingCancellationWindowHours: 24,
        webhookProvider: 'stripe'
      };
    }

    return stored.value as Record<string, unknown>;
  }

  async updateSettings(admin: AuthenticatedUser, dto: UpdateAdminSettingsDto) {
    const current = await this.settings();
    const next = {
      ...current,
      ...(dto.supportEmail !== undefined ? { supportEmail: dto.supportEmail } : {}),
      ...(dto.bookingCancellationWindowHours !== undefined
        ? { bookingCancellationWindowHours: dto.bookingCancellationWindowHours }
        : {}),
      ...(dto.webhookProvider !== undefined ? { webhookProvider: dto.webhookProvider } : {})
    };

    const saved = await this.prisma.appSetting.upsert({
      where: { key: 'platform' },
      update: {
        value: next,
        updatedById: admin.id
      },
      create: {
        key: 'platform',
        value: next,
        updatedById: admin.id
      }
    });

    this.auditLog.write({ action: 'admin.settings.updated', actorId: admin.id, targetId: saved.id });
    return saved.value as Record<string, unknown>;
  }

  async listUsers(query: ListAdminUsersDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 25;

    const where = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.email ? { email: query.email } : {}),
      ...(query.query
        ? {
            OR: [
              { email: { contains: query.query, mode: 'insensitive' as const } },
              { firstName: { contains: query.query, mode: 'insensitive' as const } },
              { lastName: { contains: query.query, mode: 'insensitive' as const } }
            ]
          }
        : {})
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
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

  async userById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        vendorProfile: true
      }
    });

    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    return user;
  }

  async updateUserRole(admin: AuthenticatedUser, userId: string, dto: UpdateAdminUserRoleDto) {
    if (admin.id === userId && dto.role !== Role.ADMIN) {
      throw new BadRequestException({ code: 'INVALID_ROLE_CHANGE', message: 'Admin cannot remove own admin role' });
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role }
    });

    if (dto.role === Role.VENDOR) {
      await this.prisma.vendorProfile.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          companyName: `${user.firstName} ${user.lastName} Tours`
        }
      });
    }

    this.auditLog.write({ action: 'admin.user.role.updated', actorId: admin.id, targetId: userId, meta: { role: dto.role } });
    return user;
  }

  async updateUserStatus(admin: AuthenticatedUser, userId: string, dto: UpdateAdminUserStatusDto) {
    if (admin.id === userId && dto.status !== UserStatus.ACTIVE) {
      throw new BadRequestException({ code: 'INVALID_STATUS_CHANGE', message: 'Admin cannot ban own account' });
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: dto.status }
    });

    this.auditLog.write({ action: 'admin.user.status.updated', actorId: admin.id, targetId: userId, meta: { status: dto.status } });
    return user;
  }

  async listVendors(query: ListAdminVendorsDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 25;

    const where = {
      ...(query.approvalStatus ? { approvalStatus: query.approvalStatus } : {}),
      ...(query.query
        ? {
            OR: [
              { companyName: { contains: query.query, mode: 'insensitive' as const } },
              { user: { email: { contains: query.query, mode: 'insensitive' as const } } }
            ]
          }
        : {})
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.vendorProfile.count({ where }),
      this.prisma.vendorProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              status: true
            }
          }
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

  async vendorById(vendorId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true
          }
        }
      }
    });

    if (!vendor) {
      throw new NotFoundException({ code: 'VENDOR_NOT_FOUND', message: 'Vendor not found' });
    }

    return vendor;
  }

  async approveVendor(admin: AuthenticatedUser, vendorId: string, dto: VendorDecisionDto) {
    const vendor = await this.prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        approvalStatus: VendorApprovalStatus.APPROVED,
        rejectionReason: dto.reason ?? null,
        reviewedAt: new Date(),
        reviewedById: admin.id
      }
    });

    this.auditLog.write({ action: 'admin.vendor.approved', actorId: admin.id, targetId: vendorId, meta: { note: dto.reason ?? null } });
    return vendor;
  }

  async rejectVendor(admin: AuthenticatedUser, vendorId: string, dto: VendorDecisionDto) {
    const vendor = await this.prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        approvalStatus: VendorApprovalStatus.REJECTED,
        rejectionReason: dto.reason ?? 'Not approved',
        reviewedAt: new Date(),
        reviewedById: admin.id
      }
    });

    this.auditLog.write({ action: 'admin.vendor.rejected', actorId: admin.id, targetId: vendorId, meta: { note: dto.reason ?? null } });
    return vendor;
  }

  async listTours(query: ListAdminToursDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 25;

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.query
        ? {
            OR: [
              { title: { contains: query.query, mode: 'insensitive' as const } },
              { region: { contains: query.query, mode: 'insensitive' as const } },
              { slug: { contains: query.query, mode: 'insensitive' as const } }
            ]
          }
        : {})
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.tour.count({ where }),
      this.prisma.tour.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
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

  async updateTourStatus(admin: AuthenticatedUser, tourId: string, dto: UpdateAdminTourStatusDto) {
    const tour = await this.prisma.tour.update({
      where: { id: tourId },
      data: { status: dto.status }
    });

    this.invalidateReadCaches();
    this.auditLog.write({ action: 'admin.tour.status.updated', actorId: admin.id, targetId: tourId, meta: { status: dto.status } });
    return tour;
  }

  async tourById(tourId: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
      include: {
        vendor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!tour) {
      throw new NotFoundException({ code: 'TOUR_NOT_FOUND', message: 'Tour not found' });
    }

    return tour;
  }

  async createTour(admin: AuthenticatedUser, dto: CreateAdminTourDto) {
    const vendor = await this.prisma.user.findUnique({ where: { id: dto.vendorId } });
    if (!vendor || vendor.role !== Role.VENDOR) {
      throw new BadRequestException({ code: 'INVALID_VENDOR_ID', message: 'Tour must belong to a vendor account' });
    }

    const existingSlug = await this.prisma.tour.findUnique({ where: { slug: dto.slug } });
    if (existingSlug) {
      throw new ConflictException({ code: 'TOUR_SLUG_TAKEN', message: 'Tour slug already in use' });
    }

    const tour = await this.prisma.tour.create({
      data: {
        vendorId: dto.vendorId,
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        region: dto.region,
        priceCents: dto.priceCents,
        durationHours: dto.durationHours,
        status: dto.status ?? TourStatus.DRAFT
      }
    });

    this.invalidateReadCaches();
    this.auditLog.write({ action: 'admin.tour.created', actorId: admin.id, targetId: tour.id });
    return tour;
  }

  async updateTour(admin: AuthenticatedUser, tourId: string, dto: UpdateAdminTourDto) {
    if (dto.vendorId) {
      const vendor = await this.prisma.user.findUnique({ where: { id: dto.vendorId } });
      if (!vendor || vendor.role !== Role.VENDOR) {
        throw new BadRequestException({ code: 'INVALID_VENDOR_ID', message: 'Tour must belong to a vendor account' });
      }
    }

    if (dto.slug) {
      const existingSlug = await this.prisma.tour.findFirst({ where: { slug: dto.slug, id: { not: tourId } } });
      if (existingSlug) {
        throw new ConflictException({ code: 'TOUR_SLUG_TAKEN', message: 'Tour slug already in use' });
      }
    }

    const tour = await this.prisma.tour.update({
      where: { id: tourId },
      data: {
        ...(dto.vendorId !== undefined ? { vendorId: dto.vendorId } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.region !== undefined ? { region: dto.region } : {}),
        ...(dto.priceCents !== undefined ? { priceCents: dto.priceCents } : {}),
        ...(dto.durationHours !== undefined ? { durationHours: dto.durationHours } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {})
      }
    });

    this.invalidateReadCaches();
    this.auditLog.write({ action: 'admin.tour.updated', actorId: admin.id, targetId: tour.id });
    return tour;
  }

  async listBookings(query: ListAdminBookingsDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 25;

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.query
        ? {
            OR: [
              { id: { contains: query.query, mode: 'insensitive' as const } },
              { user: { email: { contains: query.query, mode: 'insensitive' as const } } },
              { tour: { title: { contains: query.query, mode: 'insensitive' as const } } }
            ]
          }
        : {})
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          tour: { select: { id: true, slug: true, title: true, vendorId: true } },
          payments: { orderBy: { createdAt: 'desc' }, take: 1 }
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

  async bookingById(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        tour: { select: { id: true, title: true, slug: true, vendorId: true } },
        payments: { include: { refunds: true }, orderBy: { createdAt: 'desc' } },
        statusHistory: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }

    return booking;
  }

  async cancelBooking(admin: AuthenticatedUser, bookingId: string, dto: AdminCancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return booking;
    }

    const dateOnly = new Date(booking.scheduledAt.toISOString().slice(0, 10));

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED }
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: booking.status,
          toStatus: BookingStatus.CANCELLED,
          changedById: admin.id
        }
      });

      await tx.tourAvailability.updateMany({
        where: {
          tourId: booking.tourId,
          date: dateOnly
        },
        data: {
          bookedCount: {
            decrement: booking.guestCount
          }
        }
      });

      return result;
    });

    this.auditLog.write({ action: 'admin.booking.cancelled', actorId: admin.id, targetId: bookingId, meta: { reason: dto.reason ?? null } });
    return updated;
  }

  async refundPayment(admin: AuthenticatedUser, bookingId: string, dto: AdminRefundDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: {
          where: {
            status: PaymentStatus.SUCCEEDED
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { refunds: true }
        }
      }
    });

    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }

    const payment = booking.payments[0];
    if (!payment) {
      throw new BadRequestException({ code: 'PAYMENT_NOT_ELIGIBLE_FOR_REFUND', message: 'No successful payment found' });
    }

    const refundedAlready = payment.refunds.reduce((sum, refund) => sum + refund.amountCents, 0);
    const refundable = payment.amountCents - refundedAlready;
    const amountCents = dto.amountCents ?? refundable;

    if (amountCents <= 0 || amountCents > refundable) {
      throw new BadRequestException({ code: 'INVALID_REFUND_AMOUNT', message: 'Refund amount exceeds refundable balance' });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const refund = await tx.refund.create({
        data: {
          paymentId: payment.id,
          amountCents,
          reason: dto.reason,
          providerRef: `rf_${Math.random().toString(36).slice(2, 10)}`
        }
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: amountCents === refundable ? PaymentStatus.REFUNDED : PaymentStatus.SUCCEEDED
        }
      });

      if (booking.status !== BookingStatus.CANCELLED) {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CANCELLED }
        });
        await tx.bookingStatusHistory.create({
          data: {
            bookingId,
            fromStatus: booking.status,
            toStatus: BookingStatus.CANCELLED,
            changedById: admin.id
          }
        });
      }

      return refund;
    });

    this.auditLog.write({ action: 'admin.payment.refunded', actorId: admin.id, targetId: bookingId, meta: { amountCents } });
    return result;
  }

  async listContent(query: AdminQueryDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 25;

    const [pagesTotal, pages, faqTotal, faq] = await this.prisma.$transaction([
      this.prisma.contentPage.count(),
      this.prisma.contentPage.findMany({
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.fAQ.count(),
      this.prisma.fAQ.findMany({
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      pages,
      faq,
      meta: {
        page,
        pageSize,
        pagesTotal,
        faqTotal
      }
    };
  }

  async createContentPage(admin: AuthenticatedUser, dto: UpsertContentPageDto) {
    const exists = await this.prisma.contentPage.findUnique({ where: { slug: dto.slug } });
    if (exists) {
      throw new ConflictException({ code: 'CONTENT_SLUG_EXISTS', message: 'Content slug already exists' });
    }

    const page = await this.prisma.contentPage.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        body: dto.body,
        published: dto.published ?? true,
        updatedById: admin.id
      }
    });

    this.invalidateReadCaches();
    this.auditLog.write({ action: 'admin.content.created', actorId: admin.id, targetId: page.id });
    return page;
  }

  async updateContentPage(admin: AuthenticatedUser, id: string, dto: PatchContentPageDto) {
    const page = await this.prisma.contentPage.update({
      where: { id },
      data: {
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.published !== undefined ? { published: dto.published } : {}),
        updatedById: admin.id
      }
    });

    this.invalidateReadCaches();
    this.auditLog.write({ action: 'admin.content.updated', actorId: admin.id, targetId: page.id });
    return page;
  }

  async deleteContentPage(admin: AuthenticatedUser, id: string) {
    await this.prisma.contentPage.delete({ where: { id } });
    this.invalidateReadCaches();
    this.auditLog.write({ action: 'admin.content.deleted', actorId: admin.id, targetId: id });
    return { success: true };
  }

  async createFaq(admin: AuthenticatedUser, dto: UpsertFaqDto) {
    const item = await this.prisma.fAQ.create({
      data: {
        question: dto.question,
        answer: dto.answer,
        sortOrder: dto.sortOrder ?? 0,
        published: dto.published ?? true,
        updatedById: admin.id
      }
    });

    this.invalidateReadCaches();
    this.auditLog.write({ action: 'admin.faq.created', actorId: admin.id, targetId: item.id });
    return item;
  }

  async updateFaq(admin: AuthenticatedUser, id: string, dto: PatchFaqDto) {
    const item = await this.prisma.fAQ.update({
      where: { id },
      data: {
        ...(dto.question !== undefined ? { question: dto.question } : {}),
        ...(dto.answer !== undefined ? { answer: dto.answer } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.published !== undefined ? { published: dto.published } : {}),
        updatedById: admin.id
      }
    });

    this.invalidateReadCaches();
    this.auditLog.write({ action: 'admin.faq.updated', actorId: admin.id, targetId: item.id });
    return item;
  }

  async deleteFaq(admin: AuthenticatedUser, id: string) {
    await this.prisma.fAQ.delete({ where: { id } });
    this.invalidateReadCaches();
    this.auditLog.write({ action: 'admin.faq.deleted', actorId: admin.id, targetId: id });
    return { success: true };
  }

  async moderateReview(admin: AuthenticatedUser, reviewId: string, dto: ModerateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException({ code: 'REVIEW_NOT_FOUND', message: 'Review not found' });
    }

    if (dto.action === 'REMOVE') {
      await this.prisma.vendorResponse.deleteMany({ where: { reviewId } });
      await this.prisma.review.delete({ where: { id: reviewId } });
      this.invalidateReadCaches();
      this.auditLog.write({ action: 'admin.review.removed', actorId: admin.id, targetId: reviewId });
      return { success: true };
    }

    throw new BadRequestException({ code: 'INVALID_REVIEW_MODERATION_ACTION', message: 'Unsupported review moderation action' });
  }

  async analyticsOverview() {
    const [clients, vendors, admins, pendingPayment, paid, cancelled, completed] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: Role.CLIENT } }),
      this.prisma.user.count({ where: { role: Role.VENDOR } }),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
      this.prisma.booking.count({ where: { status: BookingStatus.PENDING_PAYMENT } }),
      this.prisma.booking.count({ where: { status: BookingStatus.PAID } }),
      this.prisma.booking.count({ where: { status: BookingStatus.CANCELLED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.COMPLETED } })
    ]);

    return {
      usersByRole: [
        { role: Role.CLIENT, count: clients },
        { role: Role.VENDOR, count: vendors },
        { role: Role.ADMIN, count: admins }
      ],
      bookingsByStatus: [
        { status: BookingStatus.PENDING_PAYMENT, count: pendingPayment },
        { status: BookingStatus.PAID, count: paid },
        { status: BookingStatus.CANCELLED, count: cancelled },
        { status: BookingStatus.COMPLETED, count: completed }
      ]
    };
  }

  async revenueReport(query: ReportsQueryDto) {
    const range = this.resolveDateRange(query);
    const cacheKey = `reports:revenue:${range.from.toISOString()}:${range.to.toISOString()}:${query.granularity ?? 'day'}`;
    const cached = this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) {
      return cached;
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        createdAt: {
          gte: range.from,
          lte: range.to
        },
        status: {
          in: [BookingStatus.PAID, BookingStatus.COMPLETED]
        }
      },
      select: {
        createdAt: true,
        totalCents: true
      }
    });

    const grouped = new Map<string, number>();
    for (const booking of bookings) {
      const key = this.groupKey(booking.createdAt, query.granularity ?? 'day');
      grouped.set(key, (grouped.get(key) ?? 0) + booking.totalCents);
    }

    const data = [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, revenueCents]) => ({ period, revenueCents }));

    const payload = {
      data,
      meta: {
        from: range.from,
        to: range.to,
        granularity: query.granularity ?? 'day',
        totalRevenueCents: data.reduce((sum, item) => sum + item.revenueCents, 0)
      }
    };

    this.cache.set(cacheKey, payload, 60_000);
    return payload;
  }

  async conversionReport(query: ReportsQueryDto) {
    const range = this.resolveDateRange(query);
    const cacheKey = `reports:conversion:${range.from.toISOString()}:${range.to.toISOString()}:${query.granularity ?? 'day'}`;
    const cached = this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) {
      return cached;
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        createdAt: {
          gte: range.from,
          lte: range.to
        }
      },
      select: {
        createdAt: true,
        status: true
      }
    });

    const grouped = new Map<string, { total: number; paid: number }>();
    for (const booking of bookings) {
      const key = this.groupKey(booking.createdAt, query.granularity ?? 'day');
      const current = grouped.get(key) ?? { total: 0, paid: 0 };
      current.total += 1;
      if (booking.status === BookingStatus.PAID || booking.status === BookingStatus.COMPLETED) {
        current.paid += 1;
      }
      grouped.set(key, current);
    }

    const data = [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, values]) => ({
        period,
        totalBookings: values.total,
        paidBookings: values.paid,
        conversionRate: values.total > 0 ? Number(((values.paid / values.total) * 100).toFixed(2)) : 0
      }));

    const payload = {
      data,
      meta: {
        from: range.from,
        to: range.to,
        granularity: query.granularity ?? 'day'
      }
    };

    this.cache.set(cacheKey, payload, 60_000);
    return payload;
  }

  private resolveDateRange(query: ReportsQueryDto): { from: Date; to: Date } {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from ? new Date(query.from) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException({ code: 'INVALID_DATE_RANGE', message: 'Invalid report date range' });
    }

    if (from > to) {
      throw new BadRequestException({ code: 'INVALID_DATE_RANGE', message: 'from must be before to' });
    }

    const maxRangeMs = 366 * 24 * 60 * 60 * 1000;
    if (to.getTime() - from.getTime() > maxRangeMs) {
      throw new ForbiddenException({ code: 'DATE_RANGE_TOO_LARGE', message: 'Date range exceeds 366 days' });
    }

    return { from, to };
  }

  private groupKey(date: Date, granularity: 'day' | 'week' | 'month'): string {
    const d = new Date(date);
    const y = d.getUTCFullYear();
    const m = `${d.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${d.getUTCDate()}`.padStart(2, '0');

    if (granularity === 'month') {
      return `${y}-${m}`;
    }

    if (granularity === 'week') {
      const onejan = new Date(Date.UTC(y, 0, 1));
      const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getUTCDay() + 1) / 7);
      return `${y}-W${`${week}`.padStart(2, '0')}`;
    }

    return `${y}-${m}-${day}`;
  }

  private invalidateReadCaches(): void {
    this.cache.clearPrefix('tours:list:');
    this.cache.clearPrefix('reports:');
    this.cache.clearPrefix('admin:dashboard');
    this.cache.clearPrefix('content:page:');
    this.cache.clearPrefix('content:faq:');
  }
}
