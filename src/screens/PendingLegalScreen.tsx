import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { FileText } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import Card from '../components/Card';
import { CardBody, CardMeta } from '../components/CardText';
import LegalAcceptRow, { LegalLink } from '../components/LegalAcceptRow';
import { api, LegalDocument, LegalDocumentType } from '../api/client';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'PendingLegal'>;

const TITLES: Record<LegalDocumentType, string> = {
  privacy_notice: 'el Aviso de Privacidad',
  owner_terms: 'los Términos y Condiciones',
  provider_agreement: 'el Acuerdo de Prestadores de Servicios',
  identity_verification_consent: 'el consentimiento de verificación',
};

/**
 * Asks for an acceptance that is owed.
 *
 * Two kinds of account land here: ones created before the app asked for
 * anything, and ones whose documents changed version since they last
 * accepted. Both are the same problem — the terms govern the use of the
 * app, and someone using it without having accepted them is exactly what
 * the record exists to prevent — so this stands in front of everything
 * else rather than being a banner that can be ignored.
 *
 * "Salir" is always there: the way out of a document you don't accept is
 * to stop using the service, not to be trapped in a screen.
 */
export default function PendingLegalScreen({ navigation }: Props) {
  const s = useAppState();
  const [documents, setDocuments] = useState<LegalDocument[] | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getLegalDocuments().then(setDocuments).catch(() => setDocuments([]));
  }, []);

  const versionOf = (type: LegalDocumentType) =>
    documents?.find((d) => d.type === type)?.version;

  const pending = s.pendingLegal;
  const ready =
    accepted && documents !== null && pending.every((t) => versionOf(t));

  const submit = async () => {
    if (!s.token || !ready) return;
    setBusy(true);
    setError(null);
    try {
      for (const type of pending) {
        await api.acceptLegalDocument(s.token, type, versionOf(type)!);
      }
      await s.refreshPendingLegal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar tu aceptación.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.header}>
          <FileText size={26} strokeWidth={1.5} color={colors.accent} />
          <Text style={styles.title}>Antes de continuar</Text>
        </View>

        <Card>
          <CardBody style={{ margin: 0 }}>
            {pending.length > 1
              ? 'Necesitamos que aceptes estos documentos'
              : 'Necesitamos que aceptes este documento'}
          </CardBody>
          <CardMeta>
            Tu cuenta se creó antes de que te lo pidiéramos, o el texto cambió desde la última vez.
            Léelo con calma: se abre aquí mismo y puedes volver.
          </CardMeta>

          <View style={styles.list}>
            {pending.map((type) => (
              <View key={type} style={styles.item}>
                <Text style={styles.bullet}>•</Text>
                <LegalLink onPress={() => navigation.navigate('LegalDocument', { type })}>
                  {TITLES[type]}
                </LegalLink>
              </View>
            ))}
          </View>

          <LegalAcceptRow checked={accepted} onToggle={() => setAccepted((v) => !v)}>
            He leído y acepto {pending.map((t) => TITLES[t]).join(' y ')}.
          </LegalAcceptRow>

          {error && <CardMeta style={{ color: colors.accent }}>{error}</CardMeta>}

          <Button variant="primary" block blueprint disabled={busy || !ready} onPress={() => void submit()}>
            {busy ? 'Guardando…' : 'Aceptar y continuar'}
          </Button>
        </Card>

        <Button variant="ghost" block onPress={() => void s.logout()}>
          Salir
        </Button>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.s4, gap: space.s4, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', gap: space.s2 },
  title: { fontFamily: fonts.heading, fontSize: 24, color: colors.text },
  list: { gap: 6, paddingVertical: space.s1 },
  item: { flexDirection: 'row', gap: space.s2, alignItems: 'center' },
  bullet: { fontFamily: fonts.body, fontSize: 14, color: colors.accent },
});
