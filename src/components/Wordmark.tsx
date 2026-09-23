import React from 'react';
import { Text } from 'react-native';
import { colors, fonts } from '../theme/tokens';

/** "PawMates" set in the display serif — the brand wherever there's a nav bar. */
export default function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <Text style={{ fontFamily: fonts.display, fontSize: size, color: colors.text }} accessibilityRole="header">
      Paw<Text style={{ color: colors.accent }}>Mates</Text>
    </Text>
  );
}
