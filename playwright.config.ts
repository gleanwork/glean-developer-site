import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual-regression',
  
  fullyParallel: true,
  
  forbidOnly: !!process.env.CI,
  
  retries: process.env.CI ? 2 : 0,
  
  workers: process.env.CI ? 1 : undefined,
  
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  webServer: {
    command: 'pnpm serve',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
});

