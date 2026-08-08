import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env['CI'] ? 1 : 0,
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'exec bash ../../tools/dev.sh',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    gracefulShutdown: {
      signal: 'SIGINT',
      timeout: 5_000,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
