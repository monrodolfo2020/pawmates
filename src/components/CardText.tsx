import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { colors, fonts } from '../theme/tokens';

type P = { children: React.ReactNode; style?: StyleProp<TextStyle> };

export function CardKicker({ children, style }: P) {
  return (
    <Text
      style={[
        { fontFamily: fonts.body, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.accent },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function CardTitle({ children, style }: P) {
  return (
    <Text style={[{ fontFamily: fonts.heading, fontSize: 17, lineHeight: 20, color: colors.text }, style]}>
      {children}
    </Text>
  );
}

export function CardBody({ children, style }: P) {
  return (
    <Text style={[{ fontFamily: fonts.body, fontSize: 13, color: colors.text, opacity: 0.8 }, style]}>
      {children}
    </Text>
  );
}

export function CardMeta({ children, style }: P) {
  return (
    <Text style={[{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted50 }, style]}>
      {children}
    </Text>
  );
}
