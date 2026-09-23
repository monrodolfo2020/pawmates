import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius, space } from '../theme/tokens';

type Props = { label: string; children: React.ReactNode };

export default function Field({ label, children }: Props) {
  return (
    <View style={{ gap: space.s2 - 2 }}>
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
  label: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.text },
  input: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: space.s3,
    paddingHorizontal: space.s4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  inputText: { fontFamily: fonts.body, fontSize: 15, color: colors.text },
});
