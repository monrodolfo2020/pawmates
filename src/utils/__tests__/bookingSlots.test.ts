import { atSlot, bookableDays, dayLabel, formatWhen, slotLabel, slotsFor } from '../bookingSlots';

// Wednesday 23 Sep 2026, 14:10 local time.
const NOW = new Date(2026, 8, 23, 14, 10);

describe('bookingSlots', () => {
  it('offers today and the next 13 days, each at midnight', () => {
    const days = bookableDays(NOW);
    expect(days).toHaveLength(14);
    expect(days[0]).toEqual(new Date(2026, 8, 23));
    expect(days[13]).toEqual(new Date(2026, 9, 6));
  });

  it('offers every half hour from 7:00 to 20:00 on a later day', () => {
    const slots = slotsFor(new Date(2026, 8, 24), NOW);
    expect(slots[0]).toBe(7 * 60);
    expect(slots[slots.length - 1]).toBe(20 * 60);
    expect(slots).toHaveLength(27);
  });

  it('only offers slots at least an hour ahead today', () => {
    // 14:10 + 60 min = 15:10, so the first slot is 15:30.
    expect(slotsFor(new Date(2026, 8, 23), NOW)[0]).toBe(15 * 60 + 30);
  });

  it('offers nothing today once it is too late', () => {
    expect(slotsFor(new Date(2026, 8, 23), new Date(2026, 8, 23, 19, 30))).toEqual([]);
  });

  it('builds the local date and time of a slot', () => {
    expect(atSlot(new Date(2026, 8, 24), 9 * 60 + 30)).toEqual(new Date(2026, 8, 24, 9, 30));
    expect(slotLabel(9 * 60)).toBe('9:00');
    expect(slotLabel(17 * 60 + 30)).toBe('17:30');
  });

  it('names today and tomorrow in words', () => {
    expect(dayLabel(new Date(2026, 8, 23), NOW)).toBe('Hoy');
    expect(dayLabel(new Date(2026, 8, 24), NOW)).toBe('Mañana');
    expect(dayLabel(new Date(2026, 8, 25), NOW)).not.toMatch(/Hoy|Mañana/);
  });

  it('formats a booking time for the summary', () => {
    expect(formatWhen(new Date(2026, 8, 24, 9, 30).toISOString())).toMatch(/24.*septiembre, 9:30$/);
  });
});
