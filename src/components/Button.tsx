import React from 'react';
import { Pressable, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, fonts, radius, space } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: 'md' | 'sm';
  block?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

/**
 * The app's only button. One primary per screen (coral fill); secondary
 * is white with a border; ghost is a coral text link; danger is for
 * destructive actions (reject, delete, cancel a confirmed walk), and
 * destructive is its filled form, only for the final "yes, delete it".
 */
export default function Button({
  children, onPress, variant = 'secondary', size = 'md', block, icon, style, disabled,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.sm,
        VARIANTS[variant],
        block && styles.block,
        pressed && !disabled && PRESSED[variant],
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.text, size === 'sm' && styles.textSm, TEXT_VARIANTS[variant]]}>{children}</Text>
    </Pressable>
  );
}

/** The color an icon inside a Button of this variant should use. */
export function buttonIconColor(variant: Variant = 'secondary'): string {
  return TEXT_VARIANTS[variant].color as string;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s2,
    minHeight: 48,
    paddingVertical: space.s3,
    paddingHorizontal: space.s5,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sm: { minHeight: 38, paddingVertical: space.s2, paddingHorizontal: space.s4, borderRadius: radius.sm + 2 },
  block: { alignSelf: 'stretch' },
  disabled: { opacity: 0.4 },
  text: { fontFamily: fonts.bodySemiBold, fontSize: 15 },
  textSm: { fontSize: 13.5 },
});

const VARIANTS = StyleSheet.create({
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: space.s2 },
  danger: { backgroundColor: colors.surface, borderColor: colors.dangerLine },
  destructive: { backgroundColor: colors.danger, borderColor: colors.danger },
});

const PRESSED = StyleSheet.create({
  primary: { backgroundColor: colors.accentPressed, borderColor: colors.accentPressed },
  secondary: { backgroundColor: colors.panel },
  ghost: { backgroundColor: colors.accentTint },
  danger: { backgroundColor: colors.dangerTint },
  destructive: { backgroundColor: '#8F1C39', borderColor: '#8F1C39' },
});

const TEXT_VARIANTS = StyleSheet.create({
  primary: { color: colors.onAccent },
  secondary: { color: colors.text },
  ghost: { color: colors.accent },
  danger: { color: colors.danger },
  destructive: { color: colors.onAccent },
});

export function IconButton({
  children, onPress, style, label,
}: { children: React.ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle>; label?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [iconStyles.base, pressed && { backgroundColor: colors.panel }, style]}
    >
      {children}
    </Pressable>
  );
}

const iconStyles = StyleSheet.create({
  base: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
});
