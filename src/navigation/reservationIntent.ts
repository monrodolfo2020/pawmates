import { Platform } from 'react-native';

/**
 * "Reservar en PawMates" on a business's public page links to
 * /s/<slug>/reservar. Whoever follows it is usually signed out, so the
 * wish to book has to outlive the detour through Login or Signup (and,
 * for a new owner, the first-pet screen): it's read from the URL once,
 * kept here, and consumed when the signed-in app opens that business.
 */
const PATH = /\/s\/([^/?#]+)\/reservar\/?$/;

let pendingSlug: string | null =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? (PATH.exec(window.location.pathname)?.[1] ?? null)
    : null;

export function reservationSlug(): string | null {
  return pendingSlug;
}

/** Done with it: forget it, and take it out of the address bar so a
 * reload later doesn't reopen the business. */
export function clearReservation(): void {
  pendingSlug = null;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && PATH.test(window.location.pathname)) {
    window.history.replaceState(null, '', window.location.pathname.replace(PATH, '/'));
  }
}

/** The link the public page's button points at. */
export function reservationPath(micrositeUrl: string): string {
  return `${micrositeUrl.replace(/\/$/, '')}/reservar`;
}
