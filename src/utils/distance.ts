export type GeoPoint = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Straight-line ("as the crow flies") distance in km between two points.
 * Good enough to put the nearest businesses first; the route by street is
 * the maps app's job once the owner taps "Cómo llegar". */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "a 350 m", "a 2.4 km", "a 18 km". */
export function formatDistance(km: number): string {
  if (km < 1) return `a ${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  if (km < 10) return `a ${km.toFixed(1)} km`;
  return `a ${Math.round(km)} km`;
}

/** The point a listing placed itself at, or null when it hasn't. */
export function pointOf(p: { latitude?: number | null; longitude?: number | null }): GeoPoint | null {
  return p.latitude != null && p.longitude != null ? { latitude: p.latitude, longitude: p.longitude } : null;
}

/**
 * Nearest first. Listings that haven't placed themselves on the map go
 * after, keeping the order they came in (best rated first).
 */
export function sortByDistance<T extends { latitude?: number | null; longitude?: number | null }>(
  items: T[],
  from: GeoPoint,
): T[] {
  return items
    .map((item, index) => {
      const point = pointOf(item);
      return { item, index, km: point ? distanceKm(from, point) : Infinity };
    })
    .sort((x, y) => x.km - y.km || x.index - y.index)
    .map((x) => x.item);
}
