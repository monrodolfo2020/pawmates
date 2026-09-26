import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Check, Clock, X } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import Card from '../components/Card';
import { CardBody, CardKicker, CardMeta } from '../components/CardText';
import { colors, fonts, radius, space, type } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import { api, ProviderDetail } from '../api/client';
import { formatWhen } from '../utils/bookingSlots';
import ScreenHeader from '../components/ScreenHeader';
import Notice from '../components/Notice';
import BottomBar from '../components/BottomBar';
import { formatDuration } from '../utils/services';

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
  const { walkerId, petId, scheduledAt, durationMinutes, serviceId } = route.params;
  const [business, setBusiness] = useState<ProviderDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('review');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const pet = s.pets.find((p) => p.id === petId);
  const service = business?.services?.find((x) => x.id === serviceId) ?? null;
  // What the backend will price it at: the service's own price, else the
  // business's base rate (see ProviderMarketplaceAdapter).
  const priceCents = service?.price ?? business?.price?.amount ?? null;
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
      await s.createBooking({ providerServiceId: walkerId, durationMinutes, scheduledAt, petId, serviceId });
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
        <View style={styles.waitingBody}>
          <View style={[styles.statusIcon, { backgroundColor: PHASE_TONE[phase].bg }]}>
            {React.createElement(PHASE_TONE[phase].icon, { size: 28, strokeWidth: 1.75, color: PHASE_TONE[phase].fg })}
          </View>
          <Text style={styles.statusTitle}>{copy[phase].title}</Text>
          <Text style={styles.statusBody}>{copy[phase].body}</Text>
          {cancelError && <Notice tone="danger">{cancelError}</Notice>}
        </View>
        <BottomBar>
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
            <Button variant="danger" block disabled={cancelling} onPress={() => void cancel()}>
              {cancelling ? 'Cancelando…' : phase === 'confirmed' ? 'Cancelar paseo' : 'Cancelar solicitud'}
            </Button>
          )}
          {!canCancel && (
            <Button variant="secondary" block onPress={() => navigation.navigate('Home')}>
              Volver al inicio
            </Button>
          )}
        </BottomBar>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => navigation.goBack()} title="Revisa tu solicitud" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {loadError && <Notice tone="danger">{loadError}</Notice>}

        <Card>
          <Row label="Negocio" value={business?.name ?? '…'} />
          <Row label="Mascota" value={pet ? `${pet.name} · ${pet.breed}` : '—'} />
          {service && <Row label="Paseo" value={service.name} />}
          <Row label="Cuándo" value={formatWhen(scheduledAt)} />
          <Row label="Duración" value={formatDuration(durationMinutes)} />
          <View style={styles.hr} />
          <Row
            label="Tarifa publicada"
            value={priceCents !== null ? `${money(priceCents, 'MXN')}${service ? '' : ' por paseo'}` : 'Por acordar'}
            strong
          />
        </Card>

        <Card tone="panel">
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
          <Notice tone="danger">{s.bookingError}</Notice>
        )}
      </ScrollView>
      <BottomBar>
        <Button variant="primary" block disabled={sending || !business} onPress={() => void send()}>
          {sending ? 'Enviando…' : 'Enviar solicitud'}
        </Button>
      </BottomBar>
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

// The answer screens: an icon in the state's color, then the words.
const PHASE_TONE: Record<Exclude<Phase, 'review'>, { icon: typeof Clock; bg: string; fg: string }> = {
  waiting: { icon: Clock, bg: colors.warningTint, fg: colors.warning },
  confirmed: { icon: Check, bg: colors.successTint, fg: colors.success },
  rejected: { icon: X, bg: colors.dangerTint, fg: colors.danger },
  cancelled: { icon: X, bg: colors.panel, fg: colors.textMuted },
};

const styles = StyleSheet.create({
  waitingBody: {
    flex: 1, paddingHorizontal: space.s6, gap: space.s3,
    alignItems: 'center', justifyContent: 'center',
  },
  statusIcon: { width: 64, height: 64, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { ...type.title, textAlign: 'center' },
  statusBody: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  scroll: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.s3, paddingVertical: space.s1 },
  rowLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  rowText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  rowStrong: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  hr: { height: 1, backgroundColor: colors.divider, marginVertical: space.s1 },
});
