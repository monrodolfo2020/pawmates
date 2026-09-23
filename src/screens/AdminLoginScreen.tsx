import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { colors, space, type } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import Notice from '../components/Notice';

// Reached only via the /admin URL (see RootNavigator) — a single password
// field rather than the normal signup/login flow. The account behind it
// is a real one (email+password like any other), just with a fixed email
// nobody types: the password is the only thing that matters here.
const ADMIN_EMAIL = 'admin@pawmates.app';

export default function AdminLoginScreen() {
  const s = useAppState();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await s.login(ADMIN_EMAIL, password);
    } catch {
      // s.authError is already set for display below.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <ShieldCheck size={36} strokeWidth={1.25} color={colors.text} />
        <Text style={styles.title}>Acceso de administrador</Text>
        <TextField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          autoFocus
        />
        {s.authError && <Notice tone="danger">{s.authError}</Notice>}
        <Button variant="primary" block disabled={submitting || !password} onPress={handleSubmit}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  body: { width: '100%', maxWidth: 340, gap: space.s4, paddingHorizontal: space.s6 },
  title: { ...type.title, textAlign: 'center' },
});
