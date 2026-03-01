import { defineConfig } from '@playwright/test';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: '.env.test' });

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  workers: 1,
  use: {
    baseURL: 'http://localhost:40000'
  },
  webServer: [
    {
      command: 'bash ./scripts/run-api-test-server.sh',
      url: 'http://localhost:40001/api/health/live',
      reuseExistingServer: false,
      timeout: 180_000
    },
    {
      command: 'bash ./scripts/run-web-test-server.sh',
      url: 'http://localhost:40000',
      reuseExistingServer: false,
      timeout: 120_000
    }
  ]
});
