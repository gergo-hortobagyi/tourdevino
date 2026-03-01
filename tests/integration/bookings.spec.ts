import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { createHmac } from 'node:crypto';

import { loginViaApi } from '../fixtures/auth.js';

const prisma = new PrismaClient();

function webhookSignature(payload: unknown): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? 'test_stripe_webhook_secret';
  const rawBody = JSON.stringify(payload);
  const digest = createHmac('sha256', secret).update(rawBody).digest('hex');
  return `sha256=${digest}`;
}

test.describe('bookings api', () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('idempotent booking create returns the same booking and does not double book capacity', async ({ request }) => {
    const tokens = await loginViaApi(request, 'client@tourdevino.local', 'Password123!');

    const slot = await prisma.tourAvailability.findFirstOrThrow({
      where: {
        tour: {
          slug: 'napa-sunset-tasting'
        }
      },
      orderBy: { date: 'asc' }
    });

    const key = `booking-idem-${Date.now()}`;

    const first = await request.post('/api/bookings', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'idempotency-key': key
      },
      data: {
        tourId: slot.tourId,
        scheduledAt: new Date(slot.date).toISOString(),
        guestCount: 2
      }
    });
    expect(first.ok()).toBeTruthy();
    const firstBody = (await first.json()) as { data: { id: string } };

    const second = await request.post('/api/bookings', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'idempotency-key': key
      },
      data: {
        tourId: slot.tourId,
        scheduledAt: new Date(slot.date).toISOString(),
        guestCount: 2
      }
    });
    expect(second.ok()).toBeTruthy();
    const secondBody = (await second.json()) as { data: { id: string } };

    expect(secondBody.data.id).toBe(firstBody.data.id);

    const updatedSlot = await prisma.tourAvailability.findUniqueOrThrow({
      where: {
        tourId_date: {
          tourId: slot.tourId,
          date: slot.date
        }
      }
    });

    expect(updatedSlot.bookedCount - slot.bookedCount).toBe(2);
  });

  test('idempotent payment intent create returns same payment', async ({ request }) => {
    const tokens = await loginViaApi(request, 'client@tourdevino.local', 'Password123!');

    const booking = await prisma.booking.findFirstOrThrow({
      where: {
        user: { email: 'client@tourdevino.local' },
        status: 'PENDING_PAYMENT'
      },
      orderBy: { createdAt: 'desc' }
    });

    const key = `payment-idem-${Date.now()}`;

    const firstIntent = await request.post('/api/payments/intents', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'idempotency-key': key
      },
      data: {
        bookingId: booking.id
      }
    });
    expect(firstIntent.ok()).toBeTruthy();
    const firstBody = (await firstIntent.json()) as { data: { id: string } };

    const secondIntent = await request.post('/api/payments/intents', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'idempotency-key': key
      },
      data: {
        bookingId: booking.id
      }
    });
    expect(secondIntent.ok()).toBeTruthy();
    const secondBody = (await secondIntent.json()) as { data: { id: string } };

    expect(secondBody.data.id).toBe(firstBody.data.id);
  });

  test('webhook signature verification and reconciliation updates payment status', async ({ request }) => {
    const tokens = await loginViaApi(request, 'client@tourdevino.local', 'Password123!');

    const booking = await prisma.booking.findFirstOrThrow({
      where: {
        user: { email: 'client@tourdevino.local' },
        status: 'PENDING_PAYMENT'
      },
      orderBy: { createdAt: 'desc' }
    });

    const intent = await request.post('/api/payments/intents', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'idempotency-key': `webhook-intent-${Date.now()}`
      },
      data: {
        bookingId: booking.id
      }
    });
    expect(intent.ok()).toBeTruthy();
    const intentBody = (await intent.json()) as { data: { providerRef: string } };

    const failedPayload = {
      providerRef: intentBody.data.providerRef,
      status: 'failed' as const
    };
    const invalidWebhook = await request.post('/api/payments/webhooks/stripe', {
      headers: {
        'stripe-signature': 'sha256=invalid'
      },
      data: failedPayload
    });
    expect(invalidWebhook.status()).toBe(400);

    const failedWebhook = await request.post('/api/payments/webhooks/stripe', {
      headers: {
        'stripe-signature': webhookSignature(failedPayload)
      },
      data: failedPayload
    });
    expect(failedWebhook.ok()).toBeTruthy();

    const failedStatus = await request.get(`/api/payments/${booking.id}/status`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    });
    const failedStatusBody = (await failedStatus.json()) as { data: { paymentStatus: string } };
    expect(failedStatusBody.data.paymentStatus).toBe('FAILED');

    const successPayload = {
      providerRef: intentBody.data.providerRef,
      status: 'succeeded' as const
    };
    const successWebhook = await request.post('/api/payments/webhooks/stripe', {
      headers: {
        'stripe-signature': webhookSignature(successPayload)
      },
      data: successPayload
    });
    expect(successWebhook.ok()).toBeTruthy();

    const successStatus = await request.get(`/api/payments/${booking.id}/status`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    });
    const successStatusBody = (await successStatus.json()) as { data: { paymentStatus: string } };
    expect(successStatusBody.data.paymentStatus).toBe('SUCCEEDED');
  });

  test('cancellation policy rejects cancellation within configured window', async ({ request }) => {
    const tokens = await loginViaApi(request, 'client@tourdevino.local', 'Password123!');

    const restrictedBooking = await prisma.booking.findFirstOrThrow({
      where: {
        user: { email: 'client@tourdevino.local' },
        status: 'PAID',
        scheduledAt: {
          lt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      }
    });

    const cancel = await request.patch(`/api/bookings/${restrictedBooking.id}/cancel`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    });

    expect(cancel.status()).toBe(400);
    const body = (await cancel.json()) as { error: { code: string } };
    expect(body.error.code).toBe('CANCELLATION_WINDOW_CLOSED');
  });
});
