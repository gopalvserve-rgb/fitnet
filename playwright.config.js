// @ts-check
import { defineConfig, devices } from '@playwright/test';

const API_PORT = 4100;
const WEB_PORT = 3100;
export const ADMIN = { email: 'admin@e2e.test', password: 'e2e-super-secret-pass' };

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: [
    {
      command: 'rm -rf e2e/.tmp && node --disable-warning=ExperimentalWarning backend/src/server.js',
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: false,
      env: {
        PORT: String(API_PORT),
        DB_PATH: 'e2e/.tmp/e2e.db',
        ADMIN_EMAIL: ADMIN.email,
        ADMIN_PASSWORD: ADMIN.password,
        ALLOWED_ORIGINS: `http://localhost:${WEB_PORT}`,
        DISABLE_RATE_LIMIT: '1',
        JWT_SECRET: 'e2e-jwt-secret-that-is-long-enough-1234567890',
      },
    },
    {
      command: 'npm --prefix frontend run start',
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
      env: { API_URL: `http://localhost:${API_PORT}`, PORT: String(WEB_PORT) },
    },
  ],
});
