import { Platform } from 'react-native';
import { navigationRef } from './navigationRef';

/**
 * Each "Cómo funciona" video has its own link, `<app>/?video=<id>`, so a
 * business can send one to someone. Opening it lands on the videos screen
 * with that video already playing, signed in or not.
 */
const PARAM = 'video';

const isWeb = () => Platform.OS === 'web' && typeof window !== 'undefined';

/** The app's own address (with the GitHub Pages folder, when there is
 * one), so the link works wherever the app is being served from. */
const FALLBACK_APP_URL = 'https://pawmates-one.vercel.app/';

export function videoShareUrl(videoId: string): string {
  const base = isWeb() ? new URL('./', window.location.href) : new URL(FALLBACK_APP_URL);
  base.search = `?${PARAM}=${encodeURIComponent(videoId)}`;
  base.hash = '';
  return base.toString();
}

function linkedVideoId(): string | null {
  if (!isWeb()) return null;
  return new URLSearchParams(window.location.search).get(PARAM);
}

/**
 * Opens the linked video once the navigator can take it. Retried for a
 * moment because a signed-in owner's screens appear only after their pets
 * load; gives up quietly where there is no videos screen (e.g. a terms
 * acceptance standing in front of the app).
 */
export function openLinkedVideo(attempt = 0) {
  const videoId = linkedVideoId();
  if (!videoId) return;
  const routeNames = navigationRef.isReady() ? navigationRef.getRootState()?.routeNames ?? [] : [];
  if (!routeNames.includes('HowTo')) {
    if (attempt < 20) setTimeout(() => openLinkedVideo(attempt + 1), 250);
    return;
  }
  navigationRef.navigate('HowTo', { videoId });
  // Once is enough: reloading the page shouldn't reopen it.
  const url = new URL(window.location.href);
  url.searchParams.delete(PARAM);
  window.history.replaceState(null, '', url.toString());
}
