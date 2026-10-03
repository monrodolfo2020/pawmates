import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, radius, shadow } from '../theme/tokens';

type Option = { label: string; value: string };

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  /** Many options: let them flow onto a second row on a narrow screen
   * instead of squeezing every label into one. */
  wrap?: boolean;
};

// A segmented control: a bone track with the chosen option lifted onto a
// white pill — a clear "this one" without another fill color.
export default function Segmented({ options, value, onChange, wrap = false }: Props) {
  return (
    <View style={[styles.wrap, wrap && styles.wrapMany]} accessibilityRole="tablist">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(opt.value)}
            style={[styles.opt, wrap && styles.optMany, selected && styles.selected]}
          >
            <Text style={[styles.text, selected && styles.textSelected]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    padding: 3,
    gap: 3,
    borderRadius: radius.md,
    backgroundColor: colors.panel,
  },
  opt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: radius.md - 3,
  },
  wrapMany: { flexWrap: 'wrap' },
  optMany: { flex: 0, flexGrow: 1, flexBasis: 'auto' },
  selected: { backgroundColor: colors.surface, ...shadow.sm },
  text: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted },
  textSelected: { fontFamily: fonts.bodySemiBold, color: colors.text },
});
