import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Card from '../components/Card';
import { CardTitle, CardMeta, CardBody } from '../components/CardText';
import Tag from '../components/Tag';
import { api, BookingSummary } from '../api/client';
import { colors, fonts, space } from '../theme/tokens';
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
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>Tus reservas</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {error && (
          <Card>
            <CardBody style={{ color: colors.accent }}>{error}</CardBody>
          </Card>
        )}
        {bookings?.length === 0 && <CardMeta>Todavía no tienes reservas.</CardMeta>}
        {bookings?.map((b) => (
          <Card key={b.id}>
            <View style={styles.row}>
              <CardTitle style={{ fontSize: 15 }}>{new Date(b.scheduledAt).toLocaleString()}</CardTitle>
              <Tag variant="outline">{STATUS_LABEL[b.status] ?? b.status}</Tag>
            </View>
            {b.priceBreakdown && (
              <CardMeta>Total: {money(b.priceBreakdown.totalAmount, b.priceBreakdown.currency)}</CardMeta>
            )}
          </Card>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
  },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  body: { paddingHorizontal: space.s4, gap: space.s3, paddingBottom: space.s4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
