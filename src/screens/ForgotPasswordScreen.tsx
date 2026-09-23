import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChevronLeft, MailCheck } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import TextField from '../components/TextField';
import Card from '../components/Card';
import { CardBody } from '../components/CardText';
import { colors, fonts, space } from '../theme/tokens';
import { api } from '../api/client';

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
          <MailCheck size={40} strokeWidth={1.5} color={colors.accent} />
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
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.headerTitle}>Olvidé mi contraseña</Text>
      </View>
      <View style={styles.form}>
        <CardBody>Escribe tu correo y te enviamos un enlace para crear una contraseña nueva.</CardBody>
        <TextField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="tu@correo.com"
        />
        {error && (
          <Card>
            <CardBody style={{ color: colors.accent }}>{error}</CardBody>
          </Card>
        )}
        <Button variant="primary" block disabled={submitting || !email.trim()} onPress={handleSubmit}>
          {submitting ? 'Enviando…' : 'Enviar enlace'}
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
  },
  headerTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  form: { paddingHorizontal: space.s4, gap: space.s4 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s3, paddingHorizontal: space.s6 },
  title: { fontFamily: fonts.heading, fontSize: 26, color: colors.text },
});
