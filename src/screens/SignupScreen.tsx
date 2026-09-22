import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import TextField from '../components/TextField';
import Field from '../components/Field';
import PhotoPicker, { PhotoResult } from '../components/PhotoPicker';
import Card from '../components/Card';
import Tag from '../components/Tag';
import { CardBody } from '../components/CardText';
import { colors, fonts, space } from '../theme/tokens';
import LegalAcceptRow, { LegalLink } from '../components/LegalAcceptRow';
import { CardMeta } from '../components/CardText';
import {
  AcceptedLegal,
  api,
  CATEGORY_LABELS_SINGULAR,
  LegalDocument,
  LegalDocumentType,
  SERVICE_CATEGORIES,
  ServiceCategory,
} from '../api/client';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export default function SignupScreen({ navigation, route }: Props) {
  const s = useAppState();
  const role: 'owner' | 'provider' = route.params?.role ?? 'owner';
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('walker');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [facePhoto, setFacePhoto] = useState<PhotoResult | null>(null);
  const [idPhoto, setIdPhoto] = useState<PhotoResult | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<PhotoResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The versions come from the backend so the acceptance record can name
  // the exact text that was on screen — see legal-document.ts. Until they
  // load there's nothing to accept, so the button stays disabled.
  const [documents, setDocuments] = useState<LegalDocument[] | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedVerification, setAcceptedVerification] = useState(false);

  useEffect(() => {
    api.getLegalDocuments().then(setDocuments).catch(() => setDocuments([]));
  }, []);

  const versionOf = (type: LegalDocumentType) =>
    documents?.find((d) => d.type === type)?.version;

  const generalDocuments: LegalDocumentType[] =
    role === 'provider'
      ? ['privacy_notice', 'provider_agreement']
      : ['privacy_notice', 'owner_terms'];

  const openDocument = (type: LegalDocumentType) =>
    navigation.navigate('LegalDocument', { type });

  const missingProviderPhotos = role === 'provider' && (!facePhoto?.base64 || !idPhoto?.base64);
  // A provider sending identity photos has to consent to those two
  // images separately — the law wants that one expressed on its own, not
  // folded into the general acceptance.
  const needsVerificationConsent = role === 'provider';
  const legalReady =
    !!documents &&
    documents.length > 0 &&
    acceptedTerms &&
    (!needsVerificationConsent || acceptedVerification) &&
    generalDocuments.every((t) => versionOf(t));
  const canSubmit =
    !!email && password.length >= 8 && !missingProviderPhotos && legalReady;

  const handleSubmit = async () => {
    const acceptedLegal: AcceptedLegal[] = generalDocuments
      .map((type) => ({ type, version: versionOf(type)! }))
      .filter((a) => a.version);
    if (needsVerificationConsent && acceptedVerification) {
      const version = versionOf('identity_verification_consent');
      if (version) acceptedLegal.push({ type: 'identity_verification_consent', version });
    }

    setSubmitting(true);
    try {
      await s.signup({
        email: email.trim(),
        password,
        role,
        name: name.trim() || undefined,
        category: role === 'provider' ? category : undefined,
        businessName: role === 'provider' ? businessName.trim() || undefined : undefined,
        facePhoto: facePhoto?.base64 ?? undefined,
        idDocumentPhoto: idPhoto?.base64 ?? undefined,
        profilePhoto: profilePhoto?.base64 ?? undefined,
        acceptedLegal,
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
          <Tag variant="accent">{role === 'provider' ? 'Negocio de mascotas' : 'Dueño de mascota'}</Tag>
        </Field>

        {role === 'provider' && (
          <>
            <Field label="¿Qué tipo de negocio tienes?">
              <View style={styles.categoryRow}>
                {SERVICE_CATEGORIES.map((c) => (
                  <Pressable key={c} onPress={() => setCategory(c)}>
                    <Tag variant={category === c ? 'accent' : 'outline'}>
                      {CATEGORY_LABELS_SINGULAR[c]}
                    </Tag>
                  </Pressable>
                ))}
              </View>
            </Field>
            <TextField
              label="Nombre del negocio"
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Ej. Veterinaria San Ángel"
              autoCapitalize="words"
            />
          </>
        )}

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
              Para registrar tu negocio necesitamos verificar tu identidad: una foto de tu cara y
              una foto de tu documento. La verificación automática llega más adelante — por ahora
              tu cuenta queda marcada como "pendiente" hasta que se revise.
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

            <View style={{ gap: space.s2 }}>
              <Text style={styles.note}>
                Esta otra foto es la que verán en tu página y en el directorio — puedes usar la
                misma de tu cara, el logo de tu negocio o cualquier otra, y cambiarla después.
              </Text>
              <View style={styles.photoRow}>
                <View style={{ flex: 1 }}>
                  <Field label="Foto de tu página">
                    <PhotoPicker
                      uri={profilePhoto?.uri ?? null}
                      onChange={setProfilePhoto}
                      style={styles.photoBox}
                      alertTitle="Foto de tu página"
                    />
                  </Field>
                </View>
                <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="secondary"
                    disabled={!facePhoto?.base64}
                    onPress={() => facePhoto && setProfilePhoto(facePhoto)}
                  >
                    Usar esta fotografía
                  </Button>
                </View>
              </View>
            </View>
          </View>
        )}

        <Card>
          <CardBody style={{ margin: 0 }}>Antes de crear tu cuenta</CardBody>
          <LegalAcceptRow checked={acceptedTerms} onToggle={() => setAcceptedTerms((v) => !v)}>
            He leído y acepto el{' '}
            <LegalLink onPress={() => openDocument('privacy_notice')}>
              Aviso de Privacidad
            </LegalLink>
            {' y '}
            {role === 'provider' ? (
              <LegalLink onPress={() => openDocument('provider_agreement')}>
                el Acuerdo de Prestadores de Servicios
              </LegalLink>
            ) : (
              <LegalLink onPress={() => openDocument('owner_terms')}>
                los Términos y Condiciones
              </LegalLink>
            )}
            .
          </LegalAcceptRow>

          {needsVerificationConsent && (
            <LegalAcceptRow
              checked={acceptedVerification}
              onToggle={() => setAcceptedVerification((v) => !v)}
            >
              Consiento expresamente que se traten mi fotografía y la de mi documento de
              identificación para verificar mi identidad, conforme al{' '}
              <LegalLink onPress={() => openDocument('identity_verification_consent')}>
                consentimiento de verificación
              </LegalLink>
              .
            </LegalAcceptRow>
          )}

          {documents?.length === 0 && (
            <CardMeta>
              No pudimos cargar los documentos legales. Revisa tu conexión e inténtalo de nuevo.
            </CardMeta>
          )}
        </Card>

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
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  photoBox: { width: '100%', aspectRatio: 1 },
  footer: { padding: space.s4 },
});
