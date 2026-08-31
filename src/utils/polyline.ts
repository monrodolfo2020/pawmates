// Google's polyline encoding algorithm (precision 5) — the format Mapbox's
// Static Images API expects for a `path` overlay. Encodes a route as a
// compact ASCII string instead of a raw lat/lng list, which matters once a
// walk has built up dozens of GPS points: a Static Images request URL has
// a practical length ceiling, and this keeps even a long route well under it.
export function encodePolyline(points: { lat: number; lng: number }[]): string {
  let result = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const { lat, lng } of points) {
    const latE5 = Math.round(lat * 1e5);
    const lngE5 = Math.round(lng * 1e5);
    result += encodeSignedNumber(latE5 - prevLat);
    result += encodeSignedNumber(lngE5 - prevLng);
    prevLat = latE5;
    prevLng = lngE5;
  }

  return result;
}

function encodeSignedNumber(num: number): string {
  let sgnNum = num << 1;
  if (num < 0) sgnNum = ~sgnNum;
  return encodeNumber(sgnNum);
}

function encodeNumber(num: number): string {
  let result = '';
  while (num >= 0x20) {
    result += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }
  result += String.fromCharCode(num + 63);
  return result;
}
