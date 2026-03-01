import { expect, Page } from '@playwright/test';

interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      role: 'CLIENT' | 'VENDOR' | 'ADMIN';
    };
  };
}

export async function loginViaUi(page: Page, email: string, password: string): Promise<'CLIENT' | 'VENDOR' | 'ADMIN'> {
  const response = await page.request.post('http://localhost:40001/api/auth/login', {
    data: {
      email,
      password
    }
  });

  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as LoginResponse;

  await page.context().addCookies([
    {
      name: 'access_token',
      value: body.data.accessToken,
      url: 'http://localhost:40000'
    },
    {
      name: 'refresh_token',
      value: body.data.refreshToken,
      url: 'http://localhost:40000'
    }
  ]);

  await page.goto('/');
  return body.data.user.role;
}
