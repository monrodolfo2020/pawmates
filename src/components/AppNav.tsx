import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Menu, X } from 'lucide-react-native';
import { colors, fonts, space, radius } from '../theme/tokens';
import Wordmark from './Wordmark';

export type NavItem = { label: string; onPress: () => void };

// This is one responsive web app, not separate mobile/desktop builds, so
// the split is driven by viewport width (not Platform.OS) — the same
// browser tab flips shape as it's resized. Below the breakpoint: a
// right-aligned "Menú" toggle that expands an accordion panel beneath it,
// pushing the rest of the screen down rather than floating over it. At or
// above it: the same items laid out as a plain horizontal top bar.
const WEB_BREAKPOINT = 768;

export default function AppNav({ items, activeIndex }: { items: NavItem[]; activeIndex: number }) {
  const { width } = useWindowDimensions();
  const isWide = width >= WEB_BREAKPOINT;
  const [open, setOpen] = useState(false);

  if (isWide) {
    return (
      <View style={styles.webBar}>
        <Wordmark />
        <View style={styles.webItems}>
        {items.map((item, i) => (
          <Pressable key={item.label} style={styles.webItem} onPress={item.onPress}>
            <Text style={[styles.itemText, i === activeIndex && styles.itemTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mobileWrap}>
      <View style={styles.mobileRow}>
        <Wordmark />
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.menuBtn} onPress={() => setOpen((v) => !v)}>
          {open ? (
            <X size={16} strokeWidth={2} color={colors.text} />
          ) : (
            <Menu size={16} strokeWidth={2} color={colors.text} />
          )}
          <Text style={styles.menuBtnText}>Menú</Text>
        </Pressable>
      </View>
      {open && (
        <View style={styles.accordion}>
          {items.map((item, i) => (
            <Pressable
              key={item.label}
              style={styles.accordionItem}
              onPress={() => {
                setOpen(false);
                item.onPress();
              }}
            >
              <Text style={[styles.itemText, i === activeIndex && styles.itemTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  webBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.bg,
    paddingVertical: space.s3,
    paddingHorizontal: space.s6,
  },
  webItems: { flexDirection: 'row', gap: space.s6 },
  webItem: { paddingHorizontal: space.s1, paddingVertical: space.s1 },
  itemText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textMuted,
  },
  itemTextActive: { color: colors.text, fontFamily: fonts.bodyBold },

  mobileWrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.bg,
  },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.s4,
    paddingVertical: space.s2,
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: space.s4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  menuBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text },

  accordion: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingVertical: space.s2,
  },
  accordionItem: {
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
  },
});
