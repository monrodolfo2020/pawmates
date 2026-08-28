import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { colors, fonts, space } from '../theme/tokens';

export type MapPin = { id: string; name: string; top: number; left: number; onPress?: () => void };

const DEFAULT_PINS: MapPin[] = [
  { id: 'w1', name: 'Camila', top: 34, left: 28 },
  { id: 'w2', name: 'Diego', top: 58, left: 52 },
  { id: 'w3', name: 'Ana', top: 22, left: 66 },
];

// Mirrors the design's schematic map: a graph-paper grid with labeled dots
// for nearby walkers and a hollow ring for "you" — no real map tiles (this
// MVP has no geolocation backend), but labeled and legended so it reads
// clearly as a map rather than decoration.
export default function MapMock({ height = 200, pins = DEFAULT_PINS }: { height?: number; pins?: MapPin[] }) {
  const gridLines = [];
  for (let i = 0; i <= 300; i += 24) gridLines.push(i);

  return (
    <View style={styles.outer}>
      <View style={[styles.wrap, { height }]}>
        <Svg width="100%" height="100%" viewBox="0 0 300 180" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
          {gridLines.map((x) => (
            <Line key={`v${x}`} x1={x} y1={0} x2={x} y2={180} stroke={colors.divider} strokeWidth={1} />
          ))}
          {gridLines.map((y) => (
            <Line key={`h${y}`} x1={0} y1={y} x2={300} y2={y} stroke={colors.divider} strokeWidth={1} />
          ))}
        </Svg>

        <View style={[styles.pinWrap, { top: '5%', left: '4%' }]}>
          <View style={styles.you} />
          <Text style={styles.youLabel}>Tú</Text>
        </View>

        {pins.map((p) => (
          <Pressable
            key={p.id}
            onPress={p.onPress}
            style={[styles.pinWrap, { top: `${p.top}%`, left: `${p.left}%` }]}
          >
            <View style={styles.pin} />
            <Text style={styles.pinLabel}>{p.name}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.you} />
          <Text style={styles.legendText}>Tú</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.pin} />
          <Text style={styles.legendText}>Paseador cercano</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { marginHorizontal: space.s4, marginBottom: space.s3 },
  wrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  pinWrap: { position: 'absolute', alignItems: 'center', gap: 3 },
  pin: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.accent,
    borderWidth: 4, borderColor: colors.accent200,
  },
  pinLabel: {
    fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.accent800,
    backgroundColor: colors.accent100, paddingHorizontal: 5, paddingVertical: 1,
  },
  you: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: colors.text, backgroundColor: colors.bg,
  },
  youLabel: {
    fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.text,
    backgroundColor: colors.bg, paddingHorizontal: 5, paddingVertical: 1,
  },
  legend: { flexDirection: 'row', gap: space.s4, paddingTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendText: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted70 },
});
