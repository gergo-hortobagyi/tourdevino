import { test, expect } from '@playwright/test';
import { loginViaUi } from '../fixtures/ui-auth.js';

test('client booking supports payment fail and retry', async ({ page }) => {
  await loginViaUi(page, 'client@tourdevino.local', 'Password123!');
  await page.goto('/account/profile');
  await expect(page.getByRole('heading', { name: 'My profile' })).toBeVisible();

  await page.goto('/tours/napa-sunset-tasting');
  await page.getByRole('link', { name: 'Book this tour' }).click();

  const date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  await page.getByLabel('Scheduled date/time').fill(date.toISOString().slice(0, 16));
  await page.getByLabel('Guest count').fill('2');
  await page.getByRole('button', { name: 'Create booking' }).click();

  await expect(page.getByText('Booking created:')).toBeVisible();
  await page.getByRole('button', { name: 'Simulate payment fail' }).click();
  await expect(page.getByText('Payment failed. Retry is available.')).toBeVisible();

  await page.getByRole('button', { name: 'Retry payment' }).click();
  await expect(page.getByText('Payment completed successfully.')).toBeVisible();
});

test('cancellation policy blocks near-term booking cancellation', async ({ page }) => {
  await loginViaUi(page, 'client@tourdevino.local', 'Password123!');
  await page.goto('/account/profile');
  await expect(page.getByRole('heading', { name: 'My profile' })).toBeVisible();

  await page.goto('/account/bookings');
  await expect(page.getByRole('heading', { name: 'My Bookings' })).toBeVisible();
  await expect(page.getByText('Cancellation is only available more than 24 hours before departure.').first()).toBeVisible();
});
