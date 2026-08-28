import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft, Minus, Plus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import Card from '../components/Card';
import { CardTitle, CardMeta, CardBody } from '../components/CardText';
import Tag from '../components/Tag';
import { api, StorefrontDetail } from '../api/client';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Storefront'>;

const money = (cents: number, currency: string) => `$${(cents / 100).toFixed(2)} ${currency}`;

const CATEGORY_LABEL: Record<string, string> = {
  treat: 'Premio',
  toy: 'Juguete',
  accessory: 'Accesorio',
  service_addon: 'Extra de servicio',
  other: 'Otro',
};

export default function StorefrontScreen({ navigation, route }: Props) {
  const s = useAppState();
  const [store, setStore] = useState<StorefrontDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [buying, setBuying] = useState(false);
  const [orderResult, setOrderResult] = useState<'ok' | null>(null);

  useEffect(() => {
    if (!s.token) return;
    api
      .getStorefront(s.token, route.params.providerId)
      .then(setStore)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la tienda.'));
  }, [s.token, route.params.providerId]);

  const setQty = (productId: string, qty: number) => {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
  };

  const total = store
    ? store.products.reduce((sum, p) => sum + (cart[p.id] ?? 0) * p.price.amount, 0)
    : 0;
  const currency = store?.products[0]?.price.currency ?? 'USD';
  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const handleBuy = async () => {
    if (!s.token || !store) return;
    setError(null);
    setBuying(true);
    try {
      await api.placeOrder(s.token, {
        storefrontId: store.id,
        lines: Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity })),
      });
      setOrderResult('ok');
      setCart({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la compra.');
    } finally {
      setBuying(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>{store?.name ?? 'Tienda'}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {store?.description && <CardBody>{store.description}</CardBody>}

        {error && (
          <Card>
            <CardBody style={{ color: colors.accent }}>{error}</CardBody>
          </Card>
        )}

        {orderResult === 'ok' && (
          <Card>
            <CardBody style={{ color: colors.accent800 }}>
              ¡Compra realizada! Se entregará en tu próximo paseo confirmado con este paseador.
              Revisa "Mis compras" en tu perfil para ver el estado.
            </CardBody>
          </Card>
        )}

        {store?.products.length === 0 && <CardMeta>Esta tienda todavía no tiene productos.</CardMeta>}

        {store?.products.map((p) => (
          <Card key={p.id}>
            <View style={styles.row}>
              <CardTitle style={{ fontSize: 15 }}>{p.name}</CardTitle>
              <Tag variant="outline">{CATEGORY_LABEL[p.category] ?? p.category}</Tag>
            </View>
            {p.description && <CardBody>{p.description}</CardBody>}
            <View style={styles.row}>
              <Text style={styles.price}>{money(p.price.amount, p.price.currency)}</Text>
              <CardMeta>
                {p.stockQuantity === null ? 'Disponible' : `${p.stockQuantity} en stock`}
              </CardMeta>
            </View>
            <View style={styles.stepper}>
              <IconButton onPress={() => setQty(p.id, (cart[p.id] ?? 0) - 1)}>
                <Minus size={16} strokeWidth={1.5} color={colors.text} />
              </IconButton>
              <Text style={styles.qty}>{cart[p.id] ?? 0}</Text>
              <IconButton onPress={() => setQty(p.id, (cart[p.id] ?? 0) + 1)}>
                <Plus size={16} strokeWidth={1.5} color={colors.text} />
              </IconButton>
            </View>
          </Card>
        ))}
      </ScrollView>
      {itemCount > 0 && (
        <View style={styles.footer}>
          <Button variant="primary" block blueprint disabled={buying} onPress={handleBuy}>
            {buying ? 'Procesando…' : `Comprar (${itemCount}) · ${money(total, currency)}`}
          </Button>
        </View>
      )}
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
  price: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  qty: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.text, minWidth: 20, textAlign: 'center' },
  footer: { padding: space.s4 },
});
