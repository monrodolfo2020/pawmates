import { MyProviderProfile, isBookable } from '../api/client';

/** What the business still has to fill in before its page goes live —
 * mirrors ProviderProfile's publish rule on the backend, which is what
 * actually decides. Lives here because both "Mi página" and the
 * Dashboard tell the business the same thing, and two copies of a rule
 * this small is exactly how they drift apart. */
export function missingToPublish(profile: MyProviderProfile): string[] {
  const missing: string[] = [];
  if (!profile.businessName) missing.push('el nombre del negocio');
  if (!profile.bio) missing.push('la descripción');
  if (isBookable(profile.category) && !profile.price) missing.push('la tarifa por paseo');
  return missing;
}

/** "a, b y c" — Spanish lists take "y" before the last item, and
 * "Falta el nombre, la descripción" reads like a truncated sentence. */
export function listInSpanish(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}
