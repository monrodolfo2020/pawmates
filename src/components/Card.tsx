import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { colors, radius, space, shadow } from '../theme/tokens';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: 'sm' | 'md' | 'lg';
  row?: boolean;
  /** `panel`: an inset bone block instead of a white card — for notes and summaries. */
  tone?: 'surface' | 'panel';
  onPress?: () => void;
};

// A white card with a hairline border on the bone background. No shadow
// unless asked: borders carry the structure, shadows are for things that
// float.
export default function Card({
  children, style, elevation, row = false, tone = 'surface', onPress,
}: Props) {
  const content = (
    <View
      style={[
        styles.card,
        tone === 'panel' && styles.panel,
        row && styles.row,
        elevation ? shadow[elevation] : null,
        style,
      ]}
    >
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
    gap: space.s2,
    padding: space.s4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  panel: { backgroundColor: colors.panel, borderColor: colors.panel },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
  },
});
