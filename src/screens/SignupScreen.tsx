import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import TextField from '../components/TextField';
import Field from '../components/Field';
import PhotoPicker, { PhotoResult } from '../components/PhotoPicker';
import Card from '../components/Card';
import Tag from '../components/Tag';
import { CardMeta, CardTitle } from '../components/CardText';
import { colors, fonts, space, type } from '../theme/tokens';
import LegalAcceptRow, { LegalLink } from '../components/LegalAcceptRow';
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
import ScreenHeader from '../components/ScreenHeader';
import Notice from '../components/Notice';
import BottomBar from '../components/BottomBar';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export default function SignupScreen({ navigation, route }: Props) {
  const s = useAppState();
  const role: 'owner' | 'provider' = route.params?.role ?? 'owner';
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('walker');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  // Shown only once they've started typing the second one, so the form
  // doesn't accuse them of a mismatch before they've had a chance.
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const passwordsReady = password.length >= 8 && password === confirmPassword;

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
  const canSubmit = !!email && passwordsReady && !missingProviderPhotos && legalReady;

  // A business signs up in three short steps instead of one long form:
  // what the business is, the account, then identity and documents. An
  // owner has only the account part, so theirs stays a single screen.
  const isProvider = role === 'provider';
  const [step, setStep] = useState(0);
  const emailLooksValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const stepReady = [
    businessName.trim().length > 0,
    emailLooksValid && passwordsReady,
    canSubmit,
  ];
  const lastStep = isProvider ? PROVIDER_STEPS.length - 1 : 0;
  const onLastStep = step === lastStep;
  const show = (which: number) => !isProvider || step === which;

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
        category: isProvider ? category : undefined,
        businessName: isProvider ? businessName.trim() || undefined : undefined,
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

  const goBack = () => (isProvider && step > 0 ? setStep(step - 1) : navigation.goBack());

  const legalCard = (
    <Card>
      <CardTitle>Antes de crear tu cuenta</CardTitle>
      <LegalAcceptRow checked={acceptedTerms} onToggle={() => setAcceptedTerms((v) => !v)}>
        He leído y acepto el{' '}
        <LegalLink onPress={() => openDocument('privacy_notice')}>Aviso de Privacidad</LegalLink>
        {' y '}
        {isProvider ? (
          <LegalLink onPress={() => openDocument('provider_agreement')}>
            el Acuerdo de Prestadores de Servicios
          </LegalLink>
        ) : (
          <LegalLink onPress={() => openDocument('owner_terms')}>los Términos y Condiciones</LegalLink>
        )}
        .
      </LegalAcceptRow>

      {needsVerificationConsent && (
        <LegalAcceptRow checked={acceptedVerification} onToggle={() => setAcceptedVerification((v) => !v)}>
          Consiento expresamente que se traten mi fotografía y la de mi documento de identificación
          para verificar mi identidad, conforme al{' '}
          <LegalLink onPress={() => openDocument('identity_verification_consent')}>
            consentimiento de verificación
          </LegalLink>
          .
        </LegalAcceptRow>
      )}

      {documents?.length === 0 && (
        <CardMeta>No pudimos cargar los documentos legales. Revisa tu conexión e inténtalo de nuevo.</CardMeta>
      )}
    </Card>
  );

  return (
    <ScreenContainer>
      <ScreenHeader
        onBack={goBack}
        kicker={isProvider ? `Paso ${step + 1} de ${PROVIDER_STEPS.length}` : undefined}
        title={isProvider ? PROVIDER_STEPS[step].title : 'Crea tu cuenta'}
        subtitle={isProvider ? PROVIDER_STEPS[step].subtitle : 'Para reservar y escribirles a los negocios.'}
      />
      {isProvider && (
        <View style={styles.progress} accessibilityElementsHidden>
          {PROVIDER_STEPS.map((st, i) => (
            <View key={st.title} style={[styles.progressBar, i <= step && styles.progressBarDone]} />
          ))}
        </View>
      )}
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {isProvider && show(0) && (
          <>
            <Field label="¿Qué tipo de negocio tienes?">
              <View style={styles.categoryRow}>
                {SERVICE_CATEGORIES.map((c) => (
                  <Tag key={c} variant={category === c ? 'accent' : 'outline'} onPress={() => setCategory(c)}>
                    {CATEGORY_LABELS_SINGULAR[c]}
                  </Tag>
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
            <Field label="Foto o logo para tu página (opcional)">
              <View style={styles.pagePhotoRow}>
                <PhotoPicker
                  uri={profilePhoto?.uri ?? null}
                  onChange={setProfilePhoto}
                  style={styles.pagePhoto}
                  label="Agregar"
                  alertTitle="Foto de tu página"
                />
                <Text style={[styles.note, { flex: 1 }]}>
                  Es lo que verán en tu página y en el directorio. Puedes cambiarla cuando quieras.
                </Text>
              </View>
            </Field>
          </>
        )}

        {show(1) && (
          <>
            <TextField
              label={isProvider ? 'Tu nombre' : 'Nombre'}
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              autoCapitalize="words"
            />
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
            <TextField
              label="Confirma la contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Escríbela otra vez"
            />
            {passwordsMismatch && <Text style={styles.mismatch}>Las contraseñas no coinciden.</Text>}
          </>
        )}

        {isProvider && show(2) && (
          <>
            <Text style={styles.note}>
              Una foto de tu cara y una de tu identificación. Las revisa una persona del equipo y
              después se borran: solo guardamos el resultado.
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
                <Field label="Foto de tu identificación">
                  <PhotoPicker
                    uri={idPhoto?.uri ?? null}
                    onChange={setIdPhoto}
                    style={styles.photoBox}
                    alertTitle="Foto de tu identificación"
                  />
                </Field>
              </View>
            </View>
            {facePhoto?.base64 && !profilePhoto && (
              <Button variant="ghost" onPress={() => setProfilePhoto(facePhoto)}>
                Usar también esta foto en mi página
              </Button>
            )}
          </>
        )}

        {onLastStep && legalCard}

        {s.authError && <Notice tone="danger">{s.authError}</Notice>}
      </ScrollView>
      <BottomBar>
        {onLastStep ? (
          <Button variant="primary" block disabled={submitting || !canSubmit} onPress={handleSubmit}>
            {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        ) : (
          <Button variant="primary" block disabled={!stepReady[step]} onPress={() => setStep(step + 1)}>
            Siguiente
          </Button>
        )}
      </BottomBar>
    </ScreenContainer>
  );
}

const PROVIDER_STEPS = [
  { title: 'Tu negocio', subtitle: 'Así aparecerás en el directorio.' },
  { title: 'Tu cuenta', subtitle: 'Con este correo y contraseña entrarás a tu panel.' },
  { title: 'Verifica tu identidad', subtitle: 'Para que los dueños sepan que eres quien dices ser.' },
];

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s6 },
  note: { ...type.small },
  mismatch: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger, marginTop: -space.s2 },
  progress: { flexDirection: 'row', gap: space.s1, paddingHorizontal: space.s4, paddingBottom: space.s4 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.panel },
  progressBarDone: { backgroundColor: colors.accent },
  photoRow: { flexDirection: 'row', gap: space.s3 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 },
  photoBox: { width: '100%', aspectRatio: 1 },
  pagePhotoRow: { flexDirection: 'row', alignItems: 'center', gap: space.s4 },
  pagePhoto: { width: 88, height: 88 },
});
