import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import TextField from '../components/TextField';
import Notice from '../components/Notice';
import ScreenHeader from '../components/ScreenHeader';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const s = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await s.login(email.trim(), password);
    } catch {
      // s.authError is already set for display below.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        onBack={() => navigation.goBack()}
        title="Iniciar sesión"
        subtitle="Qué gusto verte de nuevo."
      />
      <View style={styles.body}>
        <TextField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="tu@correo.com"
        />
        <TextField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotLink}>¿Olvidaste tu contraseña?</Text>
        </Pressable>
        {s.authError && <Notice tone="danger">{s.authError}</Notice>}
        <View style={styles.footer}>
          <Button
            variant="primary"
            block
            disabled={submitting || !email || !password}
            onPress={handleSubmit}
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.s4, gap: space.s4 },
  forgotLink: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.accent, marginTop: -space.s1 },
  footer: { marginTop: space.s2 },
});
