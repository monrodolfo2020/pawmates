import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TextInput } from 'react-native';
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
import AdminAccountCard from '../components/AdminAccountCard';
import {
  api,
  AdminAccount,
  AdminBusiness,
  AdminVerification,
  BillingPeriod,
  CATEGORY_LABELS_SINGULAR,
  PERIOD_LABELS,
  PlanCode,
} from '../api/client';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Admin'>;

const VERIFICATION_VARIANT: Record<string, 'accent' | 'outline'> = {
  pending: 'outline',
  verified: 'accent',
  rejected: 'outline',
};

type Section = 'cuentas' | 'negocios' | 'codigos' | 'verificaciones';

export default function AdminScreen({ navigation }: Props) {
  const s = useAppState();
  const [section, setSection] = useState<Section>('cuentas');
  const [accounts, setAccounts] = useState<AdminAccount[] | null>(null);
  const [verifications, setVerifications] = useState<AdminVerification[] | null>(null);
  const [businesses, setBusinesses] = useState<AdminBusiness[] | null>(null);
  const [codes, setCodes] = useState<PlanCode[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Waiting-for-approval first: those are the ones that need the admin.
  const sortedBusinesses = [...(businesses ?? [])].sort(
    (a, b) => Number(a.approvedAt !== null) - Number(b.approvedAt !== null),
  );
  const pendingBusinesses = (businesses ?? []).filter((b) => b.approvedAt === null).length;

  const load = () => {
    if (!s.token) return;
    Promise.all([
      api.adminListAccounts(s.token),
      api.adminListVerifications(s.token),
      api.adminListBusinesses(s.token),
      api.adminListPlanCodes(s.token),
    ])
      .then(([a, v, b, c]) => {
        setAccounts(a);
        setVerifications(v);
        setBusinesses(b);
        setCodes(c);
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
            { label: 'Códigos', value: 'codigos' },
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
              <AdminAccountCard key={a.id} account={a} selfId={s.accountId} onChanged={load} />
            ))}
          </View>
        )}

        {section === 'negocios' && (
          <View style={{ gap: space.s2 }}>
            <Text style={styles.h5}>Negocios ({businesses?.length ?? '…'})</Text>
            {pendingBusinesses > 0 && (
              <Card style={styles.pendingBanner}>
                <CardBody style={{ margin: 0 }}>
                  {pendingBusinesses === 1
                    ? '1 negocio espera tu aprobación'
                    : `${pendingBusinesses} negocios esperan tu aprobación`}
                </CardBody>
                <CardMeta>
                  Ya pueden entrar y preparar su página, pero no aparecen en el directorio y su enlace
                  no abre hasta que los apruebes. Al aprobarlos les llega un correo con su enlace y su
                  código QR.
                </CardMeta>
              </Card>
            )}
            <CardMeta>
              Para un negocio que ya pagó, lo normal es generarle un código en la pestaña Códigos:
              queda registrado qué se vendió y por cuánto tiempo. Activar VIP desde aquí es una
              cortesía sin vencimiento. Quitarlo no borra su diseño, solo deja de mostrarlo.
            </CardMeta>
            {businesses?.length === 0 && <CardMeta>No hay negocios registrados.</CardMeta>}
            {sortedBusinesses.map((b) => (
              <BusinessRow key={b.accountId} business={b} onChange={load} />
            ))}
          </View>
        )}

        {section === 'codigos' && (
          <View style={{ gap: space.s2 }}>
            <Text style={styles.h5}>Códigos de activación</Text>
            <CardMeta>
              Mientras no haya pagos en línea, así se activa el VIP: el negocio paga por
              transferencia, tú generas un código por el periodo pagado y se lo pasas. El negocio lo
              escribe en su pantalla "Mi página" y el plan se activa solo.
            </CardMeta>
            <NewCodeForm onCreated={load} />
            {codes?.length === 0 && <CardMeta>Todavía no has generado códigos.</CardMeta>}
            {codes?.map((c) => (
              <Card key={c.code}>
                <View style={styles.row}>
                  <Text style={styles.codeText}>{c.code}</Text>
                  <Tag variant={c.isSpent ? 'outline' : 'accent'}>
                    {c.isSpent ? 'Usado' : 'Disponible'}
                  </Tag>
                </View>
                <CardMeta>
                  {PERIOD_LABELS[c.period]} · {c.usedCount}/{c.maxUses} usos ·{' '}
                  {new Date(c.createdAt).toLocaleDateString('es-MX')}
                </CardMeta>
                {c.note && <CardBody>{c.note}</CardBody>}
              </Card>
            ))}
          </View>
        )}

        {section === 'verificaciones' && (
          <View style={{ gap: space.s2 }}>
            <Text style={styles.h5}>Verificaciones de negocios</Text>
            <SecureLegacyPhotosCard />
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

/**
 * Runs the one-off cleanup that pulls the identity photos out of the
 * public blob store (see private-blob-storage.ts). It lives here rather
 * than in a script because it needs an admin session, and asking someone
 * to hand-craft a request with a token is how a security fix quietly
 * never gets applied.
 */
function SecureLegacyPhotosCard() {
  const s = useAppState();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    moved: number;
    skipped: number;
    failed: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!s.token) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await api.adminSecureLegacyPhotos(s.token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo ejecutar la limpieza.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardBody style={{ margin: 0 }}>Resguardar fotos de identificación antiguas</CardBody>
      <CardMeta>
        Las fotos de rostro y documento subidas antes del cambio a almacenamiento privado quedaron
        en direcciones públicas: no son adivinables, pero cualquiera con el enlace las abre. Esto las
        mueve a almacenamiento privado y borra la copia pública. Se puede ejecutar varias veces sin
        problema.
      </CardMeta>
      {result && (
        <CardMeta>
          {result.moved} movidas · {result.skipped} ya estaban resguardadas · {result.total} revisadas
          {result.failed.length > 0 ? ` · ${result.failed.length} fallaron` : ''}
        </CardMeta>
      )}
      {result && result.failed.length === 0 && result.moved + result.skipped === result.total && (
        <CardMeta style={{ color: colors.text }}>
          Listo: ninguna foto de identificación queda en una dirección pública.
        </CardMeta>
      )}
      {result && result.failed.length > 0 && (
        <CardMeta style={{ color: colors.accent }}>
          Vuelve a ejecutarlo: las que fallaron siguen siendo públicas.
        </CardMeta>
      )}
      {error && <CardMeta style={{ color: colors.accent }}>{error}</CardMeta>}
      <Button variant="secondary" disabled={busy} onPress={() => void run()}>
        {busy ? 'Resguardando…' : 'Ejecutar limpieza'}
      </Button>
    </Card>
  );
}

/** Generates one activation code. Kept deliberately small: period, and a
 * note so that a list of codes months from now still says who each one
 * was for. */
function NewCodeForm({ onCreated }: { onCreated: () => void }) {
  const s = useAppState();
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (!s.token) return;
    setBusy(true);
    setError(null);
    try {
      const code = await api.adminCreatePlanCode(s.token, {
        period,
        note: note.trim() || undefined,
      });
      setCreated(code.code);
      setNote('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el código.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardBody style={{ margin: 0 }}>Generar un código</CardBody>
      <Segmented
        options={[
          { label: 'Mensual', value: 'monthly' },
          { label: 'Anual', value: 'annual' },
        ]}
        value={period}
        onChange={(v) => setPeriod(v as BillingPeriod)}
      />
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Para quién es (ej. Spa Canino — transferencia 20 sep)"
        placeholderTextColor={colors.textMuted50}
        maxLength={120}
        style={styles.noteInput}
      />
      {error && <CardMeta style={{ color: colors.accent }}>{error}</CardMeta>}
      {created && (
        <View style={styles.createdBox}>
          <CardMeta>Pásale este código al negocio:</CardMeta>
          <Text style={styles.codeText} selectable>{created}</Text>
        </View>
      )}
      <Button variant="primary" blueprint disabled={busy} onPress={() => void create()}>
        {busy ? 'Generando…' : 'Generar código'}
      </Button>
    </Card>
  );
}

/** The two identity photos come as signed links that expire, so one can
 * legitimately be missing — an empty frame with an explanation beats a
 * broken image, and beats the whole list failing. */
function VerificationPhoto({ uri }: { uri: string | null }) {
  if (!uri) {
    return (
      <View style={[styles.verificationPhoto, styles.photoMissing]}>
        <Text style={styles.photoMissingText}>No disponible</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={styles.verificationPhoto} resizeMode="cover" />;
}

/** One business with its plan, and the switch that turns VIP on or off
 * — the only way a business gets the design editor today (see the
 * backend's business-plan.ts). */
function BusinessRow({ business: b, onChange }: { business: AdminBusiness; onChange: () => void }) {
  const s = useAppState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // `plan` stays 'vip' after a paid plan lapses, so the badge asks the
  // backend's effective answer and the button still offers to grant one.
  const vip = b.isVip;
  const lapsed = b.plan === 'vip' && !b.isVip;
  const approved = b.approvedAt !== null;
  const [emailNote, setEmailNote] = useState<string | null>(null);

  const setApproval = async (next: boolean) => {
    if (!s.token) return;
    setBusy(true);
    setError(null);
    setEmailNote(null);
    try {
      const result = await api.adminSetBusinessApproval(s.token, b.accountId, next);
      // The approval stands whether or not the email went out; this only
      // tells the admin whether they need to pass the link on themselves.
      if (result.email?.sent) {
        setEmailNote(`Le enviamos a ${b.email} su enlace y su código QR.`);
      } else if (result.email && !result.email.sent) {
        setEmailNote(
          `Quedó aprobado, pero el correo no salió: ${result.email.reason ?? 'error desconocido'} ` +
            'Pásale su enlace por otro medio.',
        );
      }
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la aprobación.');
    } finally {
      setBusy(false);
    }
  };

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
        <Tag variant={vip ? 'accent' : 'outline'}>
          {vip ? 'VIP' : lapsed ? 'VIP vencido' : 'Gratis'}
        </Tag>
      </View>
      <CardBody>{b.name ?? 'Sin nombre'}</CardBody>
      <View style={styles.wrapRow}>
        <Tag variant="outline">{CATEGORY_LABELS_SINGULAR[b.category]}</Tag>
        <Tag variant={approved ? 'accent' : 'outline'}>
          {approved ? 'Aprobado ✓' : 'Pendiente de aprobación'}
        </Tag>
        <Tag variant={b.isPublished ? 'accent' : 'outline'}>
          {b.isPublished ? 'Página completa' : 'Página incompleta'}
        </Tag>
        {b.slug && <Tag variant="outline">/s/{b.slug}</Tag>}
      </View>
      {!approved && !b.isPublished && (
        <CardMeta>
          Puedes aprobarlo ya: su página aparecerá en cuanto la complete, y el correo le dirá qué le
          falta.
        </CardMeta>
      )}
      {!approved && (
        <Button variant="primary" blueprint disabled={busy} onPress={() => void setApproval(true)}>
          {busy ? 'Aprobando…' : 'Aprobar y enviarle su enlace'}
        </Button>
      )}
      {emailNote && <CardMeta style={{ color: colors.text }}>{emailNote}</CardMeta>}
      {b.planExpiresAt && (
        <CardMeta>
          {vip ? 'Vence' : 'Venció'} el {new Date(b.planExpiresAt).toLocaleDateString('es-MX')}
        </CardMeta>
      )}
      {error && <CardMeta style={{ color: colors.accent }}>{error}</CardMeta>}
      {approved && (
        <View style={{ flexDirection: 'row', gap: space.s2 }}>
          <Button variant={vip ? 'secondary' : 'primary'} blueprint={!vip} style={{ flex: 1 }} disabled={busy} onPress={() => void setPlan()}>
            {busy ? 'Guardando…' : vip ? 'Quitar VIP' : 'Activar VIP'}
          </Button>
          <Button variant="ghost" style={{ flex: 1 }} disabled={busy} onPress={() => void setApproval(false)}>
            Retirar aprobación
          </Button>
        </View>
      )}
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
          <VerificationPhoto uri={v.facePhoto} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <CardMeta>Documento</CardMeta>
          <VerificationPhoto uri={v.idDocumentPhoto} />
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
  photoMissing: { alignItems: 'center', justifyContent: 'center', padding: space.s2 },
  photoMissingText: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted70, textAlign: 'center' },
  pendingBanner: { borderColor: colors.accent, backgroundColor: colors.accent100 },
  codeText: { fontFamily: fonts.heading, fontSize: 20, letterSpacing: 2, color: colors.text },
  noteInput: {
    paddingHorizontal: space.s3, paddingVertical: 10,
    borderWidth: 1.5, borderColor: colors.divider, borderRadius: 8,
    fontFamily: fonts.body, fontSize: 13.5, color: colors.text,
  },
  createdBox: { gap: 4, paddingVertical: space.s2 },
});
