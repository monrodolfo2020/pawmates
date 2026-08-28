import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import Card from '../components/Card';
import { CardTitle, CardMeta, CardBody } from '../components/CardText';
import Tag from '../components/Tag';
import { api, Order, OrderStatus } from '../api/client';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Orders'>;

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Procesando pago',
  paid: 'Pagado · sin paseo de entrega asignado',
  awaiting_delivery: 'Se entrega en tu próximo paseo',
  delivered: 'Entregado',
  refunded: 'Reembolsado',
};

const STATUS_VARIANT: Record<OrderStatus, 'accent' | 'outline'> = {
  pending_payment: 'outline',
  paid: 'outline',
  awaiting_delivery: 'accent',
  delivered: 'accent',
  refunded: 'outline',
};

const money = (cents: number, currency: string) => `$${(cents / 100).toFixed(2)} ${currency}`;

export default function OrdersScreen({ navigation, route }: Props) {
  const s = useAppState();
  const { mode, title } = route.params;
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    if (!s.token) return;
    api
      .listOrders(s.token, mode === 'sales' ? 'provider' : 'owner')
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los pedidos.'));
  };

  useEffect(load, [s.token, mode]);

  const runAction = async (fn: () => Promise<Order>, orderId: string) => {
    setBusyId(orderId);
    setError(null);
    try {
      await fn();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la acción.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>{title}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {error && (
          <Card>
            <CardBody style={{ color: colors.accent }}>{error}</CardBody>
          </Card>
        )}
        {orders?.length === 0 && <CardMeta>No hay pedidos todavía.</CardMeta>}
        {orders?.map((o) => {
          const busy = busyId === o.id;
          const canCancel = o.status === 'paid' || o.status === 'awaiting_delivery';
          const canDeliver = mode === 'sales' && o.status === 'awaiting_delivery' && !!o.deliveryWindowOpenAt;
          const canAttach = mode === 'purchases' && o.status === 'paid';
          return (
            <Card key={o.id}>
              <View style={styles.row}>
                <CardTitle style={{ fontSize: 15 }}>{money(o.total.amount, o.total.currency)}</CardTitle>
                <Tag variant={STATUS_VARIANT[o.status]}>{STATUS_LABEL[o.status]}</Tag>
              </View>
              <CardMeta>{new Date(o.createdAt).toLocaleString()}</CardMeta>
              {o.lines?.map((l) => (
                <CardBody key={l.productId}>
                  {l.quantity}× {l.name} — {money(l.lineTotal, l.unitPrice.currency)}
                </CardBody>
              ))}
              <View style={styles.actions}>
                {canAttach && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    style={{ flex: 1 }}
                    onPress={() => runAction(() => api.attachDeliveryBooking(s.token!, o.id), o.id)}
                  >
                    Vincular a mi próximo paseo
                  </Button>
                )}
                {canDeliver && (
                  <Button
                    variant="primary"
                    blueprint
                    disabled={busy}
                    style={{ flex: 1 }}
                    onPress={() => runAction(() => api.confirmDelivery(s.token!, o.id), o.id)}
                  >
                    Confirmar entrega
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    style={{ flex: 1 }}
                    onPress={() => runAction(() => api.cancelOrder(s.token!, o.id), o.id)}
                  >
                    Cancelar
                  </Button>
                )}
              </View>
            </Card>
          );
        })}
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
  actions: { flexDirection: 'row', gap: 6, marginTop: 4 },
});
