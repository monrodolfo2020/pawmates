import React, { useCallback, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import BottomTabBar from '../components/BottomTabBar';
import { commerceColors as c, commerceFonts as f, commerceRadius as r } from '../theme/commerceTokens';
import { api, BookingSummary, BookingWeekSummary } from '../api/client';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const requestTimeLabel = (iso: string) =>
  new Date(iso).toLocaleString('es', { weekday: 'short', hour: 'numeric', minute: '2-digit' });

const money = (cents: number, currency: string) => '$' + (cents / 100).toFixed(2).replace(/\.00$/, '') + ' ' + currency;

export default function DashboardScreen({ navigation }: Props) {
  const s = useAppState();
  const [photo, setPhoto] = useState<string | null>(null);
  const [requests, setRequests] = useState<BookingSummary[] | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [summary, setSummary] = useState<BookingWeekSummary | null>(null);

  const loadSummary = useCallback(() => {
    if (!s.token) return;
    api.getBookingWeekSummary(s.token).then(setSummary).catch(() => {});
  }, [s.token]);

  useFocusEffect(loadSummary);

  // Refetches every time this screen regains focus (not just on mount) so
  // coming back from "Editar mi página pública" shows a just-changed photo
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

  const respond = async (bookingId: string, action: 'accept' | 'reject') => {
    if (!s.token) return;
    setActingOn(bookingId);
    try {
      if (action === 'accept') {
        await api.acceptBooking(s.token, bookingId);
        loadSummary(); // accepting adds this walk to "Esta semana" right away
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

  return (
    <ScreenContainer>
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable onPress={() => navigation.navigate('ProviderProfileEdit')}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.avatar} resizeMode="cover" />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>{(s.name ?? 'T')[0].toUpperCase()}</Text>
                  </View>
                )}
              </Pressable>
              <View>
                <Text style={styles.kicker}>Modo paseador</Text>
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
            <Text style={styles.outlineBtnText}>Editar mi página pública</Text>
          </Pressable>

          <View style={styles.earningsCard}>
            <Text style={styles.kicker}>Ingresos esta semana</Text>
            <Text style={styles.earnings}>
              {summary ? money(summary.earnings.amount, summary.earnings.currency) : '—'}
            </Text>
            <Text style={styles.mutedSmall}>
              {summary
                ? `${summary.completedThisWeek} paseo${summary.completedThisWeek === 1 ? '' : 's'} completado${summary.completedThisWeek === 1 ? '' : 's'}`
                : 'Cargando…'}
            </Text>
          </View>

          <View>
            <Text style={styles.sectionTitle}>Esta semana</Text>
            <View style={styles.weekRow}>
              {(summary?.days ?? []).map((wd, i) => (
                <View key={i} style={styles.weekCell}>
                  <Text style={styles.weekLabel}>{wd.label}</Text>
                  <Text style={styles.weekCount}>{wd.count}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <Text style={styles.sectionTitle}>Solicitudes nuevas</Text>
            {requests === null && <Text style={styles.mutedBody}>Cargando…</Text>}
            {requests?.length === 0 && <Text style={styles.mutedBody}>No tienes solicitudes nuevas por ahora.</Text>}
            {requests?.map((req) => {
              const petLabel = req.lines.map((l) => l.petName).filter(Boolean).join(', ') || 'Mascota';
              const firstLine = req.lines[0];
              const busy = actingOn === req.id;
              return (
                <View key={req.id} style={styles.requestCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.requestPet}>{petLabel}</Text>
                    <View style={styles.timeTag}>
                      <Text style={styles.timeTagText}>{requestTimeLabel(req.scheduledAt)}</Text>
                    </View>
                  </View>
                  <Text style={styles.requestMeta}>
                    {firstLine ? `Paseo de ${firstLine.durationValue} min` : 'Paseo'}
                    {req.ownerName ? ` · Dueño: ${req.ownerName}` : ''}
                  </Text>
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
              );
            })}
          </View>
        </ScrollView>

        <BottomTabBar
          items={[
            { label: 'Panel', onPress: () => navigation.navigate('Dashboard') },
            { label: 'Solicitudes', onPress: () => navigation.navigate('ComingSoon', { title: 'Solicitudes' }) },
            { label: 'Tienda', onPress: () => navigation.navigate('Stores') },
            { label: 'Perfil', onPress: () => navigation.navigate('Profile') },
          ]}
          activeIndex={0}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: r.pill },
  avatarPlaceholder: {
    width: 48, height: 48, borderRadius: r.pill, backgroundColor: c.tintGreen,
    borderWidth: 1, borderColor: c.tintGreenLine, alignItems: 'center', justifyContent: 'center',
  },
  avatarPlaceholderText: { fontFamily: f.serif, fontSize: 20, color: c.moss },
  kicker: { fontFamily: f.bodySemiBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: c.muted2 },
  title: { fontFamily: f.serif, fontSize: 22, color: c.ink, marginTop: 2 },
  pillBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: r.pill,
    borderWidth: 1, borderColor: c.line, backgroundColor: c.surface,
  },
  pillBtnText: { fontFamily: f.bodySemiBold, fontSize: 12.5, color: c.ink },

  alertCard: { padding: 16, borderRadius: r.md, backgroundColor: c.tintGreen, borderWidth: 1, borderColor: c.tintGreenLine, gap: 4 },
  alertTitle: { fontFamily: f.bodySemiBold, fontSize: 14, color: c.ink },
  alertBody: { fontFamily: f.body, fontSize: 12.5, color: c.mute, lineHeight: 17 },

  outlineBtn: { paddingVertical: 14, borderRadius: r.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, alignItems: 'center' },
  outlineBtnText: { fontFamily: f.bodySemiBold, fontSize: 14, color: c.ink },

  earningsCard: { padding: 18, borderRadius: r.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, gap: 4 },
  earnings: { fontFamily: f.serif, fontSize: 38, color: c.ink, marginTop: 2 },
  mutedSmall: { fontFamily: f.body, fontSize: 12, color: c.muted2 },

  sectionTitle: { fontFamily: f.serif, fontSize: 21, color: c.ink, marginBottom: 10 },
  weekRow: { flexDirection: 'row', gap: 8 },
  weekCell: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: r.md,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, gap: 4,
  },
  weekLabel: { fontFamily: f.bodySemiBold, fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase', color: c.muted2 },
  weekCount: { fontFamily: f.serif, fontSize: 18, color: c.ink },

  mutedBody: { fontFamily: f.body, fontSize: 13.5, color: c.mute },

  requestCard: { padding: 16, borderRadius: r.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  requestPet: { fontFamily: f.bodySemiBold, fontSize: 15, color: c.ink },
  timeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: r.pill, borderWidth: 1, borderColor: c.line, backgroundColor: c.panel },
  timeTagText: { fontFamily: f.bodySemiBold, fontSize: 11, color: c.mute },
  requestMeta: { fontFamily: f.body, fontSize: 13, color: c.mute },
  requestActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  rejectBtn: { flex: 1, paddingVertical: 12, borderRadius: r.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, alignItems: 'center' },
  rejectBtnText: { fontFamily: f.bodySemiBold, fontSize: 13.5, color: c.ink },
  acceptBtn: { flex: 1, paddingVertical: 12, borderRadius: r.md, backgroundColor: c.moss, alignItems: 'center' },
  acceptBtnText: { fontFamily: f.bodySemiBold, fontSize: 13.5, color: c.bg },
  btnDisabled: { opacity: 0.5 },
});
