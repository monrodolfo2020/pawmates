import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Notice from '../components/Notice';
import Tag, { bookingStatusVariant } from '../components/Tag';
import ReviewSheet from '../components/ReviewSheet';
import { BoneRow } from '../components/Bones';
import {
  api,
  BOOKING_STATUS_LABELS,
  BookingStatusCode,
  BookingSummary,
  MEET_GREET_SERVICE_TYPE_CODE,
  OwnReview,
} from '../api/client';
import { colors, fonts, space, type } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import { formatWhen } from '../utils/bookingSlots';

type Props = NativeStackScreenProps<RootStackParamList, 'Bookings'>;

const money = (cents: number, currency: string) =>
  '$' + (cents / 100).toFixed(2).replace(/\.00$/, '') + ' ' + currency;

/** The walk screen, from the owner's side: waiting, live, or the summary. */
const WALK_LINK: Record<string, string> = {
  confirmed: 'Ver paseo',
  in_progress: '● Ver en vivo',
  completed: 'Ver resumen',
};

/** Not over yet: listed under "Próximas". */
const ACTIVE = new Set(['requested', 'accepted', 'confirmed', 'in_progress']);

/** Still on the calendar — either side can call it off until it starts. */
const CANCELLABLE = new Set(['requested', 'confirmed']);

/** Accepted by the business: once its time has come, the owner can rate
 * it (the backend checks the same). */
const SERVED = new Set(['confirmed', 'in_progress', 'completed']);
const canReview = (b: BookingSummary) => SERVED.has(b.status) && new Date(b.scheduledAt).getTime() <= Date.now();

export default function BookingsScreen({ navigation }: Props) {
  const s = useAppState();
  const [bookings, setBookings] = useState<BookingSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  // The owner's reviews, by booking, so a rated service shows its bones.
  const [reviews, setReviews] = useState<Map<string, OwnReview>>(new Map());
  const [reviewing, setReviewing] = useState<BookingSummary | null>(null);

  const load = useCallback(() => {
    if (!s.token) return;
    api
      .listBookings(s.token)
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar tus reservas.'));
    api
      .myReviews(s.token)
      .then((rows) => setReviews(new Map(rows.filter((r) => r.bookingId).map((r) => [r.bookingId!, r]))))
      .catch(() => undefined);
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

  // Still ahead (or happening now) first, soonest on top; then the rest,
  // most recent first.
  const upcoming = (bookings ?? [])
    .filter((b) => ACTIVE.has(b.status))
    .sort((x, y) => x.scheduledAt.localeCompare(y.scheduledAt));
  const past = (bookings ?? [])
    .filter((b) => !ACTIVE.has(b.status))
    .sort((x, y) => y.scheduledAt.localeCompare(x.scheduledAt));

  const renderCard = (b: BookingSummary) => {
    const isMeetGreet = b.lines.some((l) => l.serviceTypeCode === MEET_GREET_SERVICE_TYPE_CODE);
    // Whoever is on the other side of this booking.
    const other = b.ownerId === s.accountId ? b.providerName : b.ownerName;
    const pets = b.lines.map((l) => l.petName?.split(' · ')[0]).filter(Boolean).join(', ');
    const review = reviews.get(b.id);
    const reviewable = b.ownerId === s.accountId && !isMeetGreet && canReview(b);
    return (
      <Card key={b.id}>
        <View style={styles.rowBetween}>
          <Avatar name={other ?? 'Negocio'} size={40} square />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={type.cardTitle} numberOfLines={1}>
              {other ?? 'Negocio'}
            </Text>
            <Text style={styles.date}>
              {isMeetGreet ? 'Meet & Greet' : (b.lines[0]?.serviceName ?? 'Paseo')}
              {pets ? ` de ${pets}` : ''} · {formatWhen(b.scheduledAt)}
            </Text>
          </View>
          <Tag variant={bookingStatusVariant(b.status)}>
            {BOOKING_STATUS_LABELS[b.status as BookingStatusCode] ?? b.status}
          </Tag>
        </View>
        {isMeetGreet ? (
          <Text style={type.meta}>Sin costo</Text>
        ) : (
          b.priceBreakdown && (
            <Text style={type.meta}>
              Tarifa: {money(b.priceBreakdown.rateAmount, b.priceBreakdown.currency)} · se paga directo al negocio
            </Text>
          )
        )}
        {review && (
          <View style={styles.reviewRow}>
            <Text style={type.meta}>Tu calificación</Text>
            <BoneRow value={review.rating} size={14} />
          </View>
        )}
        {((!isMeetGreet && WALK_LINK[b.status]) || CANCELLABLE.has(b.status) || reviewable) && (
          <View style={styles.actions}>
            {!isMeetGreet && WALK_LINK[b.status] && (
              <Button
                size="sm"
                variant={b.status === 'in_progress' ? 'primary' : 'secondary'}
                onPress={() => navigation.navigate('Live', { bookingId: b.id })}
              >
                {WALK_LINK[b.status]}
              </Button>
            )}
            {CANCELLABLE.has(b.status) && (
              <Button
                size="sm"
                variant="ghost"
                disabled={cancellingId === b.id}
                onPress={() => void cancel(b.id)}
              >
                {cancellingId === b.id ? 'Cancelando…' : 'Cancelar'}
              </Button>
            )}
            {reviewable && (
              <Button size="sm" variant={review ? 'ghost' : 'primary'} onPress={() => setReviewing(b)}>
                {review ? 'Editar reseña' : 'Calificar'}
              </Button>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => navigation.goBack()} title="Tus reservas" />
      <ScrollView contentContainerStyle={styles.body}>
        {error && <Notice tone="danger">{error}</Notice>}
        {bookings?.length === 0 && (
          <Notice>Todavía no tienes reservas. Cuando le pidas algo a un negocio, aparecerá aquí.</Notice>
        )}
        {upcoming.length > 0 && <Text style={type.section}>Próximas</Text>}
        {upcoming.map(renderCard)}
        {past.length > 0 && <Text style={[type.section, styles.later]}>Anteriores</Text>}
        {past.map(renderCard)}
      </ScrollView>
      {reviewing && s.token && (
        <ReviewSheet
          visible
          onClose={() => setReviewing(null)}
          token={s.token}
          providerId={reviewing.providerId}
          businessName={reviewing.providerName ?? 'el negocio'}
          bookingId={reviewing.id}
          existing={reviews.get(reviewing.id) ?? null}
          onSaved={(saved) => setReviews((m) => new Map(m).set(reviewing.id, saved))}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.s4, paddingBottom: space.s8, gap: space.s3 },
  later: { marginTop: space.s4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: space.s3 },
  date: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 18, color: colors.textMuted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2, marginTop: space.s1 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
});
