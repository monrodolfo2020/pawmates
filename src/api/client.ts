import { uuid } from './uuid';

// Points at the deployed pawmates-backend (see that repo's README/DEPLOY.md
// — now a Vercel serverless function; Render's deployment was retired).
// Override with EXPO_PUBLIC_API_URL for local development against
// `npm run start:pawmates-api:dev` there.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://pawmates-backend-black.vercel.app';

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
  options: {
    method?: string;
    token?: string;
    idempotencyKey?: string;
    activeContext?: 'owner' | 'provider';
    body?: unknown;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
  if (options.activeContext) headers['x-active-context'] = options.activeContext;

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
  emailVerified: boolean;
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
  ownerId: string;
  ownerName: string | null;
  providerId: string;
  status: string;
  scheduledAt: string;
  hasUnreadMessages: boolean;
  lines: {
    petId: string;
    petName: string | null;
    durationValue: number;
    durationUnit: string;
    serviceTypeCode: string;
  }[];
  priceBreakdown: { totalAmount: number; currency: string } | null;
}

export interface BookingWeekSummary {
  weekStart: string;
  earnings: { amount: number; currency: string };
  completedThisWeek: number;
  days: { label: string; count: number }[];
}

export interface TripPoint {
  lat: number;
  lng: number;
  recordedAt: string;
}

export interface WalkEvent {
  id: string;
  type: 'photo' | 'pee' | 'poop';
  photoBase64: string | null;
  note: string | null;
  recordedAt: string;
}

export interface TripDetail {
  bookingId: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  durationSeconds: number | null;
  distanceMeters: number;
  route: TripPoint[];
  events: WalkEvent[];
  peeCount: number;
  poopCount: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: 'owner' | 'provider';
  text: string;
  sentAt: string;
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
  facePhoto: string;
  idDocumentPhoto: string;
  /** Independent from `status` — this reflects whether the paseador has
   * finished their own page (bio + price, see ProviderProfile), which is
   * what actually makes them show up in the shopper-facing directory.
   * An admin can approve identity and this can still be false. */
  profilePublished: boolean;
  createdAt: string;
}

// Must stay in sync with SERVICE_CATEGORIES in the backend's
// providers/domain/value-objects/service-category.ts (same manual-sync
// convention as MEET_GREET_SERVICE_TYPE_CODE below).
export const SERVICE_CATEGORIES = [
  'walker',
  'vet',
  'grooming',
  'boarding',
  'training',
  'shop',
  'other',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  walker: 'Paseadores',
  vet: 'Veterinarias',
  grooming: 'Estética',
  boarding: 'Hotel y guardería',
  training: 'Entrenamiento',
  shop: 'Tiendas',
  other: 'Otros servicios',
};

/** Singular form, for a single business's own page/card. */
export const CATEGORY_LABELS_SINGULAR: Record<ServiceCategory, string> = {
  walker: 'Paseador',
  vet: 'Veterinaria',
  grooming: 'Estética canina',
  boarding: 'Hotel y guardería',
  training: 'Entrenamiento',
  shop: 'Tienda de mascotas',
  other: 'Otro servicio',
};

/** Only walkers can be booked in-app (bookings, Meet & Greet, live walk)
 * — every other category is a directory listing you contact directly.
 * Mirrors requiresRate() on the backend. */
export function isBookable(category: ServiceCategory): boolean {
  return category === 'walker';
}

export interface ProviderListing {
  accountId: string;
  name: string;
  category: ServiceCategory;
  slug: string | null;
  photo: string | null;
  serviceArea: string | null;
  specialty: string | null;
  price: { amount: number; currency: string } | null;
  plansOffered: string | null;
  walkingSpots: string | null;
  emailVerified: boolean;
  identityVerified: boolean;
}

export interface ProviderDetail extends ProviderListing {
  bio: string | null;
  photos: string[];
  publicAddress: string | null;
  hours: string | null;
  whatsapp: string | null;
}

