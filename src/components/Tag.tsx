import React from 'react';
import { Text, View, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { colors, fonts, radius, space } from '../theme/tokens';

// Two kinds of pill:
//   - status: neutral / success / warning / danger — small, not tappable,
//     says what state something is in. Use at most one per card.
//   - choice: `accent` (selected) / `outline` (not selected) — tappable
//     filters, time slots, temperaments.
type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'accent' | 'outline';

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function Tag({ children, variant = 'neutral', onPress, style }: Props) {
  const choice = variant === 'accent' || variant === 'outline';
  const body = (
    <View style={[styles.base, choice && styles.choice, VARIANTS[variant], style]}>
      <Text style={[styles.text, choice && styles.choiceText, TEXT_VARIANTS[variant]]}>{children}</Text>
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: variant === 'accent' }}
        onPress={onPress}
      >
        {body}
      </Pressable>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: space.s2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  choice: { paddingVertical: space.s2, paddingHorizontal: space.s3 + 2, borderRadius: radius.pill },
  text: { fontFamily: fonts.bodySemiBold, fontSize: 12 },
  choiceText: { fontFamily: fonts.bodyMedium, fontSize: 13.5 },
});

const VARIANTS = StyleSheet.create({
  neutral: { backgroundColor: colors.panel },
  success: { backgroundColor: colors.successTint },
  warning: { backgroundColor: colors.warningTint },
  danger: { backgroundColor: colors.dangerTint },
  accent: { backgroundColor: colors.accent, borderColor: colors.accent },
  outline: { backgroundColor: colors.surface, borderColor: colors.border },
});

const TEXT_VARIANTS = StyleSheet.create({
  neutral: { color: colors.textMuted },
  success: { color: colors.success },
  warning: { color: colors.warning },
  danger: { color: colors.danger },
  accent: { color: colors.onAccent, fontFamily: fonts.bodySemiBold },
  outline: { color: colors.text },
});

/**
 * Which status color a booking status gets, everywhere it's shown:
 * waiting on someone → warning; on the calendar or happening → success;
 * over → neutral; called off → danger.
 */
export function bookingStatusVariant(status: string): 'warning' | 'success' | 'danger' | 'neutral' {
  if (status === 'requested' || status === 'accepted') return 'warning';
  if (status === 'confirmed' || status === 'in_progress') return 'success';
  if (status === 'cancelled' || status === 'rejected') return 'danger';
  return 'neutral';
}
