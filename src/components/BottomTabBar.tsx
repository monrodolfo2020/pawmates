import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, space } from '../theme/tokens';

// Decorative bottom strip mirroring the design's tab labels — the design
// doesn't wire these tabs to real screens beyond the current one (Inicio /
// Panel), so this stays visual only, matching the prototype 1:1.
export default function BottomTabBar({ items, activeIndex }: { items: string[]; activeIndex: number }) {
  return (
    <View style={styles.wrap}>
      {items.map((label, i) => (
        <View key={label} style={styles.item}>
          <Text style={[styles.label, i === activeIndex && styles.active]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingVertical: space.s2,
    paddingHorizontal: space.s4,
  },
  item: { flex: 1, alignItems: 'center' },
  label: {
    fontFamily: fonts.body, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
    color: colors.text, opacity: 0.5,
  },
  active: { color: colors.accent, opacity: 1 },
});
