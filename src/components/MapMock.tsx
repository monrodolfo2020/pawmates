import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { colors, space } from '../theme/tokens';

const PINS = [
  { top: 34, left: 28 },
  { top: 58, left: 52 },
  { top: 22, left: 66 },
];

// Mirrors the design's schematic map: a graph-paper grid with accent dots
// for nearby walkers and a hollow ring for "you" — no real map tiles.
export default function MapMock({ height = 180 }: { height?: number }) {
  const gridLines = [];
  for (let i = 0; i <= 300; i += 24) gridLines.push(i);

  return (
    <View style={[styles.wrap, { height }]}>
      <Svg width="100%" height="100%" viewBox="0 0 300 180" style={StyleSheet.absoluteFill}>
        {gridLines.map((x) => (
          <Line key={`v${x}`} x1={x} y1={0} x2={x} y2={180} stroke={colors.divider} strokeWidth={1} />
        ))}
        {gridLines.map((y) => (
          <Line key={`h${y}`} x1={0} y1={y} x2={300} y2={y} stroke={colors.divider} strokeWidth={1} />
        ))}
      </Svg>
      {PINS.map((p, i) => (
        <View key={i} style={[styles.pin, { top: `${p.top}%`, left: `${p.left}%` }]} />
      ))}
      <View style={styles.you} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: space.s4,
    marginBottom: space.s3,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  pin: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.accent,
    shadowColor: colors.accent200, shadowOpacity: 1, shadowRadius: 4,
    borderWidth: 4, borderColor: colors.accent200,
  },
  you: {
    position: 'absolute', top: 10, left: 10, width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: colors.text,
  },
});
