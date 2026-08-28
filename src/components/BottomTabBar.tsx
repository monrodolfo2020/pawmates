import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, fonts, space } from '../theme/tokens';

export type TabItem = { label: string; onPress: () => void };

export default function BottomTabBar({ items, activeIndex }: { items: TabItem[]; activeIndex: number }) {
  return (
    <View style={styles.wrap}>
      {items.map((item, i) => (
        <Pressable key={item.label} style={styles.item} onPress={item.onPress}>
          <Text style={[styles.label, i === activeIndex && styles.active]}>{item.label}</Text>
        </Pressable>
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
