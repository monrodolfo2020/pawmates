// Builds the web app pointed at the test backend and serves it the way
// Vercel does: files as they are, and index.html for any other path so
// deep links like /s/<slug> open the app.
import { execSync } from 'node:child_process';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import env from './env.cjs';

const { API_URL, WEB_BUILD_DIR, WEB_PORT } = env;

execSync(`npx expo export --platform web --output-dir ${WEB_BUILD_DIR}`, {
  env: { ...process.env, EXPO_PUBLIC_API_URL: API_URL, EXPO_OFFLINE: '1', EXPO_NO_TELEMETRY: '1' },
  stdio: 'inherit',
});

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(WEB_BUILD_DIR, path);
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(WEB_BUILD_DIR, 'index.html');
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(WEB_PORT, () => console.log(`app de prueba en http://localhost:${WEB_PORT}`));
