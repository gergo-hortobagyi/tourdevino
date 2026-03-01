import { test, expect } from '@playwright/test';

test('search filters and opens detail page', async ({ page }) => {
  await page.goto('/search');
  await page.getByPlaceholder('Region').fill('Napa Valley');
  await page.getByRole('button', { name: 'Apply filters' }).click();

  await expect(page.getByRole('heading', { name: 'Search Tours' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View tour' }).first()).toBeVisible();

  await page.getByRole('link', { name: 'View tour' }).first().click();
  await expect(page).toHaveURL(/\/tours\//);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('map marker list navigates to detail', async ({ page }) => {
  await page.goto('/map');
  await expect(page.getByRole('heading', { name: 'Map View' })).toBeVisible();

  await page.getByRole('link', { name: 'Open detail' }).first().click();
  await expect(page).toHaveURL(/\/tours\//);
  await expect(page.getByText('Upcoming availability')).toBeVisible();
});

test('static pages render and contact can be submitted', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'About', exact: true })).toBeVisible();

  await page.goto('/faq');
  await expect(page.getByRole('heading', { name: 'FAQ' })).toBeVisible();

  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: 'Terms', exact: true })).toBeVisible();

  await page.goto('/contact');
  await page.waitForFunction(() => Boolean((window as { __NUXT__?: unknown }).__NUXT__));
  const nameInput = page.locator('input[placeholder="Name"]');
  await nameInput.click();
  await nameInput.type('Catalog E2E', { delay: 20 });
  await expect(nameInput).toHaveValue('Catalog E2E');

  const emailInput = page.getByPlaceholder('Email');
  await emailInput.fill('catalog-e2e@tourdevino.local');
  await expect(emailInput).toHaveValue('catalog-e2e@tourdevino.local');

  const messageInput = page.getByPlaceholder('Message');
  await messageInput.fill('Contact form smoke test message.');
  await expect(messageInput).toHaveValue('Contact form smoke test message.');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Message sent.')).toBeVisible();
});
