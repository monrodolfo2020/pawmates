import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Field from './Field';
import Tag from './Tag';
import { CardMeta } from './CardText';
import { space, type } from '../theme/tokens';
import { bookableDays, dayLabel, slotLabel, slotsFor } from '../utils/bookingSlots';

export type When = { day: Date; slot: number | null };

// Where the day splits for the time groups, in minutes after midnight.
const AFTERNOON = 12 * 60;
const EVENING = 18 * 60;

/** Today at local midnight with no time picked — the starting value. */
export function initialWhen(now = new Date()): When {
  return { day: bookableDays(now)[0], slot: null };
}

/**
 * The day and time for a request: the next two weeks as chips, then the
 * open half-hours of that day grouped into morning, afternoon and
 * evening. Used wherever an owner asks a business for a time (a walk, a
 * Meet & Greet), so both ask the same way.
 */
export default function WhenPicker({ value, onChange }: { value: When; onChange: (next: When) => void }) {
  // Built once per visit: "today" shouldn't shift while someone chooses.
  const now = useMemo(() => new Date(), []);
  const days = useMemo(() => bookableDays(now), [now]);
  const slots = useMemo(() => slotsFor(value.day, now), [value.day, now]);
  const chosen = value.slot !== null && slots.includes(value.slot) ? value.slot : null;

  const groups = [
    { label: 'Mañana', slots: slots.filter((m) => m < AFTERNOON) },
    { label: 'Tarde', slots: slots.filter((m) => m >= AFTERNOON && m < EVENING) },
    { label: 'Noche', slots: slots.filter((m) => m >= EVENING) },
  ].filter((g) => g.slots.length > 0);

  return (
    <>
      <Field label="Día">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {days.map((d) => (
            <Tag
              key={d.toISOString()}
              variant={d.getTime() === value.day.getTime() ? 'accent' : 'outline'}
              onPress={() => onChange({ day: d, slot: null })}
            >
              {dayLabel(d, now)}
            </Tag>
          ))}
        </ScrollView>
      </Field>

      <Field label="Hora">
        {groups.length === 0 ? (
          <CardMeta>Ya no quedan horarios para hoy. Elige otro día.</CardMeta>
        ) : (
          <View style={styles.groups}>
            {groups.map((group) => (
              <View key={group.label} style={styles.group}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                <View style={styles.slotGrid}>
                  {group.slots.map((minutes) => (
                    <Tag
                      key={minutes}
                      variant={chosen === minutes ? 'accent' : 'outline'}
                      onPress={() => onChange({ day: value.day, slot: minutes })}
                      style={styles.slot}
                    >
                      {slotLabel(minutes)}
                    </Tag>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </Field>
    </>
  );
}

/** The chosen slot, or null if none (or it's no longer open). */
export function chosenSlot(value: When, now = new Date()): number | null {
  return value.slot !== null && slotsFor(value.day, now).includes(value.slot) ? value.slot : null;
}

const styles = StyleSheet.create({
  chipRow: { gap: space.s2, paddingRight: space.s6 },
  groups: { gap: space.s4 },
  group: { gap: space.s2 },
  groupLabel: { ...type.kicker },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 },
  slot: { minWidth: 64, alignItems: 'center' },
});
