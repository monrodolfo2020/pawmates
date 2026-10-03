import { Platform } from 'react-native';
import { api } from '../api/client';

/**
 * "Página lista para reclamar": PET Conect@ prepares a business's page
 * and sends it `<app>/?invitacion=<token>`. The link opens a preview;
 * claiming it means signing up (or in) as a business, and the token has
 * to survive that detour — so it's read once here, and handed to the
 * backend as soon as a business account is signed in.
 */
const PARAM = 'invitacion';

const isWeb = () => Platform.OS === 'web' && typeof window !== 'undefined';

let pendingToken: string | null = isWeb()
  ? new URLSearchParams(window.location.search).get(PARAM)
  : null;

export function invitationToken(): string | null {
  return pendingToken;
}

/** Done with it: forget it, and take it out of the address bar. */
export function clearInvitation(): void {
  pendingToken = null;
  if (!isWeb()) return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(PARAM)) return;
  url.searchParams.delete(PARAM);
  window.history.replaceState(null, '', url.toString());
}

/** The app's own address (with the GitHub Pages folder, when there is
 * one) — from the admin panel, which may be open at …/admin. */
const FALLBACK_APP_URL = 'https://pawmates-one.vercel.app/';

export function invitationUrl(token: string): string {
  const base = isWeb() ? new URL(window.location.href) : new URL(FALLBACK_APP_URL);
  base.pathname = base.pathname.replace(/admin\/?$/, '').replace(/\/?$/, '/');
  base.search = `?${PARAM}=${encodeURIComponent(token)}`;
  base.hash = '';
  return base.toString();
}

/**
 * Called right after signing up or in. Only a business account claims;
 * anyone else keeps the link for later. Never fails the sign-in: if the
 * claim doesn't go through, the account is fine and the business can
 * fill in its page itself.
 */
export async function claimPendingInvitation(auth: { token: string; roles: string[] }): Promise<void> {
  const token = pendingToken;
  if (!token || !auth.roles.includes('provider')) return;
  try {
    await api.claimInvitation(auth.token, token);
    clearInvitation();
  } catch {
    // See above: the business can still fill in its page by hand.
  }
}
