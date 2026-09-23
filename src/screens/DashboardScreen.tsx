import React, { useCallback, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { Check } from 'lucide-react-native';
import VerificationCard from '../components/VerificationCard';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import AppNav from '../components/AppNav';
import { vividColors as v, vividFonts as vf, vividRadius as vr, vividTintFor } from '../theme/vividTokens';
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
  const avatarTint = vividTintFor(businessName);
  const photo = profile?.photo ?? null;
  const url = profile?.slug ? micrositeUrl(profile.slug) : null;
  const approved = profile?.approvedAt != null;
  // Visitors see the page only once it's complete and approved.
  const published = (profile?.isPublished ?? false) && approved;
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

  return (
    <ScreenContainer>
      <View style={styles.root}>
        <AppNav
          items={[
            { label: 'Panel', onPress: () => navigation.navigate('Dashboard') },
            ...(bookable
              ? [{ label: 'Solicitudes', onPress: () => navigation.navigate('ComingSoon', { title: 'Solicitudes' }) }]
              : []),
            { label: 'Mi página', onPress: () => navigation.navigate('MyPage') },
            { label: 'Perfil', onPress: () => navigation.navigate('Profile') },
          ]}
          activeIndex={0}
        />
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable onPress={() => navigation.navigate('ProviderProfileEdit')}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.avatar} resizeMode="cover" />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: avatarTint.bg }]}>
                    <Text style={[styles.avatarPlaceholderText, { color: avatarTint.fg }]}>
                      {businessName[0].toUpperCase()}
                    </Text>
                  </View>
                )}
              </Pressable>
              <View>
                <Text style={styles.kicker}>Mi negocio</Text>
                <Text style={styles.title}>Hola, {businessName}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {s.roles.includes('owner') && (
                <Pressable
                  style={styles.pillBtn}
                  onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
                >
                  <Text style={styles.pillBtnText}>Modo dueño</Text>
                </Pressable>
              )}
              <Pressable style={styles.pillBtn} onPress={() => void s.logout()}>
                <Text style={styles.pillBtnText}>Salir</Text>
              </Pressable>
            </View>
          </View>

          {!s.emailVerified && (
            <Pressable style={styles.alertCard} onPress={() => navigation.navigate('VerifyEmail')}>
              <Text style={styles.alertTitle}>Verifica tu correo</Text>
              <Text style={styles.alertBody}>
                Dale más confianza a los dueños confirmando que tu correo es real. Toca para verificarlo.
              </Text>
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

          {profile === undefined && <Text style={styles.mutedBody}>Cargando…</Text>}

          {profile === null && (
            <>
              <View style={styles.pageCard}>
                <Text style={styles.earningsKicker}>Tu página todavía no existe</Text>
                <Text style={styles.pageCardTitle}>Empecemos</Text>
                <Text style={styles.earningsMeta}>
                  Crea la página de tu negocio para aparecer en el directorio.
                </Text>
              </View>
              <Pressable style={styles.outlineBtn} onPress={() => navigation.navigate('ProviderProfileEdit')}>
                <Text style={styles.outlineBtnText}>Crear mi página</Text>
              </Pressable>
            </>
          )}

          {profile && !bookable && (
            <>
              <View style={styles.pageCard}>
                <Text style={styles.earningsKicker}>
                  {published
                    ? 'Tu página está en línea'
                    : !approved
                      ? 'Tu negocio está en revisión'
                      : 'Tu página todavía no es visible'}
                </Text>
                <Text style={styles.pageCardTitle}>{businessName}</Text>
                <Text style={styles.earningsMeta}>
                  {published
                    ? url ?? ''
                    : !approved
                      ? 'Prepara tu página mientras la revisamos. Te avisamos por correo, con tu enlace y tu QR, en cuanto esté en línea.'
                      : missing.length
                        ? `Falta ${listInSpanish(missing)}.`
                        : 'Completa tu página para publicarla.'}
                </Text>
              </View>

              {published && url && (
                <View style={styles.actionsRow}>
                  <Pressable style={styles.halfBtn} onPress={() => void copyLink()}>
                    <Text style={styles.halfBtnText}>{copied ? 'Copiado ✓' : 'Copiar enlace'}</Text>
                  </Pressable>
                  <Pressable style={styles.halfBtnPrimary} onPress={() => void Linking.openURL(url)}>
                    <Text style={styles.halfBtnPrimaryText}>Ver mi página</Text>
                  </Pressable>
                </View>
              )}

              <View>
                <Text style={styles.sectionTitle}>Tu página</Text>
                <View style={{ gap: 10 }}>
                  {PAGE_CHECKLIST.map((item) => {
                    const done = item.done(profile);
                    return (
                      <Pressable
                        key={item.label}
                        style={styles.checkRow}
                        onPress={() => navigation.navigate('ProviderProfileEdit')}
                      >
                        <View style={[styles.checkDot, done && styles.checkDotDone]}>
                          {done && <Check size={12} strokeWidth={3} color="#fff" />}
                        </View>
                        <Text style={[styles.checkLabel, done && styles.checkLabelDone]}>{item.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {!profile.whatsapp && (
                  <Text style={styles.warnBody}>
                    Sin un WhatsApp, quien llegue a tu página no tiene cómo contactarte.
                  </Text>
                )}
              </View>

              <Pressable style={styles.outlineBtn} onPress={() => navigation.navigate('ProviderProfileEdit')}>
                <Text style={styles.outlineBtnText}>Editar información de mi negocio</Text>
              </Pressable>

              {profile.isVip && (
                <Pressable style={styles.ghostBtn} onPress={() => navigation.navigate('MyPage')}>
                  <Text style={styles.ghostBtnText}>Personalizar el diseño de mi página</Text>
                </Pressable>
              )}
            </>
          )}

          {bookable && (
            <>
              <Pressable style={styles.outlineBtn} onPress={() => navigation.navigate('ProviderProfileEdit')}>
                <Text style={styles.outlineBtnText}>Editar mi página</Text>
              </Pressable>

              <View style={styles.earningsCard}>
                <Text style={styles.earningsKicker}>Ingresos esta semana</Text>
                <Text style={styles.earnings}>
                  {summary ? money(summary.earnings.amount, summary.earnings.currency) : '—'}
                </Text>
                <Text style={styles.earningsMeta}>
                  {summary
                    ? `${summary.completedThisWeek} paseo${summary.completedThisWeek === 1 ? '' : 's'} completado${summary.completedThisWeek === 1 ? '' : 's'}`
                    : 'Cargando…'}
                </Text>
              </View>

              <View>
                <Text style={styles.sectionTitle}>Esta semana</Text>
                <View style={styles.weekRow}>
                  {(summary?.days ?? []).map((wd, i) => {
                    const active = wd.count > 0;
                    return (
                      <View key={i} style={[styles.weekCell, active && styles.weekCellActive]}>
                        <Text style={[styles.weekLabel, active && styles.weekLabelActive]}>{wd.label}</Text>
                        <Text style={[styles.weekCount, active && styles.weekCountActive]}>{wd.count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={{ gap: 12 }}>
                <Text style={styles.sectionTitle}>Solicitudes nuevas</Text>
                {requests === null && <Text style={styles.mutedBody}>Cargando…</Text>}
                {requests?.length === 0 && <Text style={styles.mutedBody}>No tienes solicitudes nuevas por ahora.</Text>}
                {requests?.map((req) => {
                  const petLabel = req.lines.map((l) => l.petName).filter(Boolean).join(', ') || 'Mascota';
                  const firstLine = req.lines[0];
                  const isMeetGreet = req.lines.some((l) => l.serviceTypeCode === MEET_GREET_SERVICE_TYPE_CODE);
                  const busy = actingOn === req.id;
                  return (
                    <View key={req.id} style={styles.requestCard}>
                      <View style={styles.requestAccent} />
                      <View style={styles.requestBody}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.requestPet}>{petLabel}</Text>
                          <View style={styles.timeTag}>
                            <Text style={styles.timeTagText}>{requestTimeLabel(req.scheduledAt)}</Text>
                          </View>
                        </View>
                        <Text style={styles.requestMeta}>
                          {isMeetGreet
                            ? 'Meet & Greet — sesión de conocernos (sin costo)'
                            : firstLine
                              ? `Paseo de ${firstLine.durationValue} min`
                              : 'Paseo'}
                          {req.ownerName ? ` · Dueño: ${req.ownerName}` : ''}
                        </Text>
                        {isMeetGreet && (
                          <Pressable
                            style={[styles.messageBtn, req.hasUnreadMessages && styles.messageBtnUnread]}
                            onPress={() => navigation.navigate('Chat', { bookingId: req.id })}
                          >
                            {req.hasUnreadMessages && <View style={styles.messageDot} />}
                            <Text style={[styles.messageBtnText, req.hasUnreadMessages && styles.messageBtnTextUnread]}>
                              {req.hasUnreadMessages ? 'Mensaje nuevo' : 'Enviar mensaje'}
                            </Text>
                          </Pressable>
                        )}
                        <View style={styles.requestActions}>
                          <Pressable
                            style={[styles.rejectBtn, busy && styles.btnDisabled]}
                            disabled={busy}
                            onPress={() => void respond(req.id, 'reject')}
                          >
                            <Text style={styles.rejectBtnText}>Rechazar</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.acceptBtn, busy && styles.btnDisabled]}
                            disabled={busy}
                            onPress={() => void respond(req.id, 'accept')}
                          >
                            <Text style={styles.acceptBtnText}>Aceptar</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={{ gap: 12 }}>
                <Text style={styles.sectionTitle}>Próximos</Text>
                {upcoming === null && <Text style={styles.mutedBody}>Cargando…</Text>}
                {upcoming?.length === 0 && <Text style={styles.mutedBody}>No tienes paseos confirmados todavía.</Text>}
                {upcoming?.map((b) => {
                  const petLabel = b.lines.map((l) => l.petName).filter(Boolean).join(', ') || 'Mascota';
                  const firstLine = b.lines[0];
                  const isMeetGreet = b.lines.some((l) => l.serviceTypeCode === MEET_GREET_SERVICE_TYPE_CODE);
                  return (
                    <View key={b.id} style={styles.requestCard}>
                      <View style={[styles.requestAccent, { backgroundColor: v.mint }]} />
                      <View style={styles.requestBody}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.requestPet}>{petLabel}</Text>
                          <View style={styles.timeTag}>
                            <Text style={styles.timeTagText}>{requestTimeLabel(b.scheduledAt)}</Text>
                          </View>
                        </View>
                        <Text style={styles.requestMeta}>
                          {isMeetGreet
                            ? 'Meet & Greet — sesión de conocernos (sin costo)'
                            : firstLine
                              ? `Paseo de ${firstLine.durationValue} min`
                              : 'Paseo'}
                          {b.ownerName ? ` · Dueño: ${b.ownerName}` : ''}
                        </Text>
                        <View style={styles.requestActions}>
                          <Pressable
                            style={[styles.messageBtn, { flex: 1 }, b.hasUnreadMessages && styles.messageBtnUnread]}
                            onPress={() => navigation.navigate('Chat', { bookingId: b.id })}
                          >
                            {b.hasUnreadMessages && <View style={styles.messageDot} />}
                            <Text style={[styles.messageBtnText, b.hasUnreadMessages && styles.messageBtnTextUnread]}>
                              {b.hasUnreadMessages ? 'Mensaje nuevo' : 'Mensaje'}
                            </Text>
                          </Pressable>
                          {!isMeetGreet && (
                            <Pressable
                              style={[styles.acceptBtn, { paddingVertical: 10 }]}
                              onPress={() => navigation.navigate('Live', { bookingId: b.id })}
                            >
                              <Text style={styles.acceptBtnText}>
                                {b.status === 'in_progress' ? 'Continuar paseo' : 'Iniciar paseo'}
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: v.bg },
  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: vr.pill },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: vr.pill, alignItems: 'center', justifyContent: 'center' },
  avatarPlaceholderText: { fontFamily: vf.display, fontSize: 20 },
  kicker: { fontFamily: vf.bodyBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: v.coral },
  title: { fontFamily: vf.display, fontSize: 19, color: v.ink, marginTop: 2 },
  pillBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: vr.pill, backgroundColor: v.surface, borderWidth: 1.5, borderColor: v.line },
  pillBtnText: { fontFamily: vf.bodyBold, fontSize: 12.5, color: v.ink },

  alertCard: { padding: 16, borderRadius: vr.md, backgroundColor: v.sunTint, borderWidth: 1.5, borderColor: v.sunTintLine, gap: 4 },
  alertTitle: { fontFamily: vf.bodyBold, fontSize: 14, color: v.ink },
  alertBody: { fontFamily: vf.body, fontSize: 12.5, color: v.mute, lineHeight: 17 },

  outlineBtn: { paddingVertical: 14, borderRadius: vr.md, borderWidth: 1.5, borderColor: v.grapeTintLine, backgroundColor: v.grapeTint, alignItems: 'center' },
  outlineBtnText: { fontFamily: vf.bodyBold, fontSize: 14, color: v.grape },

  earningsCard: { padding: 20, borderRadius: vr.lg, backgroundColor: v.coral, gap: 4 },
  earningsKicker: { fontFamily: vf.bodyBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: v.coralTint },
  earnings: { fontFamily: vf.display, fontSize: 40, color: '#fff', marginTop: 2 },
  earningsMeta: { fontFamily: vf.bodyMedium, fontSize: 12.5, color: v.coralTint },

  // The directory business's counterpart to earningsCard: same weight on
  // the screen, but it leads with the page and its link, which is the
  // only thing PawMates actually does for a non-paseador today.
  pageCard: { padding: 20, borderRadius: vr.lg, backgroundColor: v.coral, gap: 4 },
  pageCardTitle: { fontFamily: vf.display, fontSize: 26, color: '#fff', marginTop: 2 },

  actionsRow: { flexDirection: 'row', gap: 8 },
  halfBtn: { flex: 1, paddingVertical: 13, borderRadius: vr.md, borderWidth: 1.5, borderColor: v.line, backgroundColor: v.surface, alignItems: 'center' },
  halfBtnText: { fontFamily: vf.bodyBold, fontSize: 13.5, color: v.ink },
  halfBtnPrimary: { flex: 1, paddingVertical: 13, borderRadius: vr.md, backgroundColor: v.ink, alignItems: 'center' },
  halfBtnPrimaryText: { fontFamily: vf.bodyBold, fontSize: 13.5, color: '#fff' },

  ghostBtn: { paddingVertical: 12, alignItems: 'center' },
  ghostBtnText: { fontFamily: vf.bodyBold, fontSize: 13.5, color: v.grape },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkDot: { width: 20, height: 20, borderRadius: vr.pill, borderWidth: 1.5, borderColor: v.line, backgroundColor: v.surface, alignItems: 'center', justifyContent: 'center' },
  checkDotDone: { backgroundColor: v.mint, borderColor: v.mint },
  checkLabel: { flex: 1, fontFamily: vf.body, fontSize: 13.5, color: v.mute },
  checkLabelDone: { fontFamily: vf.bodyMedium, color: v.ink },
  warnBody: { marginTop: 10, fontFamily: vf.body, fontSize: 12.5, color: v.mute, lineHeight: 17 },

  sectionTitle: { fontFamily: vf.display, fontSize: 17, color: v.ink, marginBottom: 10 },
  weekRow: { flexDirection: 'row', gap: 8 },
  weekCell: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: vr.md, backgroundColor: v.surface, borderWidth: 1.5, borderColor: v.line, gap: 4 },
  weekCellActive: { backgroundColor: v.mintTint, borderColor: v.mintTintLine },
  weekLabel: { fontFamily: vf.bodyBold, fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase', color: v.muted2 },
  weekLabelActive: { color: '#00947C' },
  weekCount: { fontFamily: vf.display, fontSize: 18, color: v.mute },
  weekCountActive: { color: v.ink },

  mutedBody: { fontFamily: vf.body, fontSize: 13.5, color: v.mute },

  requestCard: { flexDirection: 'row', borderRadius: vr.lg, backgroundColor: v.surface, borderWidth: 1.5, borderColor: v.line, overflow: 'hidden' },
  requestAccent: { width: 6, backgroundColor: v.coral },
  requestBody: { flex: 1, padding: 16, gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  requestPet: { fontFamily: vf.bodyBold, fontSize: 15, color: v.ink },
  timeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: vr.pill, backgroundColor: v.sunTint },
  timeTagText: { fontFamily: vf.bodyBold, fontSize: 11, color: '#8A6400' },
  requestMeta: { fontFamily: vf.body, fontSize: 13, color: v.mute },
  messageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: vr.md, borderWidth: 1.5, borderColor: v.grapeTintLine, backgroundColor: v.grapeTint,
  },
  messageBtnText: { fontFamily: vf.bodyBold, fontSize: 12.5, color: v.grape },
  messageBtnUnread: { borderColor: v.coral, backgroundColor: v.coral },
  messageBtnTextUnread: { color: '#fff' },
  messageDot: { width: 7, height: 7, borderRadius: vr.pill, backgroundColor: '#fff' },
  requestActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  rejectBtn: { flex: 1, paddingVertical: 12, borderRadius: vr.md, borderWidth: 1.5, borderColor: v.line, backgroundColor: v.surface, alignItems: 'center' },
  rejectBtnText: { fontFamily: vf.bodyBold, fontSize: 13.5, color: v.ink },
  acceptBtn: { flex: 1, paddingVertical: 12, borderRadius: vr.md, backgroundColor: v.mint, alignItems: 'center' },
  acceptBtnText: { fontFamily: vf.bodyBold, fontSize: 13.5, color: '#fff' },
  btnDisabled: { opacity: 0.5 },
});
