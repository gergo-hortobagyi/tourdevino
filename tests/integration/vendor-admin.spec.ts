import { expect, test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

import { loginViaApi } from '../fixtures/auth.js';

const prisma = new PrismaClient();

test.describe('vendor and admin api', () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('health endpoints expose liveness and readiness', async ({ request }) => {
    const live = await request.get('/api/health/live');
    expect(live.ok()).toBeTruthy();
    expect(live.headers()['x-request-id']).toBeTruthy();

    const ready = await request.get('/api/health/ready');
    expect(ready.ok()).toBeTruthy();
    const readyBody = (await ready.json()) as { data: { ok: boolean } };
    expect(readyBody.data.ok).toBeTruthy();
  });

  test('vendor endpoints enforce role and vendor approval', async ({ request }) => {
    const clientTokens = await loginViaApi(request, 'client@tourdevino.local', 'Password123!');
    const clientResponse = await request.get('/api/vendor/dashboard', {
      headers: {
        Authorization: `Bearer ${clientTokens.accessToken}`
      }
    });
    expect(clientResponse.status()).toBe(403);

    const pendingTokens = await loginViaApi(request, 'vendor-pending@tourdevino.local', 'Password123!');
    const pendingResponse = await request.get('/api/vendor/dashboard', {
      headers: {
        Authorization: `Bearer ${pendingTokens.accessToken}`
      }
    });
    expect(pendingResponse.status()).toBe(403);
    const pendingBody = (await pendingResponse.json()) as { error: { code: string } };
    expect(pendingBody.error.code).toBe('VENDOR_NOT_APPROVED');
  });

  test('client can submit vendor application and duplicate submission is blocked', async ({ request }) => {
    const email = `vendor-applicant-${Date.now()}@tourdevino.local`;
    const signup = await request.post('/api/auth/signup', {
      data: {
        email,
        password: 'Password123!',
        firstName: 'Vince',
        lastName: 'Applicant'
      }
    });
    expect(signup.ok()).toBeTruthy();
    const signupBody = (await signup.json()) as { data: { accessToken: string } };

    const first = await request.post('/api/vendor/applications', {
      headers: {
        Authorization: `Bearer ${signupBody.data.accessToken}`
      },
      data: {
        companyName: 'Applicant Cellars',
        description: 'Boutique producer onboarding application',
        payoutProvider: 'stripe',
        payoutAccountMasked: '****6789'
      }
    });
    expect(first.ok()).toBeTruthy();

    const duplicate = await request.post('/api/vendor/applications', {
      headers: {
        Authorization: `Bearer ${signupBody.data.accessToken}`
      },
      data: {
        companyName: 'Applicant Cellars',
        description: 'Duplicate application',
        payoutProvider: 'stripe',
        payoutAccountMasked: '****6789'
      }
    });
    expect(duplicate.status()).toBe(409);
    const duplicateBody = (await duplicate.json()) as { error: { code: string } };
    expect(duplicateBody.error.code).toBe('VENDOR_APPLICATION_PENDING');
  });

  test('vendor can create and update owned tours with availability', async ({ request }) => {
    const vendorTokens = await loginViaApi(request, 'vendor@tourdevino.local', 'Password123!');

    const create = await request.post('/api/vendor/tours', {
      headers: {
        Authorization: `Bearer ${vendorTokens.accessToken}`
      },
      data: {
        title: 'Vendor Integration Tour',
        slug: `vendor-integration-${Date.now()}`,
        description: 'Integration-only tour payload',
        region: 'Napa Valley',
        priceCents: 11100,
        durationHours: 3,
        status: 'DRAFT'
      }
    });

    expect(create.ok()).toBeTruthy();
    const created = (await create.json()) as { data: { id: string } };

    const availability = await request.put(`/api/vendor/tours/${created.data.id}/availability`, {
      headers: {
        Authorization: `Bearer ${vendorTokens.accessToken}`
      },
      data: {
        entries: [
          {
            date: '2026-06-01T00:00:00.000Z',
            capacity: 25
          }
        ]
      }
    });

    expect(availability.ok()).toBeTruthy();

    const updateStatus = await request.patch(`/api/vendor/tours/${created.data.id}/status`, {
      headers: {
        Authorization: `Bearer ${vendorTokens.accessToken}`
      },
      data: {
        status: 'ACTIVE'
      }
    });

    expect(updateStatus.ok()).toBeTruthy();
  });

  test('admin can approve vendor and update user role', async ({ request }) => {
    const adminTokens = await loginViaApi(request, 'admin@tourdevino.local', 'Password123!');

    const pendingVendor = await prisma.vendorProfile.findFirstOrThrow({
      where: {
        user: {
          email: 'vendor-pending@tourdevino.local'
        }
      }
    });

    const approve = await request.patch(`/api/admin/vendors/${pendingVendor.id}/approve`, {
      headers: {
        Authorization: `Bearer ${adminTokens.accessToken}`
      },
      data: {
        reason: 'Approved by integration test'
      }
    });
    expect(approve.ok()).toBeTruthy();

    const clientUser = await prisma.user.findFirstOrThrow({ where: { email: 'client@tourdevino.local' } });
    const roleUpdate = await request.patch(`/api/admin/users/${clientUser.id}/role`, {
      headers: {
        Authorization: `Bearer ${adminTokens.accessToken}`
      },
      data: {
        role: 'CLIENT'
      }
    });

    expect(roleUpdate.ok()).toBeTruthy();
  });

  test('admin content API writes and public API reflects update', async ({ request }) => {
    const adminTokens = await loginViaApi(request, 'admin@tourdevino.local', 'Password123!');

    const pageSlug = `phase7-content-${Date.now()}`;
    const createPage = await request.post('/api/admin/content', {
      headers: {
        Authorization: `Bearer ${adminTokens.accessToken}`
      },
      data: {
        slug: pageSlug,
        title: 'Phase 7 content test',
        body: 'Body managed from admin integration test',
        published: true
      }
    });

    expect(createPage.ok()).toBeTruthy();

    const publicPage = await request.get(`/api/content/${pageSlug}`);
    expect(publicPage.ok()).toBeTruthy();
  });

  test('admin settings can be updated and read back', async ({ request }) => {
    const adminTokens = await loginViaApi(request, 'admin@tourdevino.local', 'Password123!');

    const update = await request.patch('/api/admin/settings', {
      headers: {
        Authorization: `Bearer ${adminTokens.accessToken}`
      },
      data: {
        supportEmail: 'ops@tourdevino.local',
        bookingCancellationWindowHours: 48,
        webhookProvider: 'stripe'
      }
    });
    expect(update.ok()).toBeTruthy();

    const read = await request.get('/api/admin/settings', {
      headers: {
        Authorization: `Bearer ${adminTokens.accessToken}`
      }
    });
    expect(read.ok()).toBeTruthy();
    const body = (await read.json()) as { data: { supportEmail: string; bookingCancellationWindowHours: number } };
    expect(body.data.supportEmail).toBe('ops@tourdevino.local');
    expect(body.data.bookingCancellationWindowHours).toBe(48);
  });
});
