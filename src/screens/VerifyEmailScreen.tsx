import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MailCheck } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { CardBody } from '../components/CardText';
import { colors, space, type } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import Notice from '../components/Notice';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

// Reachable both as a fresh provider's first screen after signup (no
// screen to go back to — see RootNavigator's initialAuthedRoute) and
// later from Dashboard's "Verificar correo" banner if they skipped it.
// Never a hard gate: "Omitir por ahora" always works, since this
// deployment may not have RESEND_API_KEY configured yet (see
// send-verification-email.ts) — a shopper stuck unable to receive any
// code would otherwise be locked out of their own account.
export default function VerifyEmailScreen({ navigation }: Props) {
  const s = useAppState();
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    handleSend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    setError(null);
    setSending(true);
    try {
      await s.sendVerificationEmail();
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el código.');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    setVerifying(true);
    try {
      await s.verifyEmail(code.trim());
      setVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo verificar el código.');
    } finally {
      setVerifying(false);
    }
  };

  const goToPanel = () => navigation.replace(s.roles.includes('provider') ? 'Dashboard' : 'Home');

  return (
    <ScreenContainer>
      <View style={styles.body}>
        {/* Right after a business signs up, this is its first screen: say
            plainly that the registration went through, and what's next. */}
        {s.justRegisteredBusiness && !verified && (
          <Notice tone="success" title={`¡Listo! Registramos ${s.justRegisteredBusiness}`} style={styles.welcome}>
            <Text style={styles.welcomeText}>
              Te mandamos un correo con los siguientes pasos:{'\n'}
              1. Verifica tu correo con el código de abajo.{'\n'}
              2. Completa tu página desde tu panel.{'\n'}
              3. Revisamos tu negocio y te avisamos por correo, con tu enlace y tu QR, cuando esté en línea.
            </Text>
          </Notice>
        )}
        <MailCheck size={40} strokeWidth={1.25} color={colors.text} />
        <Text style={styles.title}>Verifica tu correo</Text>
        {verified ? (
          <>
            <CardBody style={{ textAlign: 'center' }}>
              ¡Listo! Tu correo {s.email} quedó verificado.
            </CardBody>
            <Button variant="primary" block onPress={goToPanel}>
              Continuar
            </Button>
          </>
        ) : (
          <>
            <CardBody style={{ textAlign: 'center' }}>
              {sent
                ? `Enviamos un código de 6 dígitos a ${s.email}. Revisa tu bandeja (y spam) y escríbelo aquí.`
                : 'Enviando un código de verificación a tu correo…'}
            </CardBody>
            {error && <Notice tone="danger">{error}</Notice>}
            <TextField
              label="Código de 6 dígitos"
              value={code}
              onChangeText={setCode}
              placeholder="000000"
              keyboardType="numeric"
              maxLength={6}
            />
            <Button
              variant="primary"
              block
              disabled={verifying || code.trim().length !== 6}
              onPress={handleVerify}
            >
              {verifying ? 'Verificando…' : 'Verificar'}
            </Button>
            <Button variant="ghost" block disabled={sending} onPress={handleSend}>
              {sending ? 'Enviando…' : 'Reenviar código'}
            </Button>
            <Button variant="ghost" block onPress={goToPanel}>
              Omitir por ahora
            </Button>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s3, paddingHorizontal: space.s6 },
  title: { ...type.title },
  welcome: { alignSelf: 'stretch' },
  welcomeText: { ...type.small, color: colors.text, lineHeight: 21 },
});
