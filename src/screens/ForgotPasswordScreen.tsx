import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MailCheck } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { CardBody } from '../components/CardText';
import { colors, space, type } from '../theme/tokens';
import { api } from '../api/client';
import ScreenHeader from '../components/ScreenHeader';
import Notice from '../components/Notice';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await api.forgotPassword(email.trim());
      // Always shown, whether or not the email is actually registered —
      // the backend never reveals that either (see its own comment).
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el enlace.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <ScreenContainer>
        <View style={styles.body}>
          <MailCheck size={40} strokeWidth={1.25} color={colors.text} />
          <Text style={styles.title}>Revisa tu correo</Text>
          <CardBody style={{ textAlign: 'center' }}>
            Si {email.trim()} tiene una cuenta con nosotros, te enviamos un enlace para restablecer tu
            contraseña. Vence en 60 minutos.
          </CardBody>
          <Button variant="primary" block onPress={() => navigation.navigate('Login')}>
            Volver a iniciar sesión
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => navigation.goBack()} title="Olvidé mi contraseña" />
      <View style={styles.form}>
        <CardBody>Escribe tu correo y te enviamos un enlace para crear una contraseña nueva.</CardBody>
        <TextField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="tu@correo.com"
        />
        {error && <Notice tone="danger">{error}</Notice>}
        <Button variant="primary" block disabled={submitting || !email.trim()} onPress={handleSubmit}>
          {submitting ? 'Enviando…' : 'Enviar enlace'}
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: { paddingHorizontal: space.s4, gap: space.s4 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s3, paddingHorizontal: space.s6 },
  title: { ...type.title },
});
