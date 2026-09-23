// The days and times an owner can ask for a walk. Times are whole and
// half hours in the owner's own timezone; a slot is "minutes after
// midnight" so it can be compared and keyed without Date objects.

const DAYS_AHEAD = 14;
const FIRST_SLOT = 7 * 60; // 7:00
const LAST_SLOT = 20 * 60; // 20:00
const STEP = 30;
/** How far ahead of now a same-day slot has to be — a request needs
 * time to be seen and accepted. */
const MIN_NOTICE_MINUTES = 60;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Today and the next two weeks, each at local midnight. */
export function bookableDays(now: Date): Date[] {
  const today = startOfDay(now);
  return Array.from({ length: DAYS_AHEAD }, (_, i) =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + i),
  );
}

/** The slots still open on `day`: all of them on a later day, only
 * those far enough ahead of `now` today. */
export function slotsFor(day: Date, now: Date): number[] {
  const all: number[] = [];
  for (let m = FIRST_SLOT; m <= LAST_SLOT; m += STEP) all.push(m);
  if (startOfDay(now).getTime() !== day.getTime()) return all;
  const earliest = now.getHours() * 60 + now.getMinutes() + MIN_NOTICE_MINUTES;
  return all.filter((m) => m >= earliest);
}

export function atSlot(day: Date, minutes: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minutes / 60), minutes % 60);
}

export function slotLabel(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
}

export function dayLabel(day: Date, now: Date): string {
  const diff = Math.round((day.getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  return day.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "jueves 25 de septiembre, 9:30" — the summary and confirmation. */
export function formatWhen(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  return `${date}, ${slotLabel(d.getHours() * 60 + d.getMinutes())}`;
}
