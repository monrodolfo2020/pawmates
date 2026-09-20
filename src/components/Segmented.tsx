import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../theme/tokens';

type Option = { label: string; value: string };

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
};

// Mirrors .seg + .seg-opt: a segmented control, selected step filled accent.
export default function Segmented({ options, value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.opt,
              i > 0 && styles.divider,
              selected && styles.selected,
            ]}
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
    borderWidth: 1.5,
    borderColor: colors.divider,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  opt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  divider: { borderLeftWidth: 1.5, borderLeftColor: colors.divider },
  selected: { backgroundColor: colors.accent },
  text: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  textSelected: { fontFamily: fonts.bodyBold, color: '#fff' },
});
