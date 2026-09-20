import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, fonts, radius } from '../theme/tokens';
import Field from './Field';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
};

// A real editable counterpart to Field's InputDisplay — same visual shell,
// used for auth/pet forms where InputDisplay's read-only Text doesn't work.
export default function TextField({ label, ...inputProps }: Props) {
  return (
    <Field label={label}>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textMuted50}
        autoCapitalize="none"
        autoCorrect={false}
        {...inputProps}
      />
    </Field>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.divider,
    borderRadius: radius.md,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },
});
