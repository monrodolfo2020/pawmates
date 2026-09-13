import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable } from 'react-native';
import { ChevronLeft, Minus, Plus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { api, StorefrontDetail } from '../api/client';
import { commerceColors as c, commerceFonts as f, commerceRadius as r, tintFor } from '../theme/commerceTokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

const money = (cents: number, currency: string) => '$' + (cents / 100).toFixed(2).replace(/\.00$/, '') + ' ' + currency;

export default function CartScreen({ navigation, route }: Props) {
  const s = useAppState();
  const { providerId } = route.params;
  const [store, setStore] = useState<StorefrontDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    api
      .getStorefront(s.token, providerId)
      .then(setStore)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el carrito.'));
  }, [s.token, providerId]);

  const products = store?.products ?? [];
  const lines = Object.entries(s.cart)
    .map(([productId, qty]) => ({ product: products.find((p) => p.id === productId), qty }))
    .filter((l): l is { product: NonNullable<typeof l.product>; qty: number } => !!l.product);

  const currency = lines[0]?.product.price.currency ?? 'MXN';
  const total = lines.reduce((sum, l) => sum + l.product.price.amount * l.qty, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);

  const handleCheckout = async () => {
    if (!store) return;
    if (!s.token) {
      navigation.navigate('Login');
      return;
    }
    setError(null);
    setBuying(true);
    try {
      await api.placeOrder(s.token, {
        storefrontId: store.id,
        lines: lines.map((l) => ({ productId: l.product.id, quantity: l.qty })),
      });
      s.clearCart();
      setOrderPlaced(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la compra.');
    } finally {
      setBuying(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} strokeWidth={2} color={c.ink} />
          </Pressable>
          <Text style={styles.title}>Carrito</Text>
        </View>

        {orderPlaced ? (
          <View style={styles.centerFill}>
            <Text style={styles.emptyTitle}>¡Compra realizada!</Text>
            <Text style={styles.emptyBody}>
              Se entregará en tu próximo paseo confirmado. Revisa "Mis compras" en tu perfil para ver el estado.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('Storefront', { providerId })}>
              <Text style={styles.primaryBtnText}>Seguir comprando</Text>
            </Pressable>
          </View>
        ) : lines.length === 0 ? (
          <View style={styles.centerFill}>
            <Text style={styles.emptyTitle}>Todavía no hay nada aquí</Text>
            <Text style={styles.emptyBody}>Agrega algo del catálogo y aparecerá en tu carrito.</Text>
            <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('Storefront', { providerId })}>
              <Text style={styles.primaryBtnText}>Explorar la tienda</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.body}>
              {error && <Text style={styles.error}>{error}</Text>}
              {lines.map(({ product, qty }) => {
                const photo = product.photos[0] ?? null;
                const tint = tintFor(product.id);
                return (
                  <View key={product.id} style={styles.line}>
                    {photo ? (
                      <Image source={{ uri: photo }} style={styles.lineImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.lineImage, { backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={styles.lineInitial}>{product.name[0]}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={styles.lineName} numberOfLines={2}>{product.name}</Text>
                      <View style={styles.rowBetween}>
                        <View style={styles.stepper}>
                          <Pressable style={styles.stepperBtn} onPress={() => s.setCartQty(product.id, qty - 1)}>
                            <Minus size={14} strokeWidth={2} color={c.ink} />
                          </Pressable>
                          <Text style={styles.stepperQty}>{qty}</Text>
                          <Pressable style={styles.stepperBtn} onPress={() => s.setCartQty(product.id, qty + 1)}>
                            <Plus size={14} strokeWidth={2} color={c.ink} />
                          </Pressable>
                        </View>
                        <Text style={styles.lineTotal}>{money(product.price.amount * qty, product.price.currency)}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              <View style={styles.summary}>
                <View style={styles.rowBetween}>
                  <Text style={styles.summaryTotalLabel}>Total ({itemCount} {itemCount === 1 ? 'artículo' : 'artículos'})</Text>
                  <Text style={styles.summaryTotal}>{money(total, currency)}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable style={[styles.primaryBtn, buying && styles.primaryBtnDisabled]} onPress={buying ? undefined : handleCheckout}>
                <Text style={styles.primaryBtnText}>{buying ? 'Procesando…' : `Comprar · ${money(total, currency)}`}</Text>
              </Pressable>
            </View>
          </>
        )}
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
  title: { fontFamily: f.serif, fontSize: 28, color: c.ink },
  body: { paddingHorizontal: 20, paddingBottom: 24, gap: 4 },
  error: { fontFamily: f.body, fontSize: 13, color: c.clay, marginBottom: 8 },
  line: { flexDirection: 'row', gap: 13, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: c.line },
  lineImage: { width: 72, height: 72, borderRadius: r.md },
  lineInitial: { fontFamily: f.serif, fontSize: 28, color: 'rgba(23,26,21,0.22)' },
  lineName: { fontFamily: f.bodySemiBold, fontSize: 14.5, color: c.ink, lineHeight: 19 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: {
    flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderColor: c.line,
    borderRadius: r.sm, backgroundColor: c.surface,
  },
  stepperBtn: { width: 30, height: 28, alignItems: 'center', justifyContent: 'center' },
  stepperQty: { fontFamily: f.bodySemiBold, fontSize: 14, color: c.ink, minWidth: 18, textAlign: 'center' },
  lineTotal: { fontFamily: f.serif, fontSize: 18, color: c.ink },
  summary: { marginTop: 16, padding: 18, borderRadius: r.md, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
  summaryTotalLabel: { fontFamily: f.bodySemiBold, fontSize: 14, color: c.ink },
  summaryTotal: { fontFamily: f.serif, fontSize: 24, color: c.ink },
  footer: { padding: 20, backgroundColor: 'rgba(247,244,238,0.94)', borderTopWidth: 1, borderTopColor: c.line },
  primaryBtn: { paddingVertical: 16, borderRadius: r.md, backgroundColor: c.moss, alignItems: 'center' },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontFamily: f.bodyBold, fontSize: 15, color: c.bg },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontFamily: f.serif, fontSize: 26, color: c.ink, textAlign: 'center' },
  emptyBody: { fontFamily: f.body, fontSize: 14, color: c.mute, textAlign: 'center', lineHeight: 20 },
});
