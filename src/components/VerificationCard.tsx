import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from './Card';
import Button from './Button';
import { CardMeta, CardTitle } from './CardText';
import Tag from './Tag';
import PhotoPicker, { PhotoResult } from './PhotoPicker';
import LegalAcceptRow, { LegalLink } from './LegalAcceptRow';
import { api, MyVerification } from '../api/client';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import Notice from './Notice';

type Props = {
  /** Opens the consent text; the card only links to it, the screen owns
   * navigation. */
  onOpenConsent: () => void;
};

/**
 * Where a provider's identity verification stands, and the way to send
 * it.
 *
 * Verification used to happen only inside the signup request. A provider
 * whose signup half-failed ended up with an account and no verification,
 * with no way to fix it and nothing for an admin to approve — which is
 * how businesses went missing from the review queue. This is also just
 * the missing second chance: a blurry photo used to be permanent.
 */
export default function VerificationCard({ onOpenConsent }: Props) {
  const s = useAppState();
  const [state, setState] = useState<MyVerification | null>(null);
  const [facePhoto, setFacePhoto] = useState<PhotoResult | null>(null);
  const [idPhoto, setIdPhoto] = useState<PhotoResult | null>(null);
  const [consented, setConsented] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!s.token) return;
    api.getMyVerification(s.token).then(setState).catch(() => setState(null));
  }, [s.token]);

  useFocusEffect(load);

  const submit = async () => {
    if (!s.token || !state || !facePhoto?.base64 || !idPhoto?.base64) return;
    setBusy(true);
    setError(null);
    try {
      await api.submitVerification(s.token, {
        facePhoto: facePhoto.base64,
        idDocumentPhoto: idPhoto.base64,
        consentVersion: state.consentVersion,
      });
      setFacePhoto(null);
      setIdPhoto(null);
      setConsented(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar tu verificación.');
    } finally {
      setBusy(false);
    }
  };

  if (!state) return null;

  if (state.status === 'verified') {
    return (
      <Card>
        <View style={styles.row}>
          <ShieldCheck size={20} strokeWidth={1.75} color={colors.success} />
          <CardTitle style={{ flex: 1, color: colors.success }}>Identidad verificada</CardTitle>
        </View>
        <CardMeta>
          Tu página muestra la insignia de identidad verificada. Tus fotos de identificación ya
          fueron eliminadas: solo conservamos el resultado.
        </CardMeta>
      </Card>
    );
  }

  if (state.status === 'pending' && !state.photoFeedback) {
    return (
      <Card>
        <View style={styles.row}>
          <Clock size={20} strokeWidth={1.75} color={colors.warning} />
          <CardTitle style={{ flex: 1 }}>Identidad: fotos recibidas</CardTitle>
          <Tag variant="warning">Revisando</Tag>
        </View>
        {/* Deliberately says nothing about whether the page is live: that
            depends on the business being approved, which is a separate
            review with its own card, and saying "your page works as
            normal" here contradicted it. */}
        <CardMeta>
          Estamos revisando tus fotos de identificación. Cuando las aprobemos, tu página mostrará la
          insignia de identidad verificada.
        </CardMeta>
      </Card>
    );
  }

  const ready = Boolean(facePhoto?.base64 && idPhoto?.base64 && consented);
  const feedback = state.status === 'pending' ? state.photoFeedback : null;

  const form = (submitLabel: string) => (
    <>
      <View style={styles.photos}>
        <View style={styles.slot}>
          <Text style={styles.slotLabel}>Tu rostro</Text>
          <PhotoPicker
            uri={facePhoto?.uri ?? null}
            onChange={setFacePhoto}
            label="Rostro"
            alertTitle="Foto de tu rostro"
            style={styles.photo}
          />
        </View>
        <View style={styles.slot}>
          <Text style={styles.slotLabel}>Tu identificación</Text>
          <PhotoPicker
            uri={idPhoto?.uri ?? null}
            onChange={setIdPhoto}
            label="Documento"
            alertTitle="Foto de tu identificación"
            style={styles.photo}
          />
        </View>
      </View>

      <LegalAcceptRow checked={consented} onToggle={() => setConsented((v) => !v)}>
        Consiento expresamente que se traten mi fotografía y la de mi documento de identificación
        para verificar mi identidad, conforme al{' '}
        <LegalLink onPress={onOpenConsent}>consentimiento de verificación</LegalLink>.
      </LegalAcceptRow>

      {error && <Notice tone="danger">{error}</Notice>}

      <Button variant="secondary" disabled={busy || !ready} onPress={() => void submit()}>
        {busy ? 'Enviando…' : submitLabel}
      </Button>
    </>
  );

  // Pending, but the automatic comparison found a problem the business
  // can fix: say which, and offer the same form to send new photos. The
  // review still happens either way — a person looks at them.
  if (feedback) {
    return (
      <Card>
        <View style={styles.row}>
          <ShieldAlert size={20} strokeWidth={1.75} color={colors.warning} />
          <CardTitle style={{ flex: 1 }}>Revisa tus fotos</CardTitle>
          <Tag variant="warning">Revisando</Tag>
        </View>
        <Notice tone="warning">{FEEDBACK[feedback]}</Notice>
        {form('Enviar fotos nuevas')}
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.row}>
        <ShieldAlert
          size={20}
          strokeWidth={1.75}
          color={state.status === 'rejected' ? colors.danger : colors.textMuted}
        />
        <CardTitle style={{ flex: 1 }}>
          {state.status === 'rejected' ? 'Verificación rechazada' : 'Verifica tu identidad'}
        </CardTitle>
        <Tag variant={state.status === 'rejected' ? 'danger' : 'neutral'}>Opcional</Tag>
      </View>
      <CardMeta>
        {state.status === 'rejected'
          ? 'No pudimos confirmar tu identidad con las fotos anteriores. Puedes intentarlo de nuevo con fotos más claras.'
          : 'Es opcional, y le da confianza a quien vea tu página: muestra una insignia de identidad verificada. Tu página se publica igual sin ella.'}
      </CardMeta>

      {form(state.status === 'rejected' ? 'Enviar fotos nuevas' : 'Enviar para revisión')}
    </Card>
  );
}

const FEEDBACK: Record<NonNullable<MyVerification['photoFeedback']>, string> = {
  retake_selfie:
    'No logramos ver bien tu cara en la foto. Tómala de frente, con buena luz, sin lentes oscuros ni gorra, y envíala de nuevo.',
  retake_id:
    'No logramos ver la foto de tu identificación. Tómala completa, enfocada y sin reflejos, y envíala de nuevo.',
  mismatch:
    'Tu cara no parece coincidir con la foto de tu identificación. Si subiste una foto equivocada, envía otras. Si son correctas (por ejemplo, la credencial es de hace años), no hagas nada: una persona las va a revisar.',
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  photos: { flexDirection: 'row', gap: space.s3 },
  slot: { flex: 1, gap: 4 },
  slotLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.text },
  photo: { width: '100%', aspectRatio: 1 },
});
