// Starts pawmates-backend for the end-to-end tests: a brand-new SQLite
// file, every migration applied, then the compiled server. Builds the
// backend first when there's no build yet.
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import paths from './env.cjs';

const { API_PORT, BACKEND_DIR, DB_FILE, TMP_DIR } = paths;

const main = join(BACKEND_DIR, 'dist/apps/pawmates-api/apps/pawmates-api/src/main.js');
const env = { ...process.env, SQLITE_LOCAL_PATH: DB_FILE, PORT: String(API_PORT), NODE_ENV: 'test' };
// Never a real database or real email, whatever the shell has set.
for (const key of ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'RESEND_API_KEY', 'BLOB_READ_WRITE_TOKEN', 'BLOB_PRIVATE_READ_WRITE_TOKEN']) {
  delete env[key];
}

if (!existsSync(join(BACKEND_DIR, 'package.json'))) {
  throw new Error(`No encontré pawmates-backend en ${BACKEND_DIR}. Define PAWMATES_BACKEND_DIR.`);
}
if (!existsSync(main)) execSync('npm run build', { cwd: BACKEND_DIR, stdio: 'inherit' });

mkdirSync(TMP_DIR, { recursive: true });
rmSync(DB_FILE, { force: true });
execSync('npm run migration:run:pawmates-api', { cwd: BACKEND_DIR, env, stdio: 'ignore' });

const server = spawn(process.execPath, [main], { cwd: BACKEND_DIR, env, stdio: 'inherit' });
const stop = () => server.kill();
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
server.on('exit', (code) => process.exit(code ?? 0));
