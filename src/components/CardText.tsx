import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { type } from '../theme/tokens';

type P = { children: React.ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number };

/** Small uppercase label above a title — muted, never a color. */
export function CardKicker({ children, style, numberOfLines }: P) {
  return <Text numberOfLines={numberOfLines} style={[type.kicker, style]}>{children}</Text>;
}

export function CardTitle({ children, style, numberOfLines }: P) {
  return <Text numberOfLines={numberOfLines} style={[type.cardTitle, style]}>{children}</Text>;
}

export function CardBody({ children, style, numberOfLines }: P) {
  return <Text numberOfLines={numberOfLines} style={[type.small, { fontSize: 14.5, lineHeight: 21 }, style]}>{children}</Text>;
}

export function CardMeta({ children, style, numberOfLines }: P) {
  return <Text numberOfLines={numberOfLines} style={[type.meta, style]}>{children}</Text>;
}
