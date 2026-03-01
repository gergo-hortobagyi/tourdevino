import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

import { loginViaApi } from '../fixtures/auth.js';

const prisma = new PrismaClient();

test.describe('profile and reviews api', () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('client can read and update profile', async ({ request }) => {
    const tokens = await loginViaApi(request, 'client@tourdevino.local', 'Password123!');

    const me = await request.get('/api/users/me', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    });
    expect(me.ok()).toBeTruthy();

    const update = await request.patch('/api/users/me', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      },
      data: {
        firstName: 'CoraUpdated'
      }
    });
    expect(update.ok()).toBeTruthy();

    const updatedBody = (await update.json()) as { data: { firstName: string } };
    expect(updatedBody.data.firstName).toBe('CoraUpdated');
  });

  test('review eligibility + create + edit + delete', async ({ request }) => {
    const tokens = await loginViaApi(request, 'client@tourdevino.local', 'Password123!');

    const completedBooking = await prisma.booking.findFirstOrThrow({
      where: {
        user: { email: 'client@tourdevino.local' },
        status: 'COMPLETED',
        reviews: {
          none: {}
        }
      },
      include: {
        tour: true
      }
    });

    const create = await request.post('/api/reviews', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      },
      data: {
        bookingId: completedBooking.id,
        tourId: completedBooking.tourId,
        rating: 5,
        comment: 'Excellent day, very knowledgeable guide.'
      }
    });
    expect(create.ok()).toBeTruthy();
    const createBody = (await create.json()) as { data: { id: string } };

    const update = await request.patch(`/api/reviews/${createBody.data.id}`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      },
      data: {
        rating: 4,
        comment: 'Updated comment after reflection.'
      }
    });
    expect(update.ok()).toBeTruthy();

    const mine = await request.get('/api/reviews/me', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    });
    expect(mine.ok()).toBeTruthy();
    const mineBody = (await mine.json()) as { data: Array<{ id: string }> };
    expect(mineBody.data.some((review) => review.id === createBody.data.id)).toBeTruthy();

    const remove = await request.delete(`/api/reviews/${createBody.data.id}`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    });
    expect(remove.ok()).toBeTruthy();
  });
});
