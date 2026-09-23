import { defineConfig, devices } from '@playwright/test';
import env from './env.cjs';

const { API_URL, WEB_URL } = env;

/**
 * End-to-end tests: the real app in a real browser against the real
 * backend, on a throwaway database. `npm run test:e2e`.
 *
 * Locally the backend is expected next to this repo (../pawmates-backend);
 * CI checks it out and sets PAWMATES_BACKEND_DIR.
 */
export default defineConfig({
  testDir: '.',
  // One at a time: the tests share one backend, and some of them (login
  // attempts, sign-ups) are counted per connection.
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: WEB_URL,
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    viewport: { width: 430, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : undefined,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 430, height: 1000 } } }],
  webServer: [
    {
      command: 'node e2e/start-backend.mjs',
      url: `${API_URL}/health`,
      cwd: '..',
      timeout: 240_000,
      reuseExistingServer: false,
      stdout: 'ignore',
    },
    {
      command: 'node e2e/serve-web.mjs',
      url: WEB_URL,
      cwd: '..',
      timeout: 300_000,
      reuseExistingServer: false,
    },
  ],
});
