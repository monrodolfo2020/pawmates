import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import {
  api,
  BOOKING_STATUS_LABELS,
  BookingStatusCode,
  BookingSummary,
  MEET_GREET_SERVICE_TYPE_CODE,
} from '../api/client';
import { colors, fonts, radius } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import { formatWhen } from '../utils/bookingSlots';

type Props = NativeStackScreenProps<RootStackParamList, 'Bookings'>;

// Confirmed/in-progress/completed read as "on the books" (mint tint);
// cancelled as a soft stop (rose tint); requested — still
// waiting on the paseador — stays neutral.
const STATUS_TINT: Record<string, { bg: string; border: string; text: string }> = {
  confirmed: { bg: colors.mintTint, border: colors.mintTintLine, text: colors.mintDark },
  in_progress: { bg: colors.mintTint, border: colors.mintTintLine, text: colors.mintDark },
  completed: { bg: colors.mintTint, border: colors.mintTintLine, text: colors.mintDark },
  cancelled: { bg: colors.roseTint, border: colors.roseTintLine, text: colors.rose },
};

const money = (cents: number, currency: string) =>
  '$' + (cents / 100).toFixed(2).replace(/\.00$/, '') + ' ' + currency;

/** The walk screen, from the owner's side: waiting, live, or the summary. */
const WALK_LINK: Record<string, string> = {
  confirmed: 'Ver paseo',
  in_progress: '● Ver en vivo',
  completed: 'Ver resumen',
};

/** Still on the calendar — either side can call it off until it starts. */
const CANCELLABLE = new Set(['requested', 'confirmed']);

export default function BookingsScreen({ navigation }: Props) {
  const s = useAppState();
  const [bookings, setBookings] = useState<BookingSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!s.token) return;
    api
      .listBookings(s.token)
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar tus reservas.'));
  }, [s.token]);

  useEffect(load, [load]);

  const cancel = async (id: string) => {
    if (!s.token) return;
    setCancellingId(id);
    setError(null);
    try {
      await api.cancelBooking(s.token, id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} strokeWidth={2} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Tus reservas</Text>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          {error && <Text style={styles.error}>{error}</Text>}
          {bookings?.length === 0 && <Text style={styles.mutedBody}>Todavía no tienes reservas.</Text>}
          {bookings?.map((b) => {
            const tint = STATUS_TINT[b.status] ?? { bg: colors.panel, border: colors.divider, text: colors.neutral600 };
            const isMeetGreet = b.lines.some((l) => l.serviceTypeCode === MEET_GREET_SERVICE_TYPE_CODE);
            return (
              <View key={b.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.date}>{formatWhen(b.scheduledAt)}</Text>
                  <View style={[styles.statusTag, { backgroundColor: tint.bg, borderColor: tint.border }]}>
                    <Text style={[styles.statusTagText, { color: tint.text }]}>
                      {BOOKING_STATUS_LABELS[b.status as BookingStatusCode] ?? b.status}
                    </Text>
                  </View>
                </View>
                {isMeetGreet ? (
                  <Text style={styles.mutedBody}>Meet & Greet — sin costo</Text>
                ) : (
                  b.priceBreakdown && (
                    <Text style={styles.mutedBody}>
                      Tarifa: {money(b.priceBreakdown.rateAmount, b.priceBreakdown.currency)} · se paga directo al negocio
                    </Text>
                  )
                )}
                {!isMeetGreet && WALK_LINK[b.status] && (
                  <Pressable
                    style={[styles.cancelBtn, styles.walkBtn]}
                    onPress={() => navigation.navigate('Live', { bookingId: b.id })}
                  >
                    <Text style={[styles.cancelBtnText, styles.walkBtnText]}>{WALK_LINK[b.status]}</Text>
                  </Pressable>
                )}
                {CANCELLABLE.has(b.status) && (
                  <Pressable
                    style={styles.cancelBtn}
                    disabled={cancellingId === b.id}
                    onPress={() => void cancel(b.id)}
                  >
                    <Text style={styles.cancelBtnText}>
                      {cancellingId === b.id ? 'Cancelando…' : 'Cancelar'}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14 },
  backBtn: {
    width: 36, height: 36, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.divider,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: fonts.heading, fontSize: 26, color: colors.text },
  body: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  error: { fontFamily: fonts.body, fontSize: 13, color: colors.rose },
  mutedBody: { fontFamily: fonts.body, fontSize: 13.5, color: colors.neutral600 },
  card: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.text },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1 },
  statusTagText: { fontFamily: fonts.bodySemiBold, fontSize: 11 },
  cancelBtn: {
    alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.divider,
  },
  cancelBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.text },
  walkBtn: { backgroundColor: colors.mint, borderColor: colors.mint },
  walkBtnText: { color: '#fff' },
});
