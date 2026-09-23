import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { Check } from 'lucide-react-native';
import VerificationCard from '../components/VerificationCard';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import AppNav from '../components/AppNav';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Card from '../components/Card';
import { CardBody, CardKicker, CardMeta } from '../components/CardText';
import Notice from '../components/Notice';
import Tag from '../components/Tag';
import { colors, fonts, radius, space, type } from '../theme/tokens';
import {
  api,
  BookingSummary,
  BookingWeekSummary,
  MEET_GREET_SERVICE_TYPE_CODE,
  MyProviderProfile,
  isBookable,
} from '../api/client';
import { listInSpanish, missingToPublish } from '../utils/pageStatus';
import { micrositeUrl } from '../utils/contactLinks';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const requestTimeLabel = (iso: string) =>
  new Date(iso).toLocaleString('es', { weekday: 'short', hour: 'numeric', minute: '2-digit' });

const money = (cents: number, currency: string) => '$' + (cents / 100).toFixed(2).replace(/\.00$/, '') + ' ' + currency;

/** The things a directory business's page needs to be worth landing on.
 * None of these gate publishing (see missingToPublish for what does) —
 * they're the difference between a page that exists and one that gets
 * someone to call. */
const PAGE_CHECKLIST: { label: string; done: (p: MyProviderProfile) => boolean }[] = [
  { label: 'Descripción de tu negocio', done: (p) => Boolean(p.bio) },
  { label: 'Fotos del negocio', done: (p) => p.photos.length > 0 },
  { label: 'Servicios que ofreces', done: (p) => Boolean(p.plansOffered) },
  { label: 'Dirección y horarios', done: (p) => Boolean(p.publicAddress || p.hours) },
  { label: 'WhatsApp de contacto', done: (p) => Boolean(p.whatsapp) },
];

