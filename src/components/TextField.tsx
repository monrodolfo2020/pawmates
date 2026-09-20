import React, { useState } from 'react';
import { TextInput, View, Pressable, StyleSheet, TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors, fonts, radius } from '../theme/tokens';
import Field from './Field';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
};

// A real editable counterpart to Field's InputDisplay — same visual shell,
// used for auth/pet forms where InputDisplay's read-only Text doesn't work.
// secureTextEntry gets an eye toggle instead of being passed straight
// through — every password field in the app goes through here (Login,
// Signup, AdminLogin), so this one change covers all three.
export default function TextField({ label, secureTextEntry, ...inputProps }: Props) {
  const [visible, setVisible] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <Field label={label}>
      <View style={styles.wrap}>
        <TextInput
          placeholderTextColor={colors.textMuted50}
          autoCapitalize="none"
          autoCorrect={false}
          {...inputProps}
          style={[styles.input, isPassword && styles.inputWithIcon]}
          secureTextEntry={isPassword && !visible}
        />
        {isPassword && (
          <Pressable style={styles.eyeBtn} onPress={() => setVisible((v) => !v)} hitSlop={8}>
            {visible ? (
              <EyeOff size={18} strokeWidth={1.5} color={colors.textMuted70} />
            ) : (
              <Eye size={18} strokeWidth={1.5} color={colors.textMuted70} />
            )}
          </Pressable>
        )}
      </View>
    </Field>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', justifyContent: 'center' },
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
  inputWithIcon: { paddingRight: 44 },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
