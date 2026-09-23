import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, fonts, space } from '../theme/tokens';

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
    <Pressable
      accessibilityRole={square ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={styles.row}
    >
      <View style={[styles.dot, square && styles.dotSquare, selected && styles.dotSelected]}>
        {selected && square && <Check size={13} strokeWidth={3} color={colors.onAccent} />}
        {selected && !square && <View style={styles.inner} />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.s3, paddingVertical: space.s2, minHeight: 40 },
  dot: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  dotSquare: { borderRadius: 6 },
  inner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.onAccent },
  dotSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  label: { fontFamily: fonts.body, fontSize: 15, color: colors.text, flexShrink: 1 },
});
