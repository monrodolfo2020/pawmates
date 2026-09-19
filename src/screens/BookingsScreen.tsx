import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { api, BookingSummary } from '../api/client';
import { commerceColors as c, commerceFonts as f, commerceRadius as r } from '../theme/commerceTokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Bookings'>;

const STATUS_LABEL: Record<string, string> = {
  requested: 'Solicitado',
  confirmed: 'Confirmado',
  in_progress: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
  rejected: 'Rechazado',
};

// Confirmed/in-progress/completed read as "on the books" (moss tint);
// cancelled/rejected as a soft stop (clay tint); requested — still
// waiting on the paseador — stays neutral.
const STATUS_TINT: Record<string, { bg: string; border: string; text: string }> = {
  confirmed: { bg: c.tintGreen, border: c.tintGreenLine, text: c.moss },
  in_progress: { bg: c.tintGreen, border: c.tintGreenLine, text: c.moss },
  completed: { bg: c.tintGreen, border: c.tintGreenLine, text: c.moss },
  cancelled: { bg: '#F3E4DA', border: '#E7CBB8', text: c.clay },
  rejected: { bg: '#F3E4DA', border: '#E7CBB8', text: c.clay },
};

const money = (cents: number, currency: string) => `${(cents / 100).toFixed(2)} ${currency}`;

export default function BookingsScreen({ navigation }: Props) {
  const s = useAppState();
  const [bookings, setBookings] = useState<BookingSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!s.token) return;
    api
      .listBookings(s.token)
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar tus reservas.'));
  }, [s.token]);

  return (
    <ScreenContainer>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} strokeWidth={2} color={c.ink} />
          </Pressable>
          <Text style={styles.title}>Tus reservas</Text>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          {error && <Text style={styles.error}>{error}</Text>}
          {bookings?.length === 0 && <Text style={styles.mutedBody}>Todavía no tienes reservas.</Text>}
          {bookings?.map((b) => {
            const tint = STATUS_TINT[b.status] ?? { bg: c.panel, border: c.line, text: c.mute };
            return (
              <View key={b.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.date}>{new Date(b.scheduledAt).toLocaleString()}</Text>
                  <View style={[styles.statusTag, { backgroundColor: tint.bg, borderColor: tint.border }]}>
                    <Text style={[styles.statusTagText, { color: tint.text }]}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </Text>
                  </View>
                </View>
                {b.priceBreakdown && (
                  <Text style={styles.mutedBody}>Total: {money(b.priceBreakdown.totalAmount, b.priceBreakdown.currency)}</Text>
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
  root: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14 },
  backBtn: {
    width: 36, height: 36, borderRadius: r.pill, borderWidth: 1, borderColor: c.line,
    backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: f.serif, fontSize: 26, color: c.ink },
  body: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  error: { fontFamily: f.body, fontSize: 13, color: c.clay },
  mutedBody: { fontFamily: f.body, fontSize: 13.5, color: c.mute },
  card: { padding: 16, borderRadius: r.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontFamily: f.bodySemiBold, fontSize: 14.5, color: c.ink },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: r.pill, borderWidth: 1 },
  statusTagText: { fontFamily: f.bodySemiBold, fontSize: 11 },
});
