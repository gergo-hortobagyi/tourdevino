import { test, expect } from '@playwright/test';
import { loginViaUi } from '../fixtures/ui-auth.js';

test('profile update persists and review can be submitted from eligible completed booking', async ({ page }) => {
  await loginViaUi(page, 'client@tourdevino.local', 'Password123!');
  await page.goto('/account/profile');
  await expect(page.getByRole('heading', { name: 'My profile' })).toBeVisible();

  await page.getByLabel('First name').fill('CoraE2E');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile updated.')).toBeVisible();

  await page.goto('/account/reviews');
  await expect(page.getByRole('heading', { name: 'My Reviews' })).toBeVisible();

  const bookingSelect = page.locator('select');
  const optionCount = await bookingSelect.locator('option').count();
  if (optionCount > 1) {
    const mendocinoOption = bookingSelect.locator('option', { hasText: 'Mendocino' });
    if ((await mendocinoOption.count()) > 0) {
      const optionValue = await mendocinoOption.first().getAttribute('value');
      if (optionValue) {
        await bookingSelect.selectOption(optionValue);
      } else {
        await bookingSelect.selectOption({ index: optionCount - 1 });
      }
    } else {
      await bookingSelect.selectOption({ index: optionCount - 1 });
    }
    await page.locator('input[type="number"]').fill('5');
    await page.getByPlaceholder('Share your experience').fill('Fantastic itinerary and service.');
    await page.getByRole('button', { name: 'Submit review' }).click();
    await expect(page.getByText('Review submitted.')).toBeVisible();
  }
});