export default function DashboardScreen({ navigation }: Props) {
  const s = useAppState();
  const [profile, setProfile] = useState<MyProviderProfile | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [requests, setRequests] = useState<BookingSummary[] | null>(null);
  const [upcoming, setUpcoming] = useState<BookingSummary[] | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [summary, setSummary] = useState<BookingWeekSummary | null>(null);

  // Only paseadores can be booked, so only paseadores have earnings, a
  // week of walks, requests or an agenda (see isBookable). Every other
  // category is a directory listing whose whole job is its page — for
  // them those four sections aren't empty, they're meaningless, and the
  // requests below aren't even fetched.
  const bookable = profile ? isBookable(profile.category) : false;

  const loadSummary = useCallback(() => {
    if (!s.token || !bookable) return;
    api.getBookingWeekSummary(s.token).then(setSummary).catch(() => {});
  }, [s.token, bookable]);

  useFocusEffect(loadSummary);

  // Refetches every time this screen regains focus (not just on mount) so
  // coming back from "Editar mi página" shows a just-changed photo
  // — the same real ProviderProfile.photoBase64 a shopper sees on this
  // paseador's public page, not the old disconnected mock avatar.
  useFocusEffect(
    useCallback(() => {
      if (!s.token) return;
      api
        .getMyProviderProfile(s.token)
        .then(setProfile)
        .catch(() => setProfile(null));
    }, [s.token]),
  );

  // Real booking requests addressed to this paseador — 'requested' is the
  // status a booking starts at and stays at until this screen's own
  // Aceptar/Rechazar (or the owner cancelling first) moves it on; see
  // BookingController's list()/accept()/reject() on the backend.
  useFocusEffect(
    useCallback(() => {
      if (!s.token || !bookable) return;
      api
        .listBookings(s.token, { activeContext: 'provider', status: 'requested' })
        .then(setRequests)
        .catch(() => setRequests([]));
    }, [s.token, bookable]),
  );

  // Once accepted, a request drops off "Solicitudes nuevas" — without this,
  // the paseador would lose their only way back into that booking's chat
  // (see ChatScreen) the moment they accepted it. Fetches without a status
  // filter (the list is small — recent bookings only) and keeps whatever
  // isn't still pending or already over, so this refetch below is the same
  // request confirming as much.
  const loadUpcoming = useCallback(() => {
    if (!s.token || !bookable) return;
    api
      .listBookings(s.token, { activeContext: 'provider' })
      .then((all) =>
        setUpcoming(
          all
            .filter((b) => b.status === 'confirmed' || b.status === 'in_progress')
            // Soonest first — the list arrives newest-scheduled first.
            .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
        ),
      )
      .catch(() => setUpcoming([]));
  }, [s.token, bookable]);

  useFocusEffect(loadUpcoming);

  const respond = async (bookingId: string, action: 'accept' | 'reject') => {
    if (!s.token) return;
    setActingOn(bookingId);
    try {
      if (action === 'accept') {
        await api.acceptBooking(s.token, bookingId);
        loadSummary(); // accepting adds this walk to "Esta semana" right away
        loadUpcoming();
      } else {
        await api.rejectBooking(s.token, bookingId);
      }
      setRequests((rs) => rs?.filter((r) => r.id !== bookingId) ?? rs);
    } catch {
      // Leave it in the list — the paseador can just try again.
    } finally {
      setActingOn(null);
    }
  };

  const businessName = profile?.businessName ?? s.name ?? s.email ?? 'tu negocio';
  const photo = profile?.photo ?? null;
  const url = profile?.slug ? micrositeUrl(profile.slug) : null;
  const approved = profile?.approvedAt != null;
  // Whether visitors can see the page is the backend's call.
  const published = profile?.isPubliclyVisible ?? false;
  const missing = profile ? missingToPublish(profile) : [];

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied (or missing outside a browser) —
      // the link is on screen right above this button either way.
    }
  };

  const timeTag = (iso: string, variant: 'warning' | 'success') => (
    <Tag variant={variant}>{requestTimeLabel(iso)}</Tag>
  );

  const bookingLine = (b: BookingSummary) => {
    const firstLine = b.lines[0];
    const isMeetGreet = b.lines.some((l) => l.serviceTypeCode === MEET_GREET_SERVICE_TYPE_CODE);
    return (
      (isMeetGreet
        ? 'Meet & Greet — sesión de conocernos (sin costo)'
        : firstLine
          ? `Paseo de ${firstLine.durationValue} min`
          : 'Paseo') + (b.ownerName ? ` · Dueño: ${b.ownerName}` : '')
    );
  };

  const messageButton = (b: BookingSummary, label: string) => (
    <Button
      size="sm"
      style={{ flex: 1 }}
      icon={b.hasUnreadMessages ? <View style={styles.messageDot} /> : undefined}
      onPress={() => navigation.navigate('Chat', { bookingId: b.id })}
    >
      {b.hasUnreadMessages ? 'Mensaje nuevo' : label}
    </Button>
  );

  return (
    <ScreenContainer>
      <AppNav
        items={[
          { label: 'Panel', onPress: () => navigation.navigate('Dashboard') },
          ...(bookable
            ? [{ label: 'Solicitudes', onPress: () => navigation.navigate('ComingSoon', { title: 'Solicitudes' }) }]
            : []),
          { label: 'Mi página', onPress: () => navigation.navigate('MyPage') },
          { label: 'Perfil', onPress: () => navigation.navigate('Profile') },
          ...(s.roles.includes('owner')
            ? [{
                label: 'Modo dueño',
                onPress: () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')),
              }]
            : []),
        ]}
        activeIndex={0}
      />
      <ScrollView contentContainerStyle={styles.body}>
        <Pressable style={styles.header} onPress={() => navigation.navigate('ProviderProfileEdit')}>
          <Avatar name={businessName} uri={photo} size={60} square />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={type.kicker}>Mi negocio</Text>
            <Text style={type.title}>{businessName}</Text>
          </View>
        </Pressable>

        {!s.emailVerified && (
          <Pressable onPress={() => navigation.navigate('VerifyEmail')}>
            <Notice tone="warning" title="Verifica tu correo">
              Dale más confianza a los dueños confirmando que tu correo es real. Toca para verificarlo.
            </Notice>
          </Pressable>
        )}

        {/* Shown to every provider, in both layouts: an account whose
            signup half-failed has no verification and no page, and this
            is the only way back from that. */}
        <VerificationCard
          onOpenConsent={() =>
            navigation.navigate('LegalDocument', { type: 'identity_verification_consent' })
          }
        />

        {profile === undefined && <Text style={type.small}>Cargando…</Text>}

        {profile === null && (
          <Card>
            <CardKicker>Tu página todavía no existe</CardKicker>
            <Text style={type.title}>Empecemos</Text>
            <CardBody>Crea la página de tu negocio para aparecer en el directorio.</CardBody>
            <Button variant="primary" block onPress={() => navigation.navigate('ProviderProfileEdit')}>
              Crear mi página
            </Button>
          </Card>
        )}

        {profile && !bookable && (
          <>
            <Card>
              <Tag variant={published ? 'success' : !approved ? 'warning' : 'neutral'}>
                {published
                  ? 'Tu página está en línea'
                  : !approved
                    ? 'Tu negocio está en revisión'
                    : 'Tu página todavía no es visible'}
              </Tag>
              <CardBody>
                {published
                  ? url ?? ''
                  : !approved
                    ? 'Prepara tu página mientras la revisamos. Te avisamos por correo, con tu enlace y tu QR, en cuanto esté en línea.'
                    : missing.length
                      ? `Falta ${listInSpanish(missing)}.`
                      : 'Completa tu página para publicarla.'}
              </CardBody>
              {published && url && (
                <View style={styles.actionsRow}>
                  <Button style={{ flex: 1 }} onPress={() => void copyLink()}>
                    {copied ? 'Copiado ✓' : 'Copiar enlace'}
                  </Button>
                  <Button variant="primary" style={{ flex: 1 }} onPress={() => void Linking.openURL(url)}>
                    Ver mi página
                  </Button>
                </View>
              )}
            </Card>

            <View style={styles.section}>
              <Text style={type.section}>Tu página</Text>
              <Card style={styles.checklist}>
                {PAGE_CHECKLIST.map((item, i) => {
                  const done = item.done(profile);
                  return (
                    <Pressable
                      key={item.label}
                      style={[styles.checkRow, i > 0 && styles.rowDivider]}
                      onPress={() => navigation.navigate('ProviderProfileEdit')}
                    >
                      <View style={[styles.checkDot, done && styles.checkDotDone]}>
                        {done && <Check size={12} strokeWidth={3} color={colors.onAccent} />}
                      </View>
                      <Text style={[styles.checkLabel, done && styles.checkLabelDone]}>{item.label}</Text>
                      {!done && <Text style={styles.checkAdd}>Agregar</Text>}
                    </Pressable>
                  );
                })}
              </Card>
              {!profile.whatsapp && (
                <Notice tone="warning">Sin un WhatsApp, quien llegue a tu página no tiene cómo contactarte.</Notice>
              )}
            </View>

            <Button block onPress={() => navigation.navigate('ProviderProfileEdit')}>
              Editar información de mi negocio
            </Button>

            {profile.isVip && (
              <Button variant="ghost" block onPress={() => navigation.navigate('MyPage')}>
                Personalizar el diseño de mi página
              </Button>
            )}
          </>
        )}

        {bookable && (
          <>
            <Button block onPress={() => navigation.navigate('ProviderProfileEdit')}>
              Editar mi página
            </Button>

            <Card>
              <CardKicker>Ingresos estimados esta semana</CardKicker>
              <Text style={styles.earnings}>
                {summary ? money(summary.earnings.amount, summary.earnings.currency) : '—'}
              </Text>
              <CardMeta>
                {summary
                  ? `${summary.completedThisWeek} paseo${summary.completedThisWeek === 1 ? '' : 's'} completado${summary.completedThisWeek === 1 ? '' : 's'} · según tu tarifa, te pagan directo`
                  : 'Cargando…'}
              </CardMeta>
              <View style={styles.weekRow}>
                {(summary?.days ?? []).map((wd, i) => {
                  const active = wd.count > 0;
                  return (
                    <View key={i} style={[styles.weekCell, active && styles.weekCellActive]}>
                      <Text style={[styles.weekLabel, active && styles.weekActiveText]}>{wd.label}</Text>
                      <Text style={[styles.weekCount, active && styles.weekActiveText]}>{wd.count}</Text>
                    </View>
                  );
                })}
              </View>
            </Card>

            <View style={styles.section}>
              <Text style={type.section}>Solicitudes nuevas</Text>
              {requests === null && <Text style={type.small}>Cargando…</Text>}
              {requests?.length === 0 && <Notice>No tienes solicitudes nuevas por ahora.</Notice>}
              {requests?.map((req) => {
                const petLabel = req.lines.map((l) => l.petName).filter(Boolean).join(', ') || 'Mascota';
                const isMeetGreet = req.lines.some((l) => l.serviceTypeCode === MEET_GREET_SERVICE_TYPE_CODE);
                const busy = actingOn === req.id;
                return (
                  <Card key={req.id}>
                    <View style={styles.rowBetween}>
                      <Text style={[type.cardTitle, { flex: 1 }]}>{petLabel}</Text>
                      {timeTag(req.scheduledAt, 'warning')}
                    </View>
                    <CardMeta>{bookingLine(req)}</CardMeta>
                    {isMeetGreet && messageButton(req, 'Enviar mensaje')}
                    <View style={styles.actionsRow}>
                      <Button
                        size="sm"
                        variant="danger"
                        style={{ flex: 1 }}
                        disabled={busy}
                        onPress={() => void respond(req.id, 'reject')}
                      >
                        Rechazar
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        style={{ flex: 1 }}
                        disabled={busy}
                        onPress={() => void respond(req.id, 'accept')}
                      >
                        Aceptar
                      </Button>
                    </View>
                  </Card>
                );
              })}
            </View>

            <View style={styles.section}>
              <Text style={type.section}>Próximos</Text>
              {upcoming === null && <Text style={type.small}>Cargando…</Text>}
              {upcoming?.length === 0 && <Notice>No tienes paseos confirmados todavía.</Notice>}
              {upcoming?.map((b) => {
                const petLabel = b.lines.map((l) => l.petName).filter(Boolean).join(', ') || 'Mascota';
                const isMeetGreet = b.lines.some((l) => l.serviceTypeCode === MEET_GREET_SERVICE_TYPE_CODE);
                return (
                  <Card key={b.id}>
                    <View style={styles.rowBetween}>
                      <Text style={[type.cardTitle, { flex: 1 }]}>{petLabel}</Text>
                      {timeTag(b.scheduledAt, 'success')}
                    </View>
                    <CardMeta>{bookingLine(b)}</CardMeta>
                    <View style={styles.actionsRow}>
                      {messageButton(b, 'Mensaje')}
                      {!isMeetGreet && (
                        <Button
                          size="sm"
                          variant="primary"
                          style={{ flex: 1 }}
                          onPress={() => navigation.navigate('Live', { bookingId: b.id })}
                        >
                          {b.status === 'in_progress' ? 'Continuar paseo' : 'Iniciar paseo'}
                        </Button>
                      )}
                    </View>
                  </Card>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.s4, paddingTop: space.s5, paddingBottom: space.s8, gap: space.s5 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.s4 },
  section: { gap: space.s3 },
  actionsRow: { flexDirection: 'row', gap: space.s2 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: space.s3 },
  earnings: { fontFamily: fonts.bodyBold, fontSize: 36, lineHeight: 42, color: colors.text },
  weekRow: { flexDirection: 'row', gap: space.s1, marginTop: space.s2 },
  weekCell: {
    flex: 1, alignItems: 'center', gap: 2, paddingVertical: space.s2,
    borderRadius: radius.sm, backgroundColor: colors.panel,
  },
  weekCellActive: { backgroundColor: colors.successTint },
  weekLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.textMuted },
  weekCount: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textMuted },
  weekActiveText: { color: colors.success },
  checklist: { paddingVertical: space.s1, gap: 0 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: space.s3, paddingVertical: space.s3 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  checkDot: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkDotDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14.5, color: colors.text },
  checkLabelDone: { color: colors.textMuted },
  checkAdd: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.accent },
  messageDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
});
