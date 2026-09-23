import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import Card from '../components/Card';
import { CardBody, CardKicker, CardMeta } from '../components/CardText';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import { api, ProviderDetail } from '../api/client';
import { formatWhen } from '../utils/bookingSlots';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

const money = (cents: number, currency: string) =>
  '$' + (cents / 100).toFixed(2).replace(/\.00$/, '') + ' ' + currency;

const POLL_INTERVAL_MS = 4000;

// review    — nothing sent yet; the owner is looking at what they'll ask for.
// waiting   — sent; the business decides from their own Dashboard (see
//             BookingController.accept/reject), this screen polls for it.
// confirmed / rejected / cancelled — the answer.
type Phase = 'review' | 'waiting' | 'confirmed' | 'rejected' | 'cancelled';

/**
 * The summary before a walk request goes out. PawMates doesn't take
 * payments or a commission — the owner pays the business directly, as
 * the two of them agree (Términos para dueños §8; Acuerdo de prestadores
 * 3.3) — so this shows the business's own published rate and says so,
 * rather than a checkout.
 */
export default function CheckoutScreen({ navigation, route }: Props) {
  const s = useAppState();
  const { walkerId, petId, scheduledAt, durationMinutes } = route.params;
  const [business, setBusiness] = useState<ProviderDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('review');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const pet = s.pets.find((p) => p.id === petId);
  const name = business?.name ?? 'el negocio';
  const sending = s.bookingStatus === 'creating';

  useEffect(() => {
    api
      .getProvider(s.token, walkerId)
      .then(setBusiness)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'No se pudo cargar el negocio.'));
  }, [s.token, walkerId]);

  useEffect(() => {
    if (phase !== 'waiting') return;
    const poll = async () => {
      const { token, bookingId } = s;
      if (!token || !bookingId) return;
      try {
        const booking = await api.getBooking(token, bookingId);
        if (booking.status === 'confirmed' || booking.status === 'in_progress') setPhase('confirmed');
        else if (booking.status === 'cancelled') setPhase('rejected');
      } catch {
        // Transient — the next tick tries again.
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const send = async () => {
    try {
      await s.createBooking({ providerServiceId: walkerId, durationMinutes, scheduledAt, petId });
      setPhase('waiting');
    } catch {
      // s.bookingError is shown below; stay on the summary.
    }
  };

  const cancel = async () => {
    if (!s.token || !s.bookingId) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await api.cancelBooking(s.token, s.bookingId, 'Cancelada por el dueño');
      setPhase('cancelled');
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'No se pudo cancelar.');
    } finally {
      setCancelling(false);
    }
  };

  if (phase !== 'review') {
    const copy: Record<Exclude<Phase, 'review'>, { title: string; body: string }> = {
      waiting: {
        title: 'Solicitud enviada',
        body: `Le enviamos tu solicitud a ${name}. Puedes cerrar esta pantalla: su respuesta aparecerá en "Tus reservas".`,
      },
      confirmed: {
        title: '¡Paseo confirmado!',
        body: `${name} aceptó tu solicitud para el ${formatWhen(scheduledAt)}. Acuerden por el chat los detalles y la forma de pago.`,
      },
      rejected: {
        title: 'Solicitud no aceptada',
        body: `${name} no puede atender esta solicitud. Puedes pedir otro horario o buscar otro negocio.`,
      },
      cancelled: {
        title: 'Cancelado',
        body: `Cancelaste tu solicitud con ${name}. Si ya habían acordado algo por el chat, avísale por ahí.`,
      },
    };
    const canCancel = phase === 'waiting' || phase === 'confirmed';
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <Text style={styles.title}>{copy[phase].title}</Text>
        </View>
        <View style={styles.waitingBody}>
          <Card>
            <CardBody>{copy[phase].body}</CardBody>
          </Card>
          {cancelError && <CardMeta style={{ color: colors.accent }}>{cancelError}</CardMeta>}
        </View>
        <View style={styles.footer}>
          {phase === 'confirmed' && s.bookingId ? (
            <Button
              variant="primary"
              block
              onPress={() => navigation.navigate('Chat', { bookingId: s.bookingId! })}
            >
              Abrir chat
            </Button>
          ) : (
            <Button variant="primary" block onPress={() => navigation.navigate('Bookings')}>
              Ver mis reservas
            </Button>
          )}
          {canCancel && (
            <Button variant="secondary" block disabled={cancelling} onPress={() => void cancel()}>
              {cancelling ? 'Cancelando…' : phase === 'confirmed' ? 'Cancelar paseo' : 'Cancelar solicitud'}
            </Button>
          )}
          {!canCancel && (
            <Button variant="secondary" block onPress={() => navigation.navigate('Home')}>
              Volver al inicio
            </Button>
          )}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>Revisa tu solicitud</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loadError && <CardMeta style={{ color: colors.accent }}>{loadError}</CardMeta>}

        <Card>
          <Row label="Negocio" value={business?.name ?? '…'} />
          <Row label="Mascota" value={pet ? `${pet.name} · ${pet.breed}` : '—'} />
          <Row label="Cuándo" value={formatWhen(scheduledAt)} />
          <Row label="Duración" value={`${durationMinutes} min`} />
          <View style={styles.hr} />
          <Row
            label="Tarifa publicada"
            value={business?.price ? `${money(business.price.amount, business.price.currency)} por paseo` : 'Por acordar'}
            strong
          />
        </Card>

        <Card>
          <CardKicker>Cómo se paga</CardKicker>
          <CardBody>
            PawMates no cobra este paseo ni ninguna comisión. El precio final, la forma de pago y
            cualquier propina los acuerdas directamente con {name}.
          </CardBody>
        </Card>

        <CardMeta>
          Al enviar, {name} recibe tu solicitud y puede aceptarla o rechazarla. Mientras no empiece
          el paseo puedes cancelarla desde la app.
        </CardMeta>

        {s.bookingStatus === 'error' && s.bookingError && (
          <CardMeta style={{ color: colors.accent }}>{s.bookingError}</CardMeta>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button variant="primary" block disabled={sending || !business} onPress={() => void send()}>
          {sending ? 'Enviando…' : 'Enviar solicitud'}
        </Button>
      </View>
    </ScreenContainer>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={strong ? styles.rowStrong : styles.rowLabel}>{label}</Text>
      <Text style={[strong ? styles.rowStrong : styles.rowText, styles.rowValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  waitingBody: { paddingHorizontal: space.s4, paddingTop: space.s2, flex: 1, gap: space.s3 },
  header: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
  },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  scroll: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.s3, paddingVertical: 3 },
  rowLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted70 },
  rowText: { fontFamily: fonts.body, fontSize: 13, color: colors.text },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  rowStrong: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  hr: { height: 1, backgroundColor: colors.divider, marginVertical: 6 },
  footer: { padding: space.s4, gap: space.s2 },
});
