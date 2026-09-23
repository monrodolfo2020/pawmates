import React from 'react';
import { Pressable, Text, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, fonts, radius, space } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  block?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

// Mirrors .btn with .btn-primary/-secondary/-ghost/-block.
export default function Button({
  children, onPress, variant = 'secondary', block, icon, style, disabled,
}: Props) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        VARIANTS[variant],
        block && styles.block,
        pressed && !disabled && PRESSED[variant],
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.text, TEXT_VARIANTS[variant]]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: space.s2 * 1.35,
    paddingHorizontal: space.s3 * 1.2,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  block: { width: '100%' },
  disabled: { opacity: 0.45 },
  text: { fontFamily: fonts.bodyBold, fontSize: 14 },
});

const VARIANTS = StyleSheet.create({
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  secondary: { backgroundColor: colors.surface, borderColor: colors.divider },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: space.s1 },
});

const PRESSED = StyleSheet.create({
  primary: { backgroundColor: colors.accent700 },
  secondary: { backgroundColor: colors.neutral100 },
  ghost: { backgroundColor: colors.accent100 },
});

const TEXT_VARIANTS = StyleSheet.create({
  primary: { color: colors.bg },
  secondary: { color: colors.text },
  ghost: { color: colors.accent },
});

export function IconButton({
  children, onPress, style,
}: { children: React.ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [iconStyles.base, pressed && { backgroundColor: colors.neutral100 }, style]}
    >
      {children}
    </Pressable>
  );
}

const iconStyles = StyleSheet.create({
  base: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.surface,
  },
});
