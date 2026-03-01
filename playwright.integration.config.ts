import { defineConfig } from '@playwright/test';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: '.env.test' });

export default defineConfig({
  testDir: './tests/integration',
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: 'http://localhost:40001'
  },
  webServer: {
    command: 'bash ./scripts/run-api-test-server.sh',
    url: 'http://localhost:40001/api/health/live',
    reuseExistingServer: false,
    timeout: 180_000
  }
});
