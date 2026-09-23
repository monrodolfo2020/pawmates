// Shared by the Playwright config, the two server scripts and the test
// helpers, so every piece agrees on where things are. CommonJS because
// it's loaded both by plain Node scripts and by Playwright's TypeScript.
const { join, resolve } = require('node:path');

const API_PORT = Number(process.env.E2E_API_PORT ?? 3700);
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 8700);
const TMP_DIR = join(__dirname, '.tmp');

module.exports = {
  API_PORT,
  WEB_PORT,
  API_URL: `http://localhost:${API_PORT}`,
  WEB_URL: `http://localhost:${WEB_PORT}`,
  /** The backend checkout: next to this repo locally, or wherever CI put it. */
  BACKEND_DIR: resolve(process.env.PAWMATES_BACKEND_DIR ?? join(__dirname, '../../pawmates-backend')),
  TMP_DIR,
  /** A fresh file on every run — tests never touch a real database. */
  DB_FILE: join(TMP_DIR, 'e2e.db'),
  WEB_BUILD_DIR: join(__dirname, '.web'),
};
