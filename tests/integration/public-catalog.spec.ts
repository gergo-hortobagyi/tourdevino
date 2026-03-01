import { test, expect } from '@playwright/test';

test.describe('public catalog api', () => {
  test('lists tours with pagination metadata and filters', async ({ request }) => {
    const response = await request.get('/api/tours?region=Napa%20Valley&page=1&pageSize=10');
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
      data: unknown[];
      meta: { page: number; total: number };
    };

    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.meta.page).toBe(1);
    expect(body.meta.total).toBeGreaterThan(0);
  });

  test('returns map tours and detail + reviews', async ({ request }) => {
    const mapResponse = await request.get('/api/tours/map');
    expect(mapResponse.ok()).toBeTruthy();
    const mapBody = (await mapResponse.json()) as { data: Array<{ slug: string }> };
    expect(mapBody.data.length).toBeGreaterThan(0);

    const slug = mapBody.data[0].slug;
    const detailResponse = await request.get(`/api/tours/${slug}`);
    expect(detailResponse.ok()).toBeTruthy();

    const reviewsResponse = await request.get(`/api/tours/${slug}/reviews`);
    expect(reviewsResponse.ok()).toBeTruthy();
    const reviewsBody = (await reviewsResponse.json()) as { meta: { total: number } };
    expect(reviewsBody.meta.total).toBeGreaterThanOrEqual(0);
  });

  test('serves content pages, faq and contact', async ({ request }) => {
    const aboutResponse = await request.get('/api/content/about');
    expect(aboutResponse.ok()).toBeTruthy();

    const faqResponse = await request.get('/api/faq');
    expect(faqResponse.ok()).toBeTruthy();

    const contactResponse = await request.post('/api/contact', {
      data: {
        name: 'Public Tester',
        email: 'public-tester@tourdevino.local',
        message: 'Question about upcoming tour availability.'
      }
    });
    expect(contactResponse.ok()).toBeTruthy();
  });
});
