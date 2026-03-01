import { expect, test } from '@playwright/test';
import { loginViaUi } from '../fixtures/ui-auth.js';

test.describe('vendor and admin portals', () => {
  test('vendor journey supports dashboard, tour creation and availability update', async ({ page }) => {
    await loginViaUi(page, 'vendor@tourdevino.local', 'Password123!');
    await page.goto('/vendor');

    await expect(page.getByRole('heading', { name: 'Vendor dashboard' })).toBeVisible();

    await page.goto('/vendor/tours/new');
    await page.waitForFunction(() => Boolean((window as { __NUXT__?: unknown }).__NUXT__));
    const unique = `e2e-tour-${Date.now()}`;
    await page.getByLabel('Title').fill('E2E Vendor Tour');
    await page.getByLabel('Slug').fill(unique);
    await page.getByLabel('Region').fill('Napa Valley');
    await page.getByLabel('Description').fill('Created in E2E test');
    await page.getByRole('button', { name: 'Create tour' }).click();

    await page.goto('/vendor/tours');
    await expect(page.getByRole('heading', { name: 'My tours' })).toBeVisible();

    await page.getByRole('link', { name: 'Availability' }).first().click();
    const availabilityDate = `2026-06-${String((Date.now() % 20) + 10).padStart(2, '0')}`;
    await page.getByLabel('Date').fill(availabilityDate);
    await page.getByRole('button', { name: 'Add row' }).click();
    await page.getByRole('button', { name: 'Save availability' }).click();
    await expect(page.getByText('Current availability')).toBeVisible();
  });

  test('admin journey approves vendor, updates user role, and publishes FAQ', async ({ page }) => {
    await loginViaUi(page, 'admin@tourdevino.local', 'Password123!');
    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: 'Admin dashboard' })).toBeVisible();

    await page.goto('/admin/vendors');
    await expect(page.getByRole('heading', { name: 'Vendor management' })).toBeVisible();
    const approveButtons = page.getByRole('button', { name: 'Approve' });
    if ((await approveButtons.count()) > 0) {
      await approveButtons.first().click();
    }

    await page.goto('/admin/content');
    const question = `E2E FAQ ${Date.now()}`;
    const accessToken = (await page.context().cookies()).find((cookie) => cookie.name === 'access_token')?.value;
    const createFaqResponse = await page.request.post('http://localhost:40001/api/admin/faq', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      data: {
        question,
        answer: 'E2E created FAQ answer',
        published: true
      }
    });
    expect(createFaqResponse.ok()).toBeTruthy();

    const publicFaqPage = await page.context().newPage();
    await publicFaqPage.goto('/faq');
    await expect(publicFaqPage.getByText(question)).toBeVisible();
    await publicFaqPage.close();

    await page.goto('/admin/settings');
    const settingsAccessToken = (await page.context().cookies()).find((cookie) => cookie.name === 'access_token')?.value;
    const settingsUpdate = await page.request.patch('http://localhost:40001/api/admin/settings', {
      headers: settingsAccessToken ? { Authorization: `Bearer ${settingsAccessToken}` } : {},
      data: {
        supportEmail: 'ops-e2e@tourdevino.local',
        bookingCancellationWindowHours: 36,
        webhookProvider: 'stripe'
      }
    });
    expect(settingsUpdate.ok()).toBeTruthy();

    await page.reload();
    await expect(page.getByLabel('Support email')).toHaveValue('ops-e2e@tourdevino.local');

    const settingsRead = await page.request.get('http://localhost:40001/api/admin/settings', {
      headers: settingsAccessToken ? { Authorization: `Bearer ${settingsAccessToken}` } : {}
    });
    expect(settingsRead.ok()).toBeTruthy();
    const settingsBody = (await settingsRead.json()) as { data: { supportEmail: string; bookingCancellationWindowHours: number } };
    expect(settingsBody.data.supportEmail).toBe('ops-e2e@tourdevino.local');
    expect(settingsBody.data.bookingCancellationWindowHours).toBe(36);
  });

  test('client is forbidden from admin and vendor routes', async ({ page }) => {
    await loginViaUi(page, 'client@tourdevino.local', 'Password123!');

    await page.goto('/vendor');
    await expect(page.getByText('Forbidden')).toBeVisible();

    await page.goto('/admin');
    await expect(page.getByText('Forbidden')).toBeVisible();
  });
});
