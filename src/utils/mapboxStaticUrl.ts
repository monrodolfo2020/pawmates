import { encodePolyline } from './polyline';

export type MapPoint = { lat: number; lng: number };

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const STYLE = 'mapbox/streets-v12';

// A long walk can rack up a lot of GPS pings (one every ~5s or 10m of
// movement); the Static Images API URL has a practical length ceiling, so
// this caps how many points actually go into the drawn path — recent
// shape matters far more than every single historical ping for a small
// live-tracking widget.
const MAX_PATH_POINTS = 200;

/**
 * Mapbox Static Images API URL for a walk's route — a real street map
 * (not an interactive one; see LiveWalkScreen's comment for why a static
 * image instead of the full interactive SDK) with the route drawn as a
 * path plus start/current pins, auto-framed to fit. Returns null when
 * there's no token configured or no points to draw yet, so the caller can
 * fall back to something else instead of requesting a broken image.
 */
export function mapboxRouteImageUrl(
  route: MapPoint[],
  widthPx: number,
  heightPx: number,
): string | null {
  if (!MAPBOX_TOKEN || route.length === 0) return null;

  const sampled =
    route.length > MAX_PATH_POINTS
      ? route.filter((_, i) => i % Math.ceil(route.length / MAX_PATH_POINTS) === 0)
      : route;

  const overlays: string[] = [];
  if (sampled.length >= 2) {
    const encoded = encodeURIComponent(encodePolyline(sampled));
    overlays.push(`path-3+3B82F6-0.9(${encoded})`);
  }
  const start = sampled[0];
  const current = sampled[sampled.length - 1];
  overlays.push(`pin-s+1D1F20(${start.lng},${start.lat})`);
  if (current !== start) {
    overlays.push(`pin-s+3B82F6(${current.lng},${current.lat})`);
  }

  const overlayPath = overlays.join(',');

  // `auto` framing fits the pins/path's own bounding box, plus `padding`
  // (px) of margin around it. That works well once a walk has covered
  // real ground — but early on (a single point, or a GPS-jitter cluster
  // a few meters wide) the bounding box itself is close to zero-sized, and
  // `auto` falls back to one fixed per-point zoom that padding can't pull
  // back from (confirmed: bumping padding alone did nothing for this
  // case). Below a minimum real-world span, use an explicit center+zoom
  // instead of `auto` so there's always a real lever on how "zoomed out"
  // this looks, regardless of how tight the actual points are.
  const MIN_SPAN_DEGREES = 0.004; // ~400m at the equator — plenty for "zoomed out enough"
  const lats = sampled.map((p) => p.lat);
  const lngs = sampled.map((p) => p.lng);
  const span = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs));

  const position =
    span < MIN_SPAN_DEGREES ? `${current.lng},${current.lat},15` : 'auto';
  const padding = position === 'auto' ? '&padding=120' : '';

  return (
    `https://api.mapbox.com/styles/v1/${STYLE}/static/${overlayPath}/${position}/` +
    `${widthPx}x${heightPx}@2x?access_token=${MAPBOX_TOKEN}${padding}`
  );
}
