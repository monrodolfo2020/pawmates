import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import TextField from '../components/TextField';
import Card from '../components/Card';
import { CardBody } from '../components/CardText';
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
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>Iniciar sesión</Text>
      </View>
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
        {s.authError && (
          <Card>
            <CardBody style={{ color: colors.accent }}>{s.authError}</CardBody>
          </Card>
        )}
      </View>
      <View style={styles.footer}>
        <Button
          variant="primary"
          block
          blueprint
          disabled={submitting || !email || !password}
          onPress={handleSubmit}
        >
          {submitting ? 'Entrando…' : 'Entrar'}
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
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  body: { paddingHorizontal: space.s4, gap: space.s4, flex: 1 },
  footer: { padding: space.s4 },
});
