import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';

import { PrismaService } from '../../common/services/prisma.service.js';

@Injectable()
export class PaymentsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createIntent(userId: string, bookingId: string, idempotencyKey?: string) {
    if (idempotencyKey) {
      const existing = await this.prisma.payment.findFirst({ where: { idempotencyKey } });
      if (existing) {
        const bookingForPayment = await this.prisma.booking.findUnique({ where: { id: existing.bookingId } });
        if (!bookingForPayment || bookingForPayment.userId !== userId) {
          throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Payment access denied' });
        }

        return {
          id: existing.id,
          bookingId: existing.bookingId,
          paymentStatus: existing.status,
          providerRef: existing.providerRef,
          amount: existing.amountCents,
          currency: existing.currency,
          updatedAt: existing.updatedAt
        };
      }
    }

    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }
    if (booking.userId !== userId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Payment access denied' });
    }
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException({ code: 'BOOKING_CANCELLED', message: 'Cannot pay for cancelled booking' });
    }

    const payment = await this.prisma.payment.create({
      data: {
        bookingId,
        idempotencyKey,
        provider: 'stripe',
        providerRef: `pi_${Math.random().toString(36).slice(2, 12)}`,
        amountCents: booking.totalCents,
        status: PaymentStatus.PENDING
      }
    });

    return {
      id: payment.id,
      bookingId: payment.bookingId,
      paymentStatus: payment.status,
      providerRef: payment.providerRef,
      amount: payment.amountCents,
      currency: payment.currency,
      updatedAt: payment.updatedAt
    };
  }

  async paymentStatus(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }
    if (booking.userId !== userId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Payment access denied' });
    }

    const payment = await this.prisma.payment.findFirst({
      where: { bookingId },
      orderBy: { createdAt: 'desc' }
    });

    if (!payment) {
      return {
        paymentStatus: 'PENDING',
        providerRef: null,
        amount: booking.totalCents,
        currency: 'USD',
        updatedAt: booking.updatedAt
      };
    }

    return {
      paymentStatus: payment.status,
      providerRef: payment.providerRef,
      amount: payment.amountCents,
      currency: payment.currency,
      updatedAt: payment.updatedAt
    };
  }

  async webhook(payload: { providerRef?: string; status?: 'succeeded' | 'failed' }, signatureHeader: string | undefined, rawBody: string) {
    this.verifyWebhookSignature(signatureHeader, rawBody);

    if (!payload.providerRef || !payload.status) {
      throw new BadRequestException({ code: 'INVALID_WEBHOOK', message: 'Invalid webhook payload' });
    }

    const payment = await this.prisma.payment.findFirst({ where: { providerRef: payload.providerRef } });
    if (!payment) {
      throw new NotFoundException({ code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' });
    }

    await this.reconcilePaymentStatus(payment.id, payload.status);

    return { success: true };
  }

  async simulate(userId: string, bookingId: string, status: 'succeeded' | 'failed') {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }
    if (booking.userId !== userId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Payment access denied' });
    }

    const payment = await this.prisma.payment.findFirst({
      where: { bookingId },
      orderBy: { createdAt: 'desc' }
    });

    if (!payment) {
      throw new NotFoundException({ code: 'PAYMENT_NOT_FOUND', message: 'No payment intent exists for this booking' });
    }

    await this.reconcilePaymentStatus(payment.id, status);
    return { success: true };
  }

  private async reconcilePaymentStatus(paymentId: string, status: 'succeeded' | 'failed'): Promise<void> {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException({ code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' });
    }

    const nextStatus = status === 'succeeded' ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED;
    const nextBookingStatus = status === 'succeeded' ? 'PAID' : 'PENDING_PAYMENT';

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: nextStatus }
      }),
      this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: nextBookingStatus }
      })
    ]);
  }

  private verifyWebhookSignature(signatureHeader: string | undefined, rawBody: string): void {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      return;
    }

    if (!signatureHeader) {
      throw new BadRequestException({ code: 'INVALID_WEBHOOK_SIGNATURE', message: 'Missing webhook signature' });
    }

    const signature = this.extractSignature(signatureHeader);
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');

    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
      throw new BadRequestException({ code: 'INVALID_WEBHOOK_SIGNATURE', message: 'Invalid webhook signature' });
    }
  }

  private extractSignature(signatureHeader: string): string {
    const trimmed = signatureHeader.trim();
    if (trimmed.startsWith('sha256=')) {
      return trimmed.slice('sha256='.length);
    }

    const segments = trimmed.split(',').map((segment) => segment.trim());
    const v1 = segments.find((segment) => segment.startsWith('v1='));
    if (v1) {
      return v1.slice('v1='.length);
    }

    return trimmed;
  }
}
