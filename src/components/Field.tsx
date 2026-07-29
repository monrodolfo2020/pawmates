import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, space } from '../theme/tokens';

type Props = { label: string; children: React.ReactNode };

// Mirrors .field > label + .input wrapper.
export default function Field({ label, children }: Props) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export function InputDisplay({ value }: { value: string }) {
  return (
    <View style={styles.input}>
      <Text style={styles.inputText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted70 },
  input: {
    minHeight: 36,
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 0,
  },
  inputText: { fontFamily: fonts.body, fontSize: 14, color: colors.text },
});
