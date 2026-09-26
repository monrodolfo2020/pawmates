import { BusinessService } from '../api/client';

// Formatting and form helpers for a business's list of services (see
// BusinessService), shared by the profile, the booking form, the public
// page and the editor.

/** "$150" — prices are whole pesos in practice; cents only when there are some. */
export const pesos = (cents: number) =>
  '$' + (cents / 100).toLocaleString('es-MX', { maximumFractionDigits: 2 });

/** "30 min", "1 h", "1 h 30 min". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** The lowest price among the services, for "desde $150". */
export function lowestPrice(services: BusinessService[]): number | null {
  const prices = services.map((s) => s.price).filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
}

/** A service as it's being typed: price and minutes stay text until
 * saving, so "1" on the way to "150" isn't reformatted under the cursor. */
export type ServiceDraft = { id: string; name: string; detail: string; price: string; minutes: string };

export const toDraft = (s: BusinessService): ServiceDraft => ({
  id: s.id,
  name: s.name,
  detail: s.detail,
  price: s.price !== null ? String(s.price / 100) : '',
  minutes: s.durationMinutes !== null ? String(s.durationMinutes) : '',
});

// The same bounds the backend checks (service-catalog.ts).
export const priceProblem = (v: string) => {
  if (!v.trim()) return null;
  const n = Number(v.replace(/[$,\s]/g, ''));
  return Number.isFinite(n) && n > 0 && n <= 100000 ? null : 'Escribe el precio solo con números, por ejemplo 250.';
};
export const minutesProblem = (v: string) => {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 5 && n <= 1440 ? null : 'Escribe los minutos, entre 5 y 1440.';
};

/** Drafts → what the API takes, or the first problem to fix. Rows left
 * completely empty are dropped. */
export function draftsToServices(drafts: ServiceDraft[]): { services: BusinessService[] } | { error: string } {
  const rows = drafts.filter((d) => d.name.trim() || d.detail.trim() || d.price.trim() || d.minutes.trim());
  for (const [i, d] of rows.entries()) {
    if (!d.name.trim()) return { error: `Escribe el nombre del servicio ${i + 1}.` };
    const problem = priceProblem(d.price) ?? minutesProblem(d.minutes);
    if (problem) return { error: `Servicio ${i + 1}: ${problem}` };
  }
  return {
    services: rows.map((d) => ({
      id: d.id,
      name: d.name.trim(),
      detail: d.detail.trim(),
      price: d.price.trim() ? Math.round(Number(d.price.replace(/[$,\s]/g, '')) * 100) : null,
      durationMinutes: d.minutes.trim() ? Number(d.minutes) : null,
    })),
  };
}
