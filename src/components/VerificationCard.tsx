import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from './Card';
import Button from './Button';
import { CardBody, CardMeta } from './CardText';
import Tag from './Tag';
import PhotoPicker, { PhotoResult } from './PhotoPicker';
import LegalAcceptRow, { LegalLink } from './LegalAcceptRow';
import { api, MyVerification } from '../api/client';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

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
          <ShieldCheck size={18} strokeWidth={1.5} color={colors.accent} />
          <CardBody style={{ margin: 0, flex: 1 }}>Identidad verificada</CardBody>
          <Tag variant="accent">Verificada ✓</Tag>
        </View>
        <CardMeta>
          Tu página muestra la insignia de identidad verificada. Tus fotos de identificación ya
          fueron eliminadas: solo conservamos el resultado.
        </CardMeta>
      </Card>
    );
  }

  if (state.status === 'pending') {
    return (
      <Card>
        <View style={styles.row}>
          <Clock size={18} strokeWidth={1.5} color={colors.accent} />
          <CardBody style={{ margin: 0, flex: 1 }}>Verificación en revisión</CardBody>
          <Tag variant="outline">En revisión</Tag>
        </View>
        <CardMeta>
          Recibimos tus fotos y una persona de nuestro equipo las está revisando. Tu página funciona
          con normalidad mientras tanto.
        </CardMeta>
      </Card>
    );
  }

  const ready = Boolean(facePhoto?.base64 && idPhoto?.base64 && consented);

  return (
    <Card>
      <View style={styles.row}>
        <ShieldAlert size={18} strokeWidth={1.5} color={colors.accent} />
        <CardBody style={{ margin: 0, flex: 1 }}>
          {state.status === 'rejected' ? 'Verificación rechazada' : 'Verifica tu identidad'}
        </CardBody>
      </View>
      <CardMeta>
        {state.status === 'rejected'
          ? 'No pudimos confirmar tu identidad con las fotos anteriores. Puedes intentarlo de nuevo con fotos más claras.'
          : 'Es opcional, y le da confianza a quien vea tu página: muestra una insignia de identidad verificada. Tu página se publica igual sin ella.'}
      </CardMeta>

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

      {error && <CardMeta style={{ color: colors.accent }}>{error}</CardMeta>}

      <Button variant="secondary" disabled={busy || !ready} onPress={() => void submit()}>
        {busy ? 'Enviando…' : 'Enviar para revisión'}
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  photos: { flexDirection: 'row', gap: space.s3 },
  slot: { flex: 1, gap: 4 },
  slotLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted70 },
  photo: { width: '100%', aspectRatio: 1 },
});
