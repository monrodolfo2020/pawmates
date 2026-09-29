import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Bone } from 'lucide-react-native';
import { colors, fonts, space } from '../theme/tokens';
import type { RatingSummary } from '../api/client';

const MAX = 5;
/** A warm tan that reads as a bone on cream, and a faint one for the
 * bones not earned. */
const FILLED = '#C9954C';
const EMPTY = colors.border;

const bonesLabel = (n: number) => (n === 1 ? '1 huesito' : `${n} huesitos`);

/** A rating drawn in bones instead of stars, 1 to 5. A fractional value
 * (an average) fills the nearest whole bone. */
export function BoneRow({ value, size = 16 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <View style={styles.row} accessible accessibilityLabel={`${value} de ${MAX} huesitos`}>
      {Array.from({ length: MAX }, (_, i) => (
        <Bone
          key={i}
          size={size}
          strokeWidth={1.75}
          color={i < filled ? FILLED : EMPTY}
          fill={i < filled ? FILLED : 'transparent'}
        />
      ))}
    </View>
  );
}

/** "🦴🦴🦴🦴 4.7 (12)" for a business, or "Sin reseñas todavía". */
export function RatingLine({ rating, size = 14 }: { rating: RatingSummary | null; size?: number }) {
  if (!rating || rating.count === 0) {
    return <Text style={styles.none}>Sin reseñas todavía</Text>;
  }
  return (
    <View style={[styles.row, { gap: space.s2 }]}>
      <BoneRow value={rating.average} size={size} />
      <Text style={styles.average}>
        {rating.average.toFixed(1)}{' '}
        <Text style={styles.count}>
          ({rating.count} {rating.count === 1 ? 'reseña' : 'reseñas'})
        </Text>
      </Text>
    </View>
  );
}

/** Five bones to tap. */
export function BonePicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={[styles.row, { gap: space.s2 }]} accessibilityRole="radiogroup">
      {Array.from({ length: MAX }, (_, i) => {
        const n = i + 1;
        const on = n <= value;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            hitSlop={6}
            accessibilityRole="radio"
            accessibilityState={{ checked: n === value }}
            accessibilityLabel={bonesLabel(n)}
            testID={`bone-${n}`}
          >
            <Bone size={34} strokeWidth={1.5} color={on ? FILLED : colors.textFaint} fill={on ? FILLED : 'transparent'} />
          </Pressable>
        );
      })}
    </View>
  );
}

export const RATING_WORDS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  average: { fontFamily: fonts.heading, fontSize: 13.5, color: colors.text },
  count: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  none: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
});
