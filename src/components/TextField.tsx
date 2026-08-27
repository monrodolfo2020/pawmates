import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, fonts } from '../theme/tokens';
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
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 0,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },
});
