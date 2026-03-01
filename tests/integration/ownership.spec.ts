import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

import { loginViaApi } from '../fixtures/auth.js';

const prisma = new PrismaClient();

test('enforces booking ownership guard', async ({ request }) => {
  const client = await prisma.user.findUniqueOrThrow({ where: { email: 'client@tourdevino.local' } });
  const vendor = await prisma.user.findUniqueOrThrow({ where: { email: 'vendor@tourdevino.local' } });
  const tour = await prisma.tour.findFirstOrThrow({ where: { vendorId: vendor.id } });

  const booking = await prisma.booking.create({
    data: {
      userId: client.id,
      tourId: tour.id,
      guestCount: 2,
      scheduledAt: new Date(),
      totalCents: 10000
    }
  });

  const vendorTokens = await loginViaApi(request, 'vendor@tourdevino.local', 'Password123!');
  const denied = await request.get(`/api/demo/bookings/${booking.id}`, {
    headers: {
      Authorization: `Bearer ${vendorTokens.accessToken}`
    }
  });

  expect(denied.status()).toBe(403);

  const clientTokens = await loginViaApi(request, 'client@tourdevino.local', 'Password123!');
  const allowed = await request.get(`/api/demo/bookings/${booking.id}`, {
    headers: {
      Authorization: `Bearer ${clientTokens.accessToken}`
    }
  });
  expect(allowed.status()).toBe(200);

  await prisma.booking.delete({ where: { id: booking.id } });
  await prisma.$disconnect();
});
