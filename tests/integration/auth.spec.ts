import { test, expect } from '@playwright/test';

import { loginViaApi } from '../fixtures/auth.js';

test.describe('auth api', () => {
  test('signup, me, refresh rotation, logout', async ({ request }) => {
    const uniqueEmail = `phase1-${Date.now()}@tourdevino.local`;

    const signup = await request.post('/api/auth/signup', {
      data: {
        email: uniqueEmail,
        password: 'Password123!',
        firstName: 'Phase',
        lastName: 'One'
      }
    });
    expect(signup.ok()).toBeTruthy();
    const signupBody = (await signup.json()) as {
      data: {
        accessToken: string;
        refreshToken: string;
      };
    };

    const me = await request.get('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${signupBody.data.accessToken}`
      }
    });
    expect(me.ok()).toBeTruthy();

    const refresh = await request.post('/api/auth/refresh', {
      data: { refreshToken: signupBody.data.refreshToken }
    });
    expect(refresh.ok()).toBeTruthy();
    const refreshBody = (await refresh.json()) as {
      data: {
        refreshToken: string;
      };
    };

    const refreshReuse = await request.post('/api/auth/refresh', {
      data: { refreshToken: signupBody.data.refreshToken }
    });
    expect(refreshReuse.status()).toBe(401);

    const logout = await request.post('/api/auth/logout', {
      data: { refreshToken: refreshBody.data.refreshToken }
    });
    expect(logout.ok()).toBeTruthy();

    const refreshAfterLogout = await request.post('/api/auth/refresh', {
      data: { refreshToken: refreshBody.data.refreshToken }
    });
    expect(refreshAfterLogout.status()).toBe(401);
  });

  test('rejects invalid credentials', async ({ request }) => {
    const login = await request.post('/api/auth/login', {
      data: {
        email: 'admin@tourdevino.local',
        password: 'wrong-password'
      }
    });

    expect(login.status()).toBe(401);
    const body = (await login.json()) as { error: { code: string } };
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('rate limits forgot password', async ({ request }) => {
    for (let i = 0; i < 5; i += 1) {
      const response = await request.post('/api/auth/forgot-password', {
        data: { email: `unknown-${i}@tourdevino.local` }
      });
      expect(response.status()).toBe(200);
    }

    const limited = await request.post('/api/auth/forgot-password', {
      data: { email: 'unknown-final@tourdevino.local' }
    });

    expect(limited.status()).toBe(429);
  });

  test('enforces role-based access on admin endpoint', async ({ request }) => {
    const clientTokens = await loginViaApi(request, 'client@tourdevino.local', 'Password123!');

    const adminProbe = await request.get('/api/demo/admin', {
      headers: {
        Authorization: `Bearer ${clientTokens.accessToken}`
      }
    });

    expect(adminProbe.status()).toBe(403);
  });
});
