import { createRequire } from 'node:module';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Browser, Page } from '@playwright/test';
import env from './env.cjs';

const { API_URL, BACKEND_DIR, DB_FILE, WEB_URL } = env;

// Ways to set up a scene quickly — through the backend's own API where
// there is one, and straight into the throwaway database only for what
// no API does on purpose (making an admin, skipping the emailed code).

export type Session = { accountId: string; token: string; email: string };

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PASSWORD = 'Password1!';

/** Each API caller gets its own address, so tests don't share the
 * per-connection limits (sign-ups per hour, failed logins). */
const freshIp = () => `10.${rand()}.${rand()}.${rand()}`;
const rand = () => Math.floor(Math.random() * 254) + 1;

export const uniqueEmail = (who: string) => `${who}-${randomUUID().slice(0, 8)}@prueba.app`;

export async function api<T = unknown>(
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(API_URL + path, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-real-ip': freshIp(),
      'idempotency-key': randomUUID(),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const json = (await res.json().catch(() => null)) as { data?: T; error?: { message: string } } | null;
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${json?.error?.message ?? ''}`);
  return json?.data as T;
}

const legal = (types: string[]) => types.map((type) => ({ type, version: '1.0' }));

// The backend's own SQLite driver, on the test database.
const requireFromBackend = createRequire(join(BACKEND_DIR, 'package.json'));
type Db = { prepare(sql: string): { run(...args: unknown[]): unknown } };
function db(): Db {
  const Database = requireFromBackend('better-sqlite3') as new (file: string) => Db;
  return new Database(DB_FILE);
}

/** Moves a business's free month of the editor into the past. */
export function endTrial(accountId: string) {
  db()
    .prepare(`UPDATE providers_profiles SET trial_ends_at = datetime('now', '-1 day') WHERE account_id = ?`)
    .run(accountId);
}

/** Skips the emailed 6-digit code, which a test can't read. */
export function markEmailVerified(accountId: string) {
  db().prepare(`UPDATE identity_accounts SET email_verified_at = datetime('now') WHERE id = ?`).run(accountId);
}

/** No API grants admin, by design (see the backend README). */
export function makeAdmin(accountId: string) {
  db().prepare(`UPDATE identity_accounts SET roles = '["owner","admin"]' WHERE id = ?`).run(accountId);
}

export async function createOwner(name = 'Ana'): Promise<Session & { petId: string }> {
  const email = uniqueEmail(name.toLowerCase());
  const session = await api<Session>('POST', '/v1/auth/signup', {
    body: { email, password: PASSWORD, role: 'owner', name, acceptedLegal: legal(['privacy_notice', 'owner_terms']) },
  });
  markEmailVerified(session.accountId);
  const pet = await api<{ id: string }>('POST', '/v1/pets', {
    token: session.token,
    body: { name: 'Toby', breed: 'Beagle', size: 'Mediano', temperament: [], vaccines: [] },
  });
  return { ...session, email, petId: pet.id };
}

export async function createAdmin(): Promise<Session> {
  const email = uniqueEmail('admin');
  const session = await api<Session>('POST', '/v1/auth/signup', {
    body: { email, password: PASSWORD, role: 'owner', name: 'Admin', acceptedLegal: legal(['privacy_notice', 'owner_terms']) },
  });
  markEmailVerified(session.accountId);
  makeAdmin(session.accountId);
  return { ...session, email };
}

/** A walker with a complete page, approved unless told otherwise. */
export async function createWalker(options: { businessName: string; approved?: boolean }): Promise<Session> {
  const email = uniqueEmail('negocio');
  const session = await api<Session>('POST', '/v1/auth/signup', {
    body: {
      email,
      password: PASSWORD,
      role: 'provider',
      name: 'Pedro',
      category: 'walker',
      businessName: options.businessName,
      facePhoto: PNG,
      idDocumentPhoto: PNG,
      acceptedLegal: legal(['privacy_notice', 'provider_agreement', 'identity_verification_consent']),
    },
  });
  markEmailVerified(session.accountId);
  await api('PATCH', '/v1/providers/me', {
    token: session.token,
    body: { bio: 'Paseos con cariño', serviceArea: 'Metepec', priceAmount: 15000, priceCurrency: 'MXN' },
  });
  if (options.approved !== false) {
    const admin = await createAdmin();
    await api('PATCH', `/v1/admin/businesses/${session.accountId}/approval`, {
      token: admin.token,
      body: { approved: true },
    });
  }
  return { ...session, email };
}

/** Opens the app already signed in as `session`. */
export async function openAs(page: Page, session: Session, path = '/') {
  await page.addInitScript(
    ([accountId, token]) =>
      localStorage.setItem('pawmates.session', JSON.stringify({ accountId, token })),
    [session.accountId, session.token],
  );
  await page.goto(path);
}

/** A second person in the same test (the business, the admin...): a new
 * browser context, so their session doesn't mix with the first one's. */
export async function openInNewContext(
  browser: Browser,
  session: Session,
  path = '/',
  options: { geolocation?: { latitude: number; longitude: number } } = {},
): Promise<Page> {
  const context = await browser.newContext({
    baseURL: WEB_URL,
    viewport: { width: 430, height: 1000 },
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    ...(options.geolocation ? { geolocation: options.geolocation, permissions: ['geolocation'] } : {}),
  });
  const page = await context.newPage();
  await openAs(page, session, path);
  return page;
}

// The placeholder service/address ids the app sends with every booking
// line, read from the app itself so the two can't disagree.
const clientSource = readFileSync(join(__dirname, '../src/api/client.ts'), 'utf8');
const constant = (name: string) => new RegExp(`${name}\\s*=\\s*'([^']+)'`).exec(clientSource)![1];

/** A walk the owner asked for and the business already accepted. */
export async function confirmedWalk(owner: Session & { petId: string }, walker: Session, at: Date) {
  const booking = await api<{ id: string }>('POST', '/v1/bookings', {
    token: owner.token,
    body: {
      providerServiceId: walker.accountId,
      scheduledAt: at.toISOString(),
      lines: [
        {
          petId: owner.petId,
          serviceTypeCode: constant('DEMO_SERVICE_TYPE_CODE'),
          durationValue: 30,
          durationUnit: 'min',
          addressId: constant('DEMO_ADDRESS_ID'),
        },
      ],
    },
  });
  await api('POST', `/v1/bookings/${booking.id}/accept`, {
    token: walker.token,
    body: { paymentMethodId: randomUUID() },
  });
  return booking.id;
}

export const uniqueName = (prefix: string) => `${prefix} ${randomUUID().slice(0, 4).toUpperCase()}`;

export { PASSWORD };
