import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Menu, X } from 'lucide-react-native';
import { colors, fonts, space, radius } from '../theme/tokens';

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
        {items.map((item, i) => (
          <Pressable key={item.label} style={styles.webItem} onPress={item.onPress}>
            <Text style={[styles.itemText, i === activeIndex && styles.itemTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.mobileWrap}>
      <View style={styles.mobileRow}>
        <Pressable style={styles.menuBtn} onPress={() => setOpen((v) => !v)}>
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
    justifyContent: 'center',
    gap: space.s8,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
    paddingVertical: space.s3,
  },
  webItem: { paddingHorizontal: space.s2 },
  itemText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.text,
    opacity: 0.45,
  },
  itemTextActive: { color: colors.accent, opacity: 1 },

  mobileWrap: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  mobileRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: space.s4,
    paddingVertical: space.s2,
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.divider,
    backgroundColor: colors.bg,
  },
  menuBtnText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.text },

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
