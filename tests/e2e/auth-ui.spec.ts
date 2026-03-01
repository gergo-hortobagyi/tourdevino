import { test, expect } from '@playwright/test';
import { loginViaUi } from '../fixtures/ui-auth.js';

test('signup journey reaches profile page', async ({ page }) => {
  await page.goto('/signup');
  await page.waitForFunction(() => Boolean((window as { __NUXT__?: unknown }).__NUXT__));

  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page).toHaveURL(/\/account\/profile/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'My profile' })).toBeVisible();
});

test('client cannot access admin page', async ({ page }) => {
  await loginViaUi(page, 'client@tourdevino.local', 'Password123!');
  await page.goto('/account/profile');
  await expect(page.getByRole('heading', { name: 'My profile' })).toBeVisible();
  await expect(page.getByText('(CLIENT)')).toBeVisible();

  await page.goto('/admin');
  await expect(page.getByText('Forbidden')).toBeVisible();
});

test('vendor can access vendor dashboard', async ({ page }) => {
  await loginViaUi(page, 'vendor@tourdevino.local', 'Password123!');
  await page.goto('/vendor');
  await expect(page.getByRole('heading', { name: 'Vendor dashboard' })).toBeVisible();
});
