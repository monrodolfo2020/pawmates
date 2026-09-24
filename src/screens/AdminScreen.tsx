import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import Segmented from '../components/Segmented';
import Card from '../components/Card';
import { CardBody, CardKicker, CardMeta, CardTitle } from '../components/CardText';
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
import { colors, fonts, radius, space, type } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import ScreenHeader from '../components/ScreenHeader';
import Notice from '../components/Notice';

type Props = NativeStackScreenProps<RootStackParamList, 'Admin'>;

const VERIFICATION_LABEL: Record<AdminVerification['status'], { text: string; variant: 'warning' | 'success' | 'danger' }> = {
  pending: { text: 'Por revisar', variant: 'warning' },
  verified: { text: 'Verificada ✓', variant: 'success' },
  rejected: { text: 'Rechazada', variant: 'danger' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

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
      <ScreenHeader onBack={() => navigation.goBack()} title="Panel de administrador" />
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
        {error && <Notice tone="danger">{error}</Notice>}

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
              <Notice
                tone="warning"
                title={
                  pendingBusinesses === 1
                    ? '1 negocio espera tu aprobación'
                    : `${pendingBusinesses} negocios esperan tu aprobación`
                }
              >
                Ya pueden entrar y preparar su página, pero no aparecen en el directorio y su enlace
                no abre hasta que los apruebes. Al aprobarlos les llega un correo con su enlace y su
                código QR.
              </Notice>
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
                  <Tag variant={c.isSpent ? 'neutral' : 'success'}>
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
            <FaceMatchConnectionCard />
            <SecureLegacyPhotosCard />
            {verifications?.length === 0 && <CardMeta>No hay verificaciones registradas.</CardMeta>}
            {/* The ones waiting on a decision first; the rest is history. */}
            {verifications &&
              [...verifications]
                .sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'))
                .map((v) => <VerificationRow key={v.id} verification={v} onChange={load} />)}
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
type ConnectionResult = Awaited<ReturnType<typeof api.adminTestFaceMatchConnection>>;

/**
 * Checks that the AWS keys set in Vercel work, with a generated image —
 * no business's photo — so the setup can be confirmed before the
 * comparison is switched on.
 */
function FaceMatchConnectionCard() {
  const s = useAppState();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ConnectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const test = async () => {
    if (!s.token) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await api.adminTestFaceMatchConnection(s.token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo hacer la prueba.');
    } finally {
      setBusy(false);
    }
  };

  const outcome: Record<ConnectionResult['connection'], { tone: 'success' | 'warning' | 'danger'; title: string; body: string }> = {
    ok: {
      tone: 'success',
      title: 'Conexión correcta',
      body: 'Las claves, el permiso y la región funcionan.',
    },
    missing_keys: {
      tone: 'warning',
      title: 'Faltan las claves',
      body: 'Agrega AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY en Vercel (proyecto del backend) y haz Redeploy.',
    },
    bad_keys: {
      tone: 'danger',
      title: 'Amazon no reconoce las claves',
      body: 'Revisa que AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY estén completas, sin espacios, y que la clave siga activa en IAM. Después haz Redeploy.',
    },
    no_permission: {
      tone: 'danger',
      title: 'Las claves no tienen permiso',
      body: 'En IAM, el usuario pawmates-rekognition necesita la política con rekognition:CompareFaces.',
    },
    unreachable: {
      tone: 'danger',
      title: 'No se pudo conectar con Amazon',
      body: 'Revisa AWS_REGION (por ejemplo us-east-2) e inténtalo de nuevo en unos minutos.',
    },
  };

  const shown = result && outcome[result.connection];

  return (
    <Card>
      <CardTitle>Comparación de rostros</CardTitle>
      <CardMeta>
        Prueba la conexión con Amazon Rekognition usando una imagen generada, sin ninguna foto de
        negocios.
      </CardMeta>
      {shown && (
        <Notice tone={shown.tone} title={shown.title}>
          {`${shown.body} Región: ${result.region}.${result.detail ? ` (${result.detail})` : ''} La comparación está ${
            result.enabled ? 'encendida' : 'apagada: se enciende con FACE_MATCH_ENABLED=true'
          }.`}
        </Notice>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
      <Button disabled={busy} onPress={() => void test()}>
        {busy ? 'Probando…' : 'Probar conexión con AWS'}
      </Button>
    </Card>
  );
}

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
      <CardTitle>Resguardar fotos de identificación antiguas</CardTitle>
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
        <Notice tone="danger">
          Vuelve a ejecutarlo: las que fallaron siguen siendo públicas.
        </Notice>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
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
      <CardTitle>Generar un código</CardTitle>
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
        placeholderTextColor={colors.textMuted}
        maxLength={120}
        style={styles.noteInput}
      />
      {error && <Notice tone="danger">{error}</Notice>}
      {created && (
        <View style={styles.createdBox}>
          <CardMeta>Pásale este código al negocio:</CardMeta>
          <Text style={styles.codeText} selectable>{created}</Text>
        </View>
      )}
      <Button variant="primary" disabled={busy} onPress={() => void create()}>
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
        <Tag variant={vip ? 'success' : 'neutral'}>
          {vip ? 'VIP' : lapsed ? 'VIP vencido' : 'Gratis'}
        </Tag>
      </View>
      <CardBody>{b.name ?? 'Sin nombre'}</CardBody>
      <View style={styles.wrapRow}>
        <Tag>{CATEGORY_LABELS_SINGULAR[b.category]}</Tag>
        <Tag variant={approved ? 'success' : 'warning'}>
          {approved ? 'Aprobado ✓' : 'Pendiente de aprobación'}
        </Tag>
        <Tag variant={b.isPublished ? 'success' : 'neutral'}>
          {b.isPublished ? 'Página completa' : 'Página incompleta'}
        </Tag>
        {b.slug && <Tag>/s/{b.slug}</Tag>}
        {b.isPubliclyVisible && <Tag variant="success">Visible en el directorio</Tag>}
      </View>
      {approved && b.isPublished && !b.isPubliclyVisible && (
        <CardMeta>
          No aparece en el directorio porque su cuenta está suspendida (pestaña Cuentas).
        </CardMeta>
      )}
      {!approved && !b.isPublished && (
        <CardMeta>
          Puedes aprobarlo ya: su página aparecerá en cuanto la complete, y el correo le dirá qué le
          falta.
        </CardMeta>
      )}
      {!approved && (
        <Button variant="primary" disabled={busy} onPress={() => void setApproval(true)}>
          {busy ? 'Aprobando…' : 'Aprobar y enviarle su enlace'}
        </Button>
      )}
      {emailNote && <CardMeta style={{ color: colors.text }}>{emailNote}</CardMeta>}
      {b.planExpiresAt && (
        <CardMeta>
          {vip ? 'Vence' : 'Venció'} el {new Date(b.planExpiresAt).toLocaleDateString('es-MX')}
        </CardMeta>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
      {approved && (
        <View style={{ flexDirection: 'row', gap: space.s2 }}>
          <Button variant={vip ? 'secondary' : 'primary'} style={{ flex: 1 }} disabled={busy} onPress={() => void setPlan()}>
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

/**
 * One identity check. While pending: both photos and Aprobar/Rechazar —
 * the decision PATCH /v1/admin/provider-verifications/:id turns into the
 * "Identidad verificada" badge on the business's page. Deciding destroys
 * the photos, so a resolved check shows the outcome and its date instead
 * of two empty frames; a verified one can still be withdrawn.
 */
/**
 * What the automatic face comparison said, in words an admin can act on.
 * The thresholds are deliberately cautious: it's a hint for where to
 * look harder, and the admin still decides by looking at both photos.
 */
function FaceMatchResult({ verification: v, onChange }: { verification: AdminVerification; onChange: () => void }) {
  const s = useAppState();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!s.token) return;
    setRunning(true);
    setError(null);
    try {
      await api.adminRunFaceMatch(s.token, v.id);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo comparar.');
    } finally {
      setRunning(false);
    }
  };

  const retry = v.faceMatchAvailable && (
    <Button size="sm" disabled={running} onPress={() => void run()}>
      {running ? 'Comparando…' : v.faceMatch ? 'Comparar otra vez' : 'Comparar rostros'}
    </Button>
  );

  const m = v.faceMatch;
  if (!m && v.faceMatchNeedsNewConsent) {
    return (
      <CardMeta>
        Estas fotos se enviaron antes de que el consentimiento incluyera la comparación automática, así
        que no se comparan. Revísalas tú, o pídele al negocio que las envíe de nuevo.
      </CardMeta>
    );
  }
  if (!m) {
    return retry ? (
      <View style={{ gap: space.s2 }}>
        <CardMeta>Estas fotos no se han comparado automáticamente.</CardMeta>
        {retry}
        {error && <Notice tone="danger">{error}</Notice>}
      </View>
    ) : null;
  }

  const shown =
    m.status === 'compared' && m.similarity !== null
      ? m.similarity >= 90
        ? { tone: 'success' as const, title: `Los rostros coinciden (${m.similarity}%)` }
        : m.similarity >= 70
          ? { tone: 'warning' as const, title: `Parecido de ${m.similarity}%: revisa con cuidado` }
          : { tone: 'danger' as const, title: `Parecido de ${m.similarity}%: no parecen la misma persona` }
      : m.status === 'no_face_selfie'
        ? { tone: 'warning' as const, title: 'No se encontró un rostro en la foto de la cara' }
        : m.status === 'no_face_id'
          ? { tone: 'warning' as const, title: 'No se encontró un rostro en la identificación' }
          : { tone: 'info' as const, title: 'No se pudo hacer la comparación automática' };

  return (
    <View style={{ gap: space.s2 }}>
      <Notice tone={shown.tone} title={shown.title}>
        Es una ayuda, no la decisión: una identificación borrosa o con reflejo puede dar un parecido bajo
        aunque sea la misma persona, y una foto impresa de otra persona puede dar uno alto.
      </Notice>
      {(m.status !== 'compared' || (m.similarity ?? 0) < 90) && retry}
      {error && <Notice tone="danger">{error}</Notice>}
    </View>
  );
}

function VerificationRow({ verification: v, onChange }: { verification: AdminVerification; onChange: () => void }) {
  const s = useAppState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

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

  const label = VERIFICATION_LABEL[v.status];
  const who = v.businessName ?? v.accountName ?? v.email ?? `Cuenta ${v.accountId.slice(0, 8)}…`;
  const pending = v.status === 'pending';

  return (
    <Card>
      <View style={styles.row}>
        <CardTitle style={{ flex: 1 }}>{who}</CardTitle>
        <Tag variant={label.variant}>{label.text}</Tag>
      </View>
      {v.email && v.email !== who && <CardMeta>{v.email}</CardMeta>}
      <CardMeta>
        Enviada el {formatDate(v.createdAt)}
        {!pending && v.photosDeletedAt ? ` · resuelta el ${formatDate(v.photosDeletedAt)}` : ''}
      </CardMeta>
      <Tag variant={v.profilePublished ? 'success' : 'neutral'}>
        {v.profilePublished ? 'Página completa ✓' : 'Página sin completar todavía'}
      </Tag>

      {pending ? (
        <>
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
          <FaceMatchResult verification={v} onChange={onChange} />
          <CardMeta>Al decidir, las dos fotos se borran definitivamente.</CardMeta>
          {error && <Notice tone="danger">{error}</Notice>}
          <View style={{ flexDirection: 'row', gap: space.s2 }}>
            <Button variant="danger" style={{ flex: 1 }} disabled={busy} onPress={() => void decide('rejected')}>
              Rechazar
            </Button>
            <Button variant="primary" style={{ flex: 1 }} disabled={busy} onPress={() => void decide('verified')}>
              {busy ? 'Guardando…' : 'Aprobar'}
            </Button>
          </View>
        </>
      ) : (
        <>
          {v.faceMatch?.status === 'compared' && (
            <CardMeta>Comparación automática al revisarla: {v.faceMatch.similarity}% de parecido.</CardMeta>
          )}
          <CardMeta>
            {v.status === 'verified'
              ? 'Su página muestra "Identidad verificada". Las fotos ya se borraron.'
              : 'Las fotos ya se borraron. El negocio puede enviar unas nuevas desde su panel; aparecerán aquí como una revisión nueva.'}
          </CardMeta>
          {error && <Notice tone="danger">{error}</Notice>}
          {v.status === 'verified' &&
            (confirmWithdraw ? (
              <View style={{ flexDirection: 'row', gap: space.s2 }}>
                <Button variant="secondary" style={{ flex: 1 }} disabled={busy} onPress={() => setConfirmWithdraw(false)}>
                  No
                </Button>
                <Button variant="primary" style={{ flex: 1 }} disabled={busy} onPress={() => void decide('rejected')}>
                  {busy ? 'Guardando…' : 'Sí, retirarla'}
                </Button>
              </View>
            ) : (
              <Button variant="secondary" block onPress={() => setConfirmWithdraw(true)}>
                Retirar la verificación
              </Button>
            ))}
          {confirmWithdraw && (
            <CardMeta>
              Su página dejará de mostrar "Identidad verificada". Para recuperarla tendrá que enviar
              fotos nuevas.
            </CardMeta>
          )}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  segRow: { paddingHorizontal: space.s4, paddingBottom: space.s3 },
  body: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s8 },
  h5: { ...type.section },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 + 2 },
  photoRow: { flexDirection: 'row', gap: space.s2 },
  verificationPhoto: { width: '100%', aspectRatio: 1, backgroundColor: colors.panel, borderRadius: radius.md },
  photoMissing: { alignItems: 'center', justifyContent: 'center', padding: space.s2 },
  photoMissingText: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted, textAlign: 'center' },
  codeText: { fontFamily: fonts.bodyBold, fontSize: 20, letterSpacing: 2, color: colors.text },
  noteInput: {
    minHeight: 44, paddingHorizontal: space.s3, paddingVertical: space.s2,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface,
    fontFamily: fonts.body, fontSize: 15, color: colors.text,
  },
  createdBox: { gap: 4, paddingVertical: space.s2 },
});
