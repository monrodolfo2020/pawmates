/**
 * wa.me links for the directory's "Contactar por WhatsApp" buttons.
 * Businesses type their number however they like ("55 1234 5678",
 * "+52 55-1234-5678"), so everything but the digits is stripped; wa.me
 * needs a country code, and Mexico's is assumed for the 10-digit local
 * numbers most businesses will enter.
 */
const MX_COUNTRY_CODE = '52';

export function whatsappUrl(rawNumber: string, businessName?: string): string | null {
  const digits = rawNumber.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const number = digits.length === 10 ? `${MX_COUNTRY_CODE}${digits}` : digits;
  const text = businessName
    ? `?text=${encodeURIComponent(`Hola ${businessName}, los encontré en PawMates.`)}`
    : '';
  return `https://wa.me/${number}${text}`;
}

/** The public URL of a business's micro-page, the thing they actually
 * share. Built from the browser's own origin on web so it's correct in
 * local dev and in production without a second env var to keep in sync. */
const FALLBACK_APP_ORIGIN = 'https://pawmates-one.vercel.app';

export function micrositeUrl(slug: string): string {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : FALLBACK_APP_ORIGIN;
  return `${origin}/s/${slug}`;
}
