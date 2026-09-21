import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import Segmented from '../components/Segmented';
import Card from '../components/Card';
import { CardKicker, CardBody, CardMeta } from '../components/CardText';
import Tag from '../components/Tag';
import { api, AdminAccount, AdminBusiness, AdminVerification, CATEGORY_LABELS_SINGULAR } from '../api/client';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Admin'>;

const VERIFICATION_VARIANT: Record<string, 'accent' | 'outline'> = {
  pending: 'outline',
  verified: 'accent',
  rejected: 'outline',
};

type Section = 'cuentas' | 'negocios' | 'verificaciones';

export default function AdminScreen({ navigation }: Props) {
  const s = useAppState();
  const [section, setSection] = useState<Section>('cuentas');
  const [accounts, setAccounts] = useState<AdminAccount[] | null>(null);
  const [verifications, setVerifications] = useState<AdminVerification[] | null>(null);
  const [businesses, setBusinesses] = useState<AdminBusiness[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!s.token) return;
    Promise.all([
      api.adminListAccounts(s.token),
      api.adminListVerifications(s.token),
      api.adminListBusinesses(s.token),
    ])
      .then(([a, v, b]) => {
        setAccounts(a);
        setVerifications(v);
        setBusinesses(b);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el panel.'));
  };

  useEffect(load, [s.token]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>Panel de administrador</Text>
      </View>
      <View style={styles.segRow}>
        <Segmented
          options={[
            { label: 'Cuentas', value: 'cuentas' },
            { label: 'Negocios', value: 'negocios' },
            { label: 'Verificaciones', value: 'verificaciones' },
          ]}
          value={section}
          onChange={(v) => setSection(v as Section)}
        />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {error && (
          <Card>
            <CardBody style={{ color: colors.accent }}>{error}</CardBody>
          </Card>
        )}

        {section === 'cuentas' && (
          <View style={{ gap: space.s2 }}>
            <Text style={styles.h5}>Cuentas ({accounts?.length ?? '…'})</Text>
            {accounts?.map((a) => (
              <Card key={a.id}>
                <CardKicker style={{ margin: 0 }}>{a.email}</CardKicker>
                <CardBody>{a.name ?? 'Sin nombre'}</CardBody>
                <View style={styles.wrapRow}>
                  {a.roles.map((r) => (
                    <Tag key={r} variant="outline">{r}</Tag>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        )}

        {section === 'negocios' && (
          <View style={{ gap: space.s2 }}>
            <Text style={styles.h5}>Negocios ({businesses?.length ?? '…'})</Text>
            <CardMeta>
              El cobro del plan VIP todavía ocurre fuera de la app: aquí lo reflejas una vez que el
              negocio pagó. Quitar VIP no borra su diseño, solo deja de mostrarlo.
            </CardMeta>
            {businesses?.length === 0 && <CardMeta>No hay negocios registrados.</CardMeta>}
            {businesses?.map((b) => (
              <BusinessRow key={b.accountId} business={b} onChange={load} />
            ))}
          </View>
        )}

        {section === 'verificaciones' && (
          <View style={{ gap: space.s2 }}>
            <Text style={styles.h5}>Verificaciones de negocios</Text>
            {verifications?.length === 0 && <CardMeta>No hay verificaciones registradas.</CardMeta>}
            {verifications?.map((v) => (
              <VerificationRow key={v.id} verification={v} onChange={load} />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

/** One business with its plan, and the switch that turns VIP on or off
 * — the only way a business gets the design editor today (see the
 * backend's business-plan.ts). */
function BusinessRow({ business: b, onChange }: { business: AdminBusiness; onChange: () => void }) {
  const s = useAppState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vip = b.plan === 'vip';

  const setPlan = async () => {
    if (!s.token) return;
    setBusy(true);
    setError(null);
    try {
      await api.adminSetBusinessPlan(s.token, b.accountId, vip ? 'free' : 'vip');
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el plan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <View style={styles.row}>
        <CardKicker style={{ margin: 0 }}>{b.email ?? b.accountId.slice(0, 8)}</CardKicker>
        <Tag variant={vip ? 'accent' : 'outline'}>{vip ? 'VIP' : 'Gratis'}</Tag>
      </View>
      <CardBody>{b.name ?? 'Sin nombre'}</CardBody>
      <View style={styles.wrapRow}>
        <Tag variant="outline">{CATEGORY_LABELS_SINGULAR[b.category]}</Tag>
        <Tag variant={b.isPublished ? 'accent' : 'outline'}>
          {b.isPublished ? 'Publicada ✓' : 'Sin publicar'}
        </Tag>
        {b.slug && <Tag variant="outline">/s/{b.slug}</Tag>}
      </View>
      {error && <CardMeta style={{ color: colors.accent }}>{error}</CardMeta>}
      <Button variant={vip ? 'secondary' : 'primary'} blueprint={!vip} disabled={busy} onPress={() => void setPlan()}>
        {busy ? 'Guardando…' : vip ? 'Quitar VIP' : 'Activar VIP'}
      </Button>
    </Card>
  );
}

/** Shows both photos an admin needs to actually make the call, plus
 * Aprobar/Rechazar — the decision PATCH /v1/admin/provider-verifications/:id
 * turns into the "Identidad verificada" badge visitors see on that
 * business's page (see BusinessProfileScreen). */
function VerificationRow({ verification: v, onChange }: { verification: AdminVerification; onChange: () => void }) {
  const s = useAppState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decide = async (status: 'verified' | 'rejected') => {
    if (!s.token) return;
    setBusy(true);
    setError(null);
    try {
      await api.adminUpdateVerification(s.token, v.id, status);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la decisión.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <View style={styles.row}>
        <CardKicker style={{ margin: 0 }}>Cuenta {v.accountId.slice(0, 8)}…</CardKicker>
        <Tag variant={VERIFICATION_VARIANT[v.status] ?? 'outline'}>{v.status}</Tag>
      </View>
      <CardMeta>Enviada {new Date(v.createdAt).toLocaleString()}</CardMeta>
      <Tag variant={v.profilePublished ? 'accent' : 'outline'}>
        {v.profilePublished ? 'Página publicada ✓' : 'Página sin publicar todavía'}
      </Tag>
      <View style={styles.photoRow}>
        <View style={{ flex: 1, gap: 4 }}>
          <CardMeta>Rostro</CardMeta>
          <Image source={{ uri: v.facePhoto }} style={styles.verificationPhoto} resizeMode="cover" />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <CardMeta>Documento</CardMeta>
          <Image source={{ uri: v.idDocumentPhoto }} style={styles.verificationPhoto} resizeMode="cover" />
        </View>
      </View>
      {error && <CardMeta style={{ color: colors.accent }}>{error}</CardMeta>}
      <View style={{ flexDirection: 'row', gap: space.s2 }}>
        <Button
          variant="secondary"
          style={{ flex: 1 }}
          disabled={busy || v.status === 'rejected'}
          onPress={() => decide('rejected')}
        >
          Rechazar
        </Button>
        <Button
          variant="primary"
          blueprint
          style={{ flex: 1 }}
          disabled={busy || v.status === 'verified'}
          onPress={() => decide('verified')}
        >
          {busy ? 'Guardando…' : 'Aprobar'}
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
  },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  segRow: { paddingHorizontal: space.s4, paddingBottom: space.s2 },
  body: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s4 },
  h5: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  photoRow: { flexDirection: 'row', gap: space.s2 },
  verificationPhoto: { width: '100%', aspectRatio: 1, backgroundColor: colors.accent100 },
});
