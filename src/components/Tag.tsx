import React from 'react';
import { Text, View, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { colors, fonts, radius } from '../theme/tokens';

type Variant = 'accent' | 'neutral' | 'outline';

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

// Mirrors .tag with .tag-accent / .tag-neutral / .tag-outline.
export default function Tag({ children, variant = 'neutral', onPress, style }: Props) {
  const body = (
    <View style={[styles.base, VARIANTS[variant], style]}>
      <Text style={[styles.text, TEXT_VARIANTS[variant]]}>{children}</Text>
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{body}</Pressable>;
  return body;
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: radius.md * 0.75,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 0.2,
  },
});

const VARIANTS = StyleSheet.create({
  accent: { backgroundColor: colors.accent100 },
  neutral: { backgroundColor: colors.neutral100 },
  outline: { borderWidth: 1, borderColor: colors.accent, backgroundColor: 'transparent' },
});

const TEXT_VARIANTS = StyleSheet.create({
  accent: { color: colors.accent800 },
  neutral: { color: colors.neutral800 },
  outline: { color: colors.accent },
});
