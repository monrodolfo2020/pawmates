import React, { useCallback, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import AppNav from '../components/AppNav';
import { vividColors as v, vividFonts as vf, vividRadius as vr, vividTintFor } from '../theme/vividTokens';
import { api, BookingSummary, BookingWeekSummary, MEET_GREET_SERVICE_TYPE_CODE } from '../api/client';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const requestTimeLabel = (iso: string) =>
  new Date(iso).toLocaleString('es', { weekday: 'short', hour: 'numeric', minute: '2-digit' });

const money = (cents: number, currency: string) => '$' + (cents / 100).toFixed(2).replace(/\.00$/, '') + ' ' + currency;

export default function DashboardScreen({ navigation }: Props) {
  const s = useAppState();
  const [photo, setPhoto] = useState<string | null>(null);
  const [requests, setRequests] = useState<BookingSummary[] | null>(null);
  const [upcoming, setUpcoming] = useState<BookingSummary[] | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [summary, setSummary] = useState<BookingWeekSummary | null>(null);

  const loadSummary = useCallback(() => {
    if (!s.token) return;
    api.getBookingWeekSummary(s.token).then(setSummary).catch(() => {});
  }, [s.token]);

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
        .then((profile) => setPhoto(profile?.photo ?? null))
        .catch(() => {});
    }, [s.token]),
  );

  // Real booking requests addressed to this paseador — 'requested' is the
  // status a booking starts at and stays at until this screen's own
  // Aceptar/Rechazar (or the owner cancelling first) moves it on; see
  // BookingController's list()/accept()/reject() on the backend.
  useFocusEffect(
    useCallback(() => {
      if (!s.token) return;
      api
        .listBookings(s.token, { activeContext: 'provider', status: 'requested' })
        .then(setRequests)
        .catch(() => setRequests([]));
    }, [s.token]),
  );

  // Once accepted, a request drops off "Solicitudes nuevas" — without this,
  // the paseador would lose their only way back into that booking's chat
  // (see ChatScreen) the moment they accepted it. Fetches without a status
  // filter (the list is small — recent bookings only) and keeps whatever
  // isn't still pending or already over, so this refetch below is the same
  // request confirming as much.
  const loadUpcoming = useCallback(() => {
    if (!s.token) return;
    api
      .listBookings(s.token, { activeContext: 'provider' })
      .then((all) => setUpcoming(all.filter((b) => b.status === 'confirmed' || b.status === 'in_progress')))
      .catch(() => setUpcoming([]));
  }, [s.token]);

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

  const avatarTint = vividTintFor(s.name ?? s.email ?? 'paseador');

  return (
    <ScreenContainer>
      <View style={styles.root}>
        <AppNav
          items={[
            { label: 'Panel', onPress: () => navigation.navigate('Dashboard') },
            { label: 'Solicitudes', onPress: () => navigation.navigate('ComingSoon', { title: 'Solicitudes' }) },
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
                      {(s.name ?? 'T')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
              </Pressable>
              <View>
                <Text style={styles.kicker}>Mi negocio</Text>
                <Text style={styles.title}>Hola, {s.name ?? s.email ?? 'paseador'}</Text>
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
                    {isMeetGreet && (
                      <Pressable
                        style={[styles.messageBtn, b.hasUnreadMessages && styles.messageBtnUnread]}
                        onPress={() => navigation.navigate('Chat', { bookingId: b.id })}
                      >
                        {b.hasUnreadMessages && <View style={styles.messageDot} />}
                        <Text style={[styles.messageBtnText, b.hasUnreadMessages && styles.messageBtnTextUnread]}>
                          {b.hasUnreadMessages ? 'Mensaje nuevo' : 'Enviar mensaje'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
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
