import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Segmented from '../components/Segmented';
import Card from '../components/Card';
import { CardKicker, CardTitle, CardBody, CardMeta } from '../components/CardText';
import Tag from '../components/Tag';
import { api, AdminAccount, AdminVerification, AdminStorefront, AdminOrder, OrderStatus } from '../api/client';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Admin'>;

const VERIFICATION_VARIANT: Record<string, 'accent' | 'outline'> = {
  pending: 'outline',
  verified: 'accent',
  rejected: 'outline',
};

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Procesando pago',
  paid: 'Pagado',
  awaiting_delivery: 'Por entregar',
  delivered: 'Entregado',
  refunded: 'Reembolsado',
};

const money = (cents: number, currency: string) => `$${(cents / 100).toFixed(2)} ${currency}`;

type Section = 'cuentas' | 'verificaciones' | 'tiendas' | 'pedidos';

export default function AdminScreen({ navigation }: Props) {
  const s = useAppState();
  const [section, setSection] = useState<Section>('cuentas');
  const [accounts, setAccounts] = useState<AdminAccount[] | null>(null);
  const [verifications, setVerifications] = useState<AdminVerification[] | null>(null);
  const [storefronts, setStorefronts] = useState<AdminStorefront[] | null>(null);
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!s.token) return;
    Promise.all([
      api.adminListAccounts(s.token),
      api.adminListVerifications(s.token),
      api.adminListStorefronts(s.token),
      api.adminListOrders(s.token),
    ])
      .then(([a, v, st, o]) => {
        setAccounts(a);
        setVerifications(v);
        setStorefronts(st);
        setOrders(o);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el panel.'));
  }, [s.token]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>Panel de administrador</Text>
      </View>
      <View style={styles.segRow}>
        <Segmented
          options={[
            { label: 'Cuentas', value: 'cuentas' },
            { label: 'Verificaciones', value: 'verificaciones' },
            { label: 'Tiendas', value: 'tiendas' },
            { label: 'Pedidos', value: 'pedidos' },
          ]}
          value={section}
          onChange={(v) => setSection(v as Section)}
        />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {error && (
          <Card>
            <CardBody style={{ color: colors.accent }}>{error}</CardBody>
          </Card>
        )}

        {section === 'cuentas' && (
          <View style={{ gap: space.s2 }}>
            <Text style={styles.h5}>Cuentas ({accounts?.length ?? '…'})</Text>
            {accounts?.map((a) => (
              <Card key={a.id}>
                <CardKicker style={{ margin: 0 }}>{a.email}</CardKicker>
                <CardBody>{a.name ?? 'Sin nombre'}</CardBody>
                <View style={styles.wrapRow}>
                  {a.roles.map((r) => (
                    <Tag key={r} variant="outline">{r}</Tag>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        )}

        {section === 'verificaciones' && (
          <View style={{ gap: space.s2 }}>
            <Text style={styles.h5}>Verificaciones de paseadores</Text>
            {verifications?.length === 0 && <CardMeta>No hay verificaciones registradas.</CardMeta>}
            {verifications?.map((v) => (
              <Card key={v.id}>
                <View style={styles.row}>
                  <CardKicker style={{ margin: 0 }}>Cuenta {v.accountId.slice(0, 8)}…</CardKicker>
                  <Tag variant={VERIFICATION_VARIANT[v.status] ?? 'outline'}>{v.status}</Tag>
                </View>
                <CardMeta>Enviada {new Date(v.createdAt).toLocaleString()}</CardMeta>
              </Card>
            ))}
          </View>
        )}

        {section === 'tiendas' && (
          <View style={{ gap: space.s2 }}>
            <Text style={styles.h5}>Tiendas ({storefronts?.length ?? '…'})</Text>
            {storefronts?.length === 0 && <CardMeta>Todavía no hay tiendas abiertas.</CardMeta>}
            {storefronts?.map((st) => (
              <Card key={st.id}>
                <View style={styles.row}>
                  <CardTitle style={{ fontSize: 15 }}>{st.name}</CardTitle>
                  <Tag variant={st.isActive ? 'accent' : 'outline'}>{st.isActive ? 'Activa' : 'Inactiva'}</Tag>
                </View>
                <CardMeta>{st.providerName ?? st.providerEmail ?? st.providerId}</CardMeta>
                <CardBody>
                  {st.productCount} {st.productCount === 1 ? 'producto' : 'productos'}
                </CardBody>
              </Card>
            ))}
          </View>
        )}

        {section === 'pedidos' && (
          <View style={{ gap: space.s2 }}>
            <Text style={styles.h5}>Pedidos recientes ({orders?.length ?? '…'})</Text>
            {orders?.length === 0 && <CardMeta>Todavía no hay pedidos.</CardMeta>}
            {orders?.map((o) => (
              <Card key={o.id}>
                <View style={styles.row}>
                  <CardTitle style={{ fontSize: 15 }}>{money(o.total.amount, o.total.currency)}</CardTitle>
                  <Tag variant="outline">{ORDER_STATUS_LABEL[o.status] ?? o.status}</Tag>
                </View>
                <CardMeta>{new Date(o.createdAt).toLocaleString()}</CardMeta>
              </Card>
            ))}
          </View>
        )}
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
  segRow: { paddingHorizontal: space.s4, paddingBottom: space.s2 },
  body: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s4 },
  h5: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
