import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../theme/tokens';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  square?: boolean; // vaccine checkboxes use a square dot in the source markup
};

// Mirrors .radio + .dot: a circular (or square, for the vaccine checklist)
// selectable dot with an accent-filled ring when checked.
export default function RadioRow({ label, selected, onPress, square }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.dot, square && styles.dotSquare, selected && styles.dotSelected]} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  dot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: colors.divider,
  },
  dotSquare: { borderRadius: radius.sm },
  dotSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  label: { fontFamily: fonts.body, fontSize: 14, color: colors.text },
});
