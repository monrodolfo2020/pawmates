import { uuid } from './uuid';

// Points at the deployed pawmates-backend (see that repo's README/DEPLOY.md).
// Override with EXPO_PUBLIC_API_URL for local development against
// `npm run start:pawmates-api:dev` there.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://pawmates-api.onrender.com';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: { method?: string; token?: string; idempotencyKey?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      json?.error?.message ?? `Error ${res.status} al llamar ${path}`,
      Boolean(json?.error?.retryable),
    );
  }
  return json?.data as T;
}

export interface DevLoginResult {
  accountId: string;
  token: string;
}

export interface BookingResult {
  id: string;
  status: string;
}

/**
 * pawmates-backend has no real Marketplace/Pets/Identity Bounded Context
 * in this MVP (see its README) — every provider/pet/service/address id
 * below is a fixed placeholder the backend's Fake adapter accepts
 * unconditionally, standing in for "the one demo walker" until real
 * discovery exists.
 */
// class-validator's @IsUUID() (no version pinned) requires an actual v4
// shape — version nibble '4', variant nibble in {8,9,a,b} — not just any
// 8-4-4-4-12 hex string, so these can't be as simply hand-typed as
// booking-svc's own DEMO_PROVIDER_ID constant (never passed through that
// validator, only ever stored as a raw Postgres uuid column).
const DEMO_PROVIDER_SERVICE_ID = '00000000-0000-4000-8000-0000000000b1';
const DEMO_PET_ID = '00000000-0000-4000-8000-0000000000b2';
const DEMO_SERVICE_TYPE_CODE = '00000000-0000-4000-8000-0000000000b3';
const DEMO_ADDRESS_ID = '00000000-0000-4000-8000-0000000000b4';

export const api = {
  devLogin(accountId?: string, role: 'owner' | 'provider' = 'owner') {
    return request<DevLoginResult>('/v1/auth/dev-login', {
      method: 'POST',
      body: { accountId, role },
    });
  },

  /** A single immediate booking (durationValue in minutes) — this demo skips
   * the recurring-schedule endpoint since "Live paseo" only makes sense for
   * a walk starting now, not one scheduled for a future day. */
  createBooking(token: string, durationValue: number) {
    return request<BookingResult>('/v1/bookings', {
      method: 'POST',
      token,
      idempotencyKey: uuid(),
      body: {
        providerServiceId: DEMO_PROVIDER_SERVICE_ID,
        lines: [
          {
            petId: DEMO_PET_ID,
            serviceTypeCode: DEMO_SERVICE_TYPE_CODE,
            durationValue,
            durationUnit: 'min',
            addressId: DEMO_ADDRESS_ID,
          },
        ],
      },
    });
  },

  acceptBooking(token: string, bookingId: string) {
    return request<BookingResult>(`/v1/bookings/${bookingId}/accept`, {
      method: 'POST',
      token,
      body: { paymentMethodId: uuid() },
    });
  },

  startTrip(bookingId: string) {
    return request<{ status: string }>(`/v1/trips/${bookingId}/start`, { method: 'POST' });
  },

  completeTrip(bookingId: string) {
    return request<{ status: string }>(`/v1/trips/${bookingId}/complete`, { method: 'POST' });
  },
};
