import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import type { GeoPoint } from './distance';

export type MyLocationStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable';

/** A browser indoors can sit on a position request for a long time;
 * past this the directory just stays in its usual order. */
const TIMEOUT_MS = 12000;

/** Kept for the whole visit, so going into a business and back doesn't
 * ask for the location again. Never stored or sent anywhere: distances
 * are worked out on this device. */
let remembered: GeoPoint | null = null;

/** One tap, one reading: asks for permission if needed. 'denied' when the
 * person said no; throws when the device couldn't get a position. */
export async function locateOnce(): Promise<GeoPoint | 'denied'> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) return 'denied';
  return currentPoint();
}

export async function currentPoint(): Promise<GeoPoint> {
  const position = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)),
  ]);
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

/**
 * Where the person using the app is, to show the nearest businesses first.
 *
 * Only asks when told to (`request`, from a tap) — except when permission
 * was already granted before, in which case it just reads the position,
 * since the browser or phone won't show a prompt for that anyway.
 */
export function useMyLocation({ askNow = false }: { askNow?: boolean } = {}) {
  const [point, setPoint] = useState<GeoPoint | null>(remembered);
  const [status, setStatus] = useState<MyLocationStatus>(remembered ? 'ready' : 'idle');
  const mounted = useRef(true);

  const locate = useCallback(async (prompt: boolean) => {
    setStatus('locating');
    try {
      const permission = prompt
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();
      if (!permission.granted) {
        if (mounted.current) setStatus(permission.status === 'denied' ? 'denied' : 'idle');
        return;
      }
      const here = await currentPoint();
      remembered = here;
      if (mounted.current) {
        setPoint(here);
        setStatus('ready');
      }
    } catch {
      if (mounted.current) setStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!remembered) void locate(askNow);
    return () => {
      mounted.current = false;
    };
  }, [locate, askNow]);

  const request = useCallback(() => void locate(true), [locate]);
  return { point, status, request };
}
