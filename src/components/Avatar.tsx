import React from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { fonts, radius, tintFor } from '../theme/tokens';

type Props = {
  /** Used for the initials and to pick the tint, so it's stable per name. */
  name: string;
  uri?: string | null;
  size?: number;
  /** Rounded square instead of a circle — for businesses and pets. */
  square?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?')[0];
  return letters.toUpperCase();
}

/**
 * A photo when there is one; otherwise the initials on a soft tint.
 * Most businesses start without photos, so this is what people see first —
 * it should look intentional, not like a missing image.
 */
export default function Avatar({ name, uri, size = 48, square, style }: Props) {
  const tint = tintFor(name);
  const shape = { width: size, height: size, borderRadius: square ? Math.round(size * 0.24) : radius.pill };
  if (uri) {
    return <Image source={{ uri }} style={[shape, styles.image, style as object]} resizeMode="cover" />;
  }
  return (
    <View style={[shape, styles.box, { backgroundColor: tint.bg }, style]} accessibilityElementsHidden>
      <Text style={[styles.text, { color: tint.fg, fontSize: Math.round(size * 0.4) }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { overflow: 'hidden' },
  text: { fontFamily: fonts.display },
});
