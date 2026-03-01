import { APIRequestContext, expect } from '@playwright/test';

export async function loginViaApi(request: APIRequestContext, email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await request.post('/api/auth/login', {
    data: { email, password }
  });
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as {
    data: {
      accessToken: string;
      refreshToken: string;
    };
  };
  return body.data;
}
