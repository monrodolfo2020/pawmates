import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { KeyRound } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import TextField from '../components/TextField';
import Card from '../components/Card';
import { CardBody } from '../components/CardText';
import { colors, fonts, space } from '../theme/tokens';
import { api } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

// Reached only via the emailed /reset-password?token=... link (see
// RootNavigator's isResetPasswordGatePath) — a standalone gate like
// AdminLogin, not part of the normal guest/authed stack, since the
// reset token is the only credential here, independent of whatever
// session (if any) already exists in this browser.
export default function ResetPasswordScreen({ route }: Props) {
  const { token } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async () => {
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (mismatch) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.');
    } finally {
      setSubmitting(false);
    }
  };

  const goToLogin = () => {
    // No Login screen registered in this standalone gate (see comment
    // above) — a full reload lands back on the normal app, token cleared
    // from the URL, ready to sign in with the new password.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.root}>
        <View style={styles.body}>
          <View style={styles.icon}>
            <KeyRound size={40} strokeWidth={1.5} color={colors.accent} />
          </View>
          {done ? (
            <>
              <Text style={styles.title}>Contraseña actualizada</Text>
              <CardBody style={{ textAlign: 'center' }}>
                Ya puedes iniciar sesión con tu nueva contraseña.
              </CardBody>
              <Button variant="primary" block onPress={goToLogin}>
                Ir a iniciar sesión
              </Button>
            </>
          ) : (
            <>
              <Text style={styles.title}>Crea una nueva contraseña</Text>
              <TextField
                label="Contraseña nueva"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
              />
              <TextField
                label="Confirma la contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="••••••••"
              />
              {error && (
                <Card>
                  <CardBody style={{ color: colors.accent }}>{error}</CardBody>
                </Card>
              )}
              <Button
                variant="primary"
                block
                disabled={submitting || !password || !confirmPassword}
                onPress={handleSubmit}
              >
                {submitting ? 'Guardando…' : 'Restablecer contraseña'}
              </Button>
            </>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.s6 },
  body: { width: '100%', maxWidth: 360, gap: space.s3 },
  icon: { alignSelf: 'center' },
  title: { fontFamily: fonts.heading, fontSize: 24, color: colors.text, textAlign: 'center' },
});
