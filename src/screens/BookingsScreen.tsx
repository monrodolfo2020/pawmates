import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { api, BookingSummary, MEET_GREET_SERVICE_TYPE_CODE } from '../api/client';
import { vividColors as v, vividFonts as vf, vividRadius as vr } from '../theme/vividTokens';
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

// Confirmed/in-progress/completed read as "on the books" (mint tint);
// cancelled/rejected as a soft stop (rose tint); requested — still
// waiting on the paseador — stays neutral.
const STATUS_TINT: Record<string, { bg: string; border: string; text: string }> = {
  confirmed: { bg: v.mintTint, border: v.mintTintLine, text: v.mintDark },
  in_progress: { bg: v.mintTint, border: v.mintTintLine, text: v.mintDark },
  completed: { bg: v.mintTint, border: v.mintTintLine, text: v.mintDark },
  cancelled: { bg: v.roseTint, border: v.roseTintLine, text: v.rose },
  rejected: { bg: v.roseTint, border: v.roseTintLine, text: v.rose },
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
            <ChevronLeft size={16} strokeWidth={2} color={v.ink} />
          </Pressable>
          <Text style={styles.title}>Tus reservas</Text>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          {error && <Text style={styles.error}>{error}</Text>}
          {bookings?.length === 0 && <Text style={styles.mutedBody}>Todavía no tienes reservas.</Text>}
          {bookings?.map((b) => {
            const tint = STATUS_TINT[b.status] ?? { bg: v.panel, border: v.line, text: v.mute };
            const isMeetGreet = b.lines.some((l) => l.serviceTypeCode === MEET_GREET_SERVICE_TYPE_CODE);
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
                {isMeetGreet ? (
                  <Text style={styles.mutedBody}>Meet & Greet — sin costo</Text>
                ) : (
                  b.priceBreakdown && (
                    <Text style={styles.mutedBody}>Total: {money(b.priceBreakdown.totalAmount, b.priceBreakdown.currency)}</Text>
                  )
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
  root: { flex: 1, backgroundColor: v.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14 },
  backBtn: {
    width: 36, height: 36, borderRadius: vr.pill, borderWidth: 1, borderColor: v.line,
    backgroundColor: v.surface, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: vf.display, fontSize: 26, color: v.ink },
  body: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  error: { fontFamily: vf.body, fontSize: 13, color: v.rose },
  mutedBody: { fontFamily: vf.body, fontSize: 13.5, color: v.mute },
  card: { padding: 16, borderRadius: vr.lg, backgroundColor: v.surface, borderWidth: 1, borderColor: v.line, gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontFamily: vf.bodySemiBold, fontSize: 14.5, color: v.ink },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: vr.pill, borderWidth: 1 },
  statusTagText: { fontFamily: vf.bodySemiBold, fontSize: 11 },
});
