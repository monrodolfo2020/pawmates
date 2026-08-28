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

export type Role = 'owner' | 'provider' | 'admin';

export interface AuthResult {
  accountId: string;
  token: string;
  roles: Role[];
}

export interface MeResult {
  id: string;
  email: string;
  name: string | null;
  roles: Role[];
}

export interface Pet {
  id: string;
  name: string;
  breed: string;
  size: string;
  temperament: string[];
  vaccines: string[];
  photo: string | null;
}

export interface BookingResult {
  id: string;
  status: string;
}

export interface BookingSummary {
  id: string;
  status: string;
  scheduledAt: string;
  priceBreakdown: { totalAmount: number; currency: string } | null;
}

export interface AdminAccount {
  id: string;
  email: string;
  name: string | null;
  roles: Role[];
  createdAt: string;
}

export interface AdminVerification {
  id: string;
  accountId: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

/**
 * pawmates-backend has no real Marketplace/Discovery Bounded Context in
 * this MVP (see its README) — every provider/service/address id below is a
 * fixed placeholder the backend's Fake adapter accepts unconditionally,
 * standing in for "the one demo walker" until real discovery exists. Only
 * the pet is real now (see Identity's Pets endpoints below).
 */
// class-validator's @IsUUID() (no version pinned) requires an actual v4
// shape — version nibble '4', variant nibble in {8,9,a,b} — not just any
// 8-4-4-4-12 hex string.
const DEMO_PROVIDER_SERVICE_ID = '00000000-0000-4000-8000-0000000000b1';
const DEMO_SERVICE_TYPE_CODE = '00000000-0000-4000-8000-0000000000b3';
const DEMO_ADDRESS_ID = '00000000-0000-4000-8000-0000000000b4';

export const api = {
  signup(params: {
    email: string;
    password: string;
    role: 'owner' | 'provider';
    name?: string;
    facePhoto?: string;
    idDocumentPhoto?: string;
  }) {
    return request<AuthResult>('/v1/auth/signup', { method: 'POST', body: params });
  },

  login(email: string, password: string) {
    return request<AuthResult>('/v1/auth/login', { method: 'POST', body: { email, password } });
  },

  addRole(
    token: string,
    params: { role: 'owner' | 'provider'; facePhoto?: string; idDocumentPhoto?: string },
  ) {
    return request<AuthResult>('/v1/auth/roles', { method: 'POST', token, body: params });
  },

  me(token: string) {
    return request<MeResult>('/v1/me', { token });
  },

  listPets(token: string) {
    return request<Pet[]>('/v1/pets', { token });
  },

  createPet(
    token: string,
    params: { name: string; breed: string; size: string; temperament: string[]; vaccines: string[]; photo?: string | null },
  ) {
    return request<Pet>('/v1/pets', { method: 'POST', token, body: params });
  },

  updatePet(
    token: string,
    petId: string,
    params: Partial<{ name: string; breed: string; size: string; temperament: string[]; vaccines: string[]; photo: string | null }>,
  ) {
    return request<Pet>(`/v1/pets/${petId}`, { method: 'PATCH', token, body: params });
  },

  adminListAccounts(token: string) {
    return request<AdminAccount[]>('/v1/admin/accounts', { token });
  },

  adminListVerifications(token: string) {
    return request<AdminVerification[]>('/v1/admin/provider-verifications', { token });
  },

  /** A single immediate booking (durationValue in minutes) — this demo skips
   * the recurring-schedule endpoint since "Live paseo" only makes sense for
   * a walk starting now, not one scheduled for a future day. */
  createBooking(token: string, petId: string, durationValue: number) {
    return request<BookingResult>('/v1/bookings', {
      method: 'POST',
      token,
      idempotencyKey: uuid(),
      body: {
        providerServiceId: DEMO_PROVIDER_SERVICE_ID,
        lines: [
          {
            petId,
            serviceTypeCode: DEMO_SERVICE_TYPE_CODE,
            durationValue,
            durationUnit: 'min',
            addressId: DEMO_ADDRESS_ID,
          },
        ],
      },
    });
  },

  listBookings(token: string) {
    return request<BookingSummary[]>('/v1/bookings', { token });
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
