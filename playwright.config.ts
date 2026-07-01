import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3456',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx serve public -l 3456',
    url: 'http://localhost:3456',
    reuseExistingServer: !process.env.CI,
  },
});