// Private fields (address/idNumber/age/phone) only ever come back on this
// shape — the provider looking at their own page — never on
// ProviderListing/ProviderDetail (the backend never serializes them into
// a public response; see ProvidersController's comment).
export interface MyProviderProfile {
  accountId: string;
  category: ServiceCategory;
  businessName: string | null;
  slug: string | null;
  bio: string | null;
  photo: string | null;
  photos: string[];
  publicAddress: string | null;
  hours: string | null;
  whatsapp: string | null;
  serviceArea: string | null;
  specialty: string | null;
  price: { amount: number; currency: string } | null;
  plansOffered: string | null;
  walkingSpots: string | null;
  address: string | null;
  idNumber: string | null;
  age: number | null;
  phone: string | null;
  isPublished: boolean;
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
const DEMO_SERVICE_TYPE_CODE = '00000000-0000-4000-8000-0000000000b3';
const DEMO_ADDRESS_ID = '00000000-0000-4000-8000-0000000000b4';
// Must match MEET_GREET_SERVICE_TYPE_CODE in the backend's
// booking-process-manager.ts — a booking line tagged with this code
// prices at $0 there regardless of the paseador's normal rate. Exported
// so screens can tell a Meet & Greet apart from a paid walk when
// rendering a BookingSummary's lines.
export const MEET_GREET_SERVICE_TYPE_CODE = '00000000-0000-4000-8000-0000000000c1';

export const api = {
  signup(params: {
    email: string;
    password: string;
    role: 'owner' | 'provider';
    name?: string;
    category?: ServiceCategory;
    businessName?: string;
    facePhoto?: string;
    idDocumentPhoto?: string;
    profilePhoto?: string;
  }) {
    return request<AuthResult>('/v1/auth/signup', { method: 'POST', body: params });
  },

  login(email: string, password: string) {
    return request<AuthResult>('/v1/auth/login', { method: 'POST', body: { email, password } });
  },

  addRole(
    token: string,
    params: {
      role: 'owner' | 'provider';
      category?: ServiceCategory;
      businessName?: string;
      facePhoto?: string;
      idDocumentPhoto?: string;
      profilePhoto?: string;
    },
  ) {
    return request<AuthResult>('/v1/auth/roles', { method: 'POST', token, body: params });
  },

  me(token: string) {
    return request<MeResult>('/v1/me', { token });
  },

  sendVerificationEmail(token: string) {
    return request<{ sent: boolean }>('/v1/auth/send-verification-email', { method: 'POST', token });
  },

  verifyEmail(token: string, code: string) {
    return request<{ verified: boolean }>('/v1/auth/verify-email', {
      method: 'POST',
      token,
      body: { code },
    });
  },

  /** No auth token — this is how a locked-out person starts the flow.
   * Always resolves (backend never reveals whether the email exists). */
  forgotPassword(email: string) {
    return request<{ sent: boolean }>('/v1/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  },

  /** Also no auth token — the reset token from the emailed link is the
   * only credential here. */
  resetPassword(token: string, newPassword: string) {
    return request<{ reset: boolean }>('/v1/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword },
    });
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

  /** Response omits the face/ID photos (unlike adminListVerifications) —
   * the backend doesn't re-send them on a status update. */
  adminUpdateVerification(token: string, id: string, status: 'verified' | 'rejected') {
    return request<Pick<AdminVerification, 'id' | 'accountId' | 'status' | 'createdAt'>>(
      `/v1/admin/provider-verifications/${id}`,
      { method: 'PATCH', token, body: { status } },
    );
  },

  /** A single immediate booking (durationValue in minutes) — this demo skips
   * the recurring-schedule endpoint since "Live paseo" only makes sense for
   * a walk starting now, not one scheduled for a future day.
   *
   * providerServiceId is the selected walker's id (see mockData.ts's
   * walkers) — the backend's FakeMarketplaceAdapter treats it directly as
   * the provider's account id (no real Marketplace/rate-card lookup yet).
   * Each walker needs its own id here so two different walkers' schedules
   * don't collide with each other in the no-double-booking check. */
  createBooking(token: string, petId: string, providerServiceId: string, durationValue: number) {
    return request<BookingResult>('/v1/bookings', {
      method: 'POST',
      token,
      idempotencyKey: uuid(),
      body: {
        providerServiceId,
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

  /** Free intro session with a paseador before committing to paid walks —
   * same real request/accept pipeline as createBooking, just tagged with
   * MEET_GREET_SERVICE_TYPE_CODE so the backend prices it at $0. */
  requestMeetGreet(token: string, petId: string, providerServiceId: string) {
    return request<BookingResult>('/v1/bookings', {
      method: 'POST',
      token,
      idempotencyKey: uuid(),
      body: {
        providerServiceId,
        lines: [
          {
            petId,
            serviceTypeCode: MEET_GREET_SERVICE_TYPE_CODE,
            durationValue: 15,
            durationUnit: 'min',
            addressId: DEMO_ADDRESS_ID,
          },
        ],
      },
    });
  },

  listBookings(
    token: string,
    params?: { activeContext?: 'owner' | 'provider'; status?: string },
  ) {
    const query = params?.status ? `?status=${encodeURIComponent(params.status)}` : '';
    return request<BookingSummary[]>(`/v1/bookings${query}`, {
      token,
      activeContext: params?.activeContext,
    });
  },

  getBooking(token: string, bookingId: string) {
    return request<BookingSummary>(`/v1/bookings/${bookingId}`, { token });
  },

  getBookingWeekSummary(token: string) {
    return request<BookingWeekSummary>('/v1/bookings/summary', { token });
  },

  acceptBooking(token: string, bookingId: string) {
    return request<BookingResult>(`/v1/bookings/${bookingId}/accept`, {
      method: 'POST',
      token,
      body: { paymentMethodId: uuid() },
    });
  },

  rejectBooking(token: string, bookingId: string, reason?: string) {
    return request<BookingResult>(`/v1/bookings/${bookingId}/reject`, {
      method: 'POST',
      token,
      body: { reason },
    });
  },

  startTrip(token: string, bookingId: string) {
    return request<{ status: string }>(`/v1/trips/${bookingId}/start`, { method: 'POST', token });
  },

  completeTrip(token: string, bookingId: string) {
    return request<{ status: string }>(`/v1/trips/${bookingId}/complete`, { method: 'POST', token });
  },

  logTripLocation(token: string, bookingId: string, lat: number, lng: number) {
    return request<{ id: string }>(`/v1/trips/${bookingId}/locations`, {
      method: 'POST',
      token,
      body: { lat, lng },
    });
  },

  logWalkEvent(
    token: string,
    bookingId: string,
    params: { type: 'photo' | 'pee' | 'poop'; photoBase64?: string; note?: string },
  ) {
    return request<{ id: string }>(`/v1/trips/${bookingId}/events`, {
      method: 'POST',
      token,
      body: params,
    });
  },

  getTrip(token: string, bookingId: string) {
    return request<TripDetail>(`/v1/trips/${bookingId}`, { token });
  },

  sendMessage(token: string, bookingId: string, text: string) {
    return request<ChatMessage>(`/v1/bookings/${bookingId}/messages`, {
      method: 'POST',
      token,
      body: { text },
    });
  },

  listMessages(token: string, bookingId: string) {
    return request<ChatMessage[]>(`/v1/bookings/${bookingId}/messages`, { token });
  },

  // --- PawMates Providers (the pet-services directory) ---

  /** The whole published directory, or one category of it. Free-text
   * search is done on the result client-side — see HomeScreen. */
  listProviders(token?: string | null, category?: ServiceCategory) {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return request<ProviderListing[]>(`/v1/providers${query}`, { token: token ?? undefined });
  },

  /** Public — works for a signed-out guest too (token is optional). */
  getProvider(token: string | null | undefined, accountId: string) {
    return request<ProviderDetail>(`/v1/providers/${accountId}`, { token: token ?? undefined });
  },

  /** Backs the shareable micro-page at /s/<slug> — public by design:
   * whoever the business sends the link to has no account. */
  getProviderBySlug(slug: string) {
    return request<ProviderDetail>(`/v1/providers/by-slug/${encodeURIComponent(slug)}`);
  },

  getMyProviderProfile(token: string) {
    return request<MyProviderProfile | null>('/v1/providers/me', { token });
  },

  /** Partial update — every field optional, '' clears a field back to
   * unset. Publishes automatically once the business has a name and a
   * description (plus a rate, for paseadores). `photos` is the one
   * exception to "partial": it replaces the whole gallery. */
  saveMyProviderProfile(
    token: string,
    params: Partial<{
      category: ServiceCategory;
      businessName: string;
      photos: string[];
      publicAddress: string;
      hours: string;
      whatsapp: string;
      bio: string;
      serviceArea: string;
      specialty: string;
      photo: string;
      priceAmount: number;
      priceCurrency: string;
      plansOffered: string;
      walkingSpots: string;
      address: string;
      idNumber: string;
      age: number;
      phone: string;
    }>,
  ) {
    return request<MyProviderProfile>('/v1/providers/me', { method: 'PATCH', token, body: params });
  },

};
