import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import TextField from '../components/TextField';
import Field from '../components/Field';
import Segmented from '../components/Segmented';
import PhotoPicker, { PhotoResult } from '../components/PhotoPicker';
import Card from '../components/Card';
import { CardBody } from '../components/CardText';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export default function SignupScreen({ navigation, route }: Props) {
  const s = useAppState();
  const [role, setRole] = useState<'owner' | 'provider'>(route.params?.role ?? 'owner');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [facePhoto, setFacePhoto] = useState<PhotoResult | null>(null);
  const [idPhoto, setIdPhoto] = useState<PhotoResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const missingProviderPhotos = role === 'provider' && (!facePhoto?.base64 || !idPhoto?.base64);
  const canSubmit = !!email && password.length >= 8 && !missingProviderPhotos;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await s.signup({
        email: email.trim(),
        password,
        role,
        name: name.trim() || undefined,
        facePhoto: facePhoto?.base64 ?? undefined,
        idDocumentPhoto: idPhoto?.base64 ?? undefined,
      });
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
        <Text style={styles.title}>Crear cuenta</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Field label="Tipo de cuenta">
          <Segmented
            options={[
              { label: 'Dueño', value: 'owner' },
              { label: 'Paseador', value: 'provider' },
            ]}
            value={role}
            onChange={(v) => setRole(v as 'owner' | 'provider')}
          />
        </Field>

        <TextField label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre" autoCapitalize="words" />
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
          placeholder="Mínimo 8 caracteres"
        />

        {role === 'provider' && (
          <View style={{ gap: space.s2 }}>
            <Text style={styles.note}>
              Como paseador necesitamos verificar tu identidad: una foto de tu cara y una foto de
              tu documento. La verificación automática llega más adelante — por ahora tu cuenta
              queda marcada como "pendiente" hasta que se revise.
            </Text>
            <View style={styles.photoRow}>
              <View style={{ flex: 1 }}>
                <Field label="Foto de tu cara">
                  <PhotoPicker
                    uri={facePhoto?.uri ?? null}
                    onChange={setFacePhoto}
                    style={styles.photoBox}
                    alertTitle="Foto de tu cara"
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Foto de tu documento">
                  <PhotoPicker
                    uri={idPhoto?.uri ?? null}
                    onChange={setIdPhoto}
                    style={styles.photoBox}
                    alertTitle="Foto de tu documento"
                  />
                </Field>
              </View>
            </View>
          </View>
        )}

        {s.authError && (
          <Card>
            <CardBody style={{ color: colors.accent }}>{s.authError}</CardBody>
          </Card>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button variant="primary" block blueprint disabled={submitting || !canSubmit} onPress={handleSubmit}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
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
  body: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s4 },
  note: { fontFamily: fonts.body, fontSize: 12, color: colors.text, opacity: 0.7 },
  photoRow: { flexDirection: 'row', gap: space.s3 },
  photoBox: { width: '100%', aspectRatio: 1 },
  footer: { padding: space.s4 },
});
