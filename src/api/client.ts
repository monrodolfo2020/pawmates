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
  createdAt: string;
}

export type ProductCategory = 'treat' | 'toy' | 'accessory' | 'service_addon' | 'other';

export interface Product {
  id: string;
  storefrontId: string;
  catalogItemId: string | null;
  name: string;
  description: string | null;
  price: { amount: number; currency: string };
  stockQuantity: number | null;
  category: ProductCategory;
  isActive: boolean;
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  suggestedPrice: { amount: number; currency: string };
  photo: string | null;
}

export interface AdminCatalogItem extends CatalogItem {
  isActive: boolean;
}

export interface Storefront {
  id: string;
  providerId: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface StorefrontListing extends Storefront {
  productCount: number;
}

export interface StorefrontDetail extends Storefront {
  products: Product[];
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'awaiting_delivery'
  | 'delivered'
  | 'refunded';

export interface OrderLine {
  productId: string;
  name: string;
  unitPrice: { amount: number; currency: string };
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  ownerId: string;
  storefrontId: string;
  providerId: string;
  status: OrderStatus;
  deliveryBookingId: string | null;
  deliveryWindowOpenAt: string | null;
  total: { amount: number; currency: string };
  lines: OrderLine[];
  createdAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
  refundedAt: string | null;
}

export interface AdminStorefront {
  id: string;
  providerId: string;
  providerEmail: string | null;
  providerName: string | null;
  name: string;
  description: string | null;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

export interface AdminOrder {
  id: string;
  ownerId: string;
  providerId: string;
  storefrontId: string;
  status: OrderStatus;
  total: { amount: number; currency: string };
  createdAt: string;
  deliveredAt: string | null;
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

  // --- PawMates Commerce (walker storefronts) ---

  listStorefronts(token: string) {
    return request<StorefrontListing[]>('/v1/storefronts', { token });
  },

  getStorefront(token: string, providerId: string) {
    return request<StorefrontDetail>(`/v1/storefronts/${providerId}`, { token });
  },

  getMyStorefront(token: string) {
    return request<StorefrontDetail | null>('/v1/storefronts/me', { token });
  },

  /** Admin-only: opens a storefront on a provider's behalf. */
  openStorefront(token: string, params: { providerId: string; name: string; description?: string }) {
    return request<Storefront>('/v1/storefronts', { method: 'POST', token, body: params });
  },

  listCatalog(token: string) {
    return request<CatalogItem[]>('/v1/storefronts/catalog', { token });
  },

  /** Lists a product from the catalog — price/stock are the provider's to
   * set, but name/description/category always come from the catalog item. */
  addProduct(
    token: string,
    params: { catalogItemId: string; priceAmount?: number; priceCurrency?: string; stockQuantity?: number },
  ) {
    return request<Product>('/v1/storefronts/me/products', { method: 'POST', token, body: params });
  },

  updateProduct(
    token: string,
    productId: string,
    params: Partial<{
      name: string;
      description: string;
      priceAmount: number;
      priceCurrency: string;
      stockQuantity: number;
      isActive: boolean;
    }>,
  ) {
    return request<Product>(`/v1/products/${productId}`, { method: 'PATCH', token, body: params });
  },

  placeOrder(
    token: string,
    params: { storefrontId: string; lines: { productId: string; quantity: number }[] },
  ) {
    return request<Order>('/v1/orders', {
      method: 'POST',
      token,
      idempotencyKey: uuid(),
      body: { ...params, paymentMethodId: uuid() },
    });
  },

  listOrders(token: string, activeContext: 'owner' | 'provider' = 'owner') {
    return request<Order[]>('/v1/orders', { token, activeContext });
  },

  confirmDelivery(token: string, orderId: string) {
    return request<Order>(`/v1/orders/${orderId}/confirm-delivery`, { method: 'POST', token });
  },

  cancelOrder(token: string, orderId: string) {
    return request<Order>(`/v1/orders/${orderId}/cancel`, {
      method: 'POST',
      token,
      idempotencyKey: uuid(),
    });
  },

  attachDeliveryBooking(token: string, orderId: string) {
    return request<Order>(`/v1/orders/${orderId}/attach-delivery-booking`, { method: 'POST', token });
  },

  adminListStorefronts(token: string) {
    return request<AdminStorefront[]>('/v1/admin/storefronts', { token });
  },

  adminListOrders(token: string) {
    return request<AdminOrder[]>('/v1/admin/orders', { token });
  },

  adminListCatalog(token: string) {
    return request<AdminCatalogItem[]>('/v1/admin/catalog', { token });
  },

  adminUpdateCatalogItem(
    token: string,
    id: string,
    params: Partial<{ name: string; description: string; suggestedPriceAmount: number; photo: string; isActive: boolean }>,
  ) {
    return request<AdminCatalogItem>(`/v1/admin/catalog/${id}`, { method: 'PATCH', token, body: params });
  },
};
