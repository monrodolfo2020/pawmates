import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Camera, ChevronLeft, Minus, Plus, Search, ShoppingBag, Store } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import Card from '../components/Card';
import TextField from '../components/TextField';
import Segmented from '../components/Segmented';
import { CardKicker, CardMeta, CardBody } from '../components/CardText';
import Tag from '../components/Tag';
import { api, Product, ProductCategory, StorefrontDetail } from '../api/client';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Storefront'>;

const money = (cents: number, currency: string) => `$${(cents / 100).toFixed(2)} ${currency}`;

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  treat: 'Premio',
  toy: 'Juguete',
  accessory: 'Accesorio',
  service_addon: 'Extra',
  other: 'Otro',
};

export default function StorefrontScreen({ navigation, route }: Props) {
  const s = useAppState();
  const [store, setStore] = useState<StorefrontDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [buying, setBuying] = useState(false);
  const [orderResult, setOrderResult] = useState<'ok' | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');

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

  const products = store?.products ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === 'all' || p.category === category) &&
        (q === '' || p.name.toLowerCase().includes(q)),
    );
  }, [products, search, category]);

  const total = products.reduce((sum, p) => sum + (cart[p.id] ?? 0) * p.price.amount, 0);
  const currency = products[0]?.price.currency ?? 'MXN';
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
        <Text style={styles.headerTitle}>{store?.name ?? 'Tienda'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Store size={26} strokeWidth={1.5} color={colors.accent} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <CardKicker style={{ margin: 0 }}>PawMates Commerce</CardKicker>
            <Text style={styles.heroTitle}>{store?.name ?? 'Tienda'}</Text>
            {store?.description && <CardBody style={{ margin: 0 }}>{store.description}</CardBody>}
            <CardMeta>
              {products.length} {products.length === 1 ? 'producto disponible' : 'productos disponibles'}
            </CardMeta>
          </View>
        </View>

        {error && (
          <Card>
            <CardBody style={{ color: colors.accent }}>{error}</CardBody>
          </Card>
        )}

        {orderResult === 'ok' && (
          <Card>
            <CardBody style={{ color: colors.accent800 }}>
              ¡Compra realizada! Se entregará en tu próximo paseo confirmado.
              Revisa "Mis compras" en tu perfil para ver el estado.
            </CardBody>
          </Card>
        )}

        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <TextField
              label=""
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar productos…"
            />
          </View>
          <View style={styles.searchIcon}>
            <Search size={16} strokeWidth={1.5} color={colors.textMuted70} />
          </View>
        </View>

        <Segmented
          options={[
            { label: 'Todas', value: 'all' },
            { label: 'Premios', value: 'treat' },
            { label: 'Juguetes', value: 'toy' },
            { label: 'Accesorios', value: 'accessory' },
            { label: 'Extras', value: 'service_addon' },
            { label: 'Otros', value: 'other' },
          ]}
          value={category}
          onChange={(v) => setCategory(v as ProductCategory | 'all')}
        />

        {products.length === 0 ? (
          <CardMeta>Esta tienda todavía no tiene productos.</CardMeta>
        ) : filtered.length === 0 ? (
          <CardMeta>Ningún producto coincide con tu búsqueda.</CardMeta>
        ) : (
          <View style={styles.grid}>
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                qty={cart[p.id] ?? 0}
                onQtyChange={(qty) => setQty(p.id, qty)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {itemCount > 0 && (
        <View style={styles.footer}>
          <Button variant="primary" block blueprint disabled={buying} onPress={handleBuy} icon={<ShoppingBag size={16} strokeWidth={1.5} color={colors.bg} />}>
            {buying ? 'Procesando…' : `Comprar (${itemCount}) · ${money(total, currency)}`}
          </Button>
        </View>
      )}
    </ScreenContainer>
  );
}

function ProductCard({
  product, qty, onQtyChange,
}: { product: Product; qty: number; onQtyChange: (qty: number) => void }) {
  const photo = product.photos[0] ?? null;

  return (
    <Card style={styles.productCard}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.productImage} resizeMode="cover" />
      ) : (
        <View style={[styles.productImage, styles.productImagePlaceholder]}>
          <Camera size={20} strokeWidth={1.5} color={colors.text} style={{ opacity: 0.3 }} />
        </View>
      )}
      <Tag variant="outline" style={styles.productCategoryTag}>
        {CATEGORY_LABEL[product.category] ?? product.category}
      </Tag>
      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>
      <View style={styles.productMetaRow}>
        <Text style={styles.productPrice}>{money(product.price.amount, product.price.currency)}</Text>
        <CardMeta style={{ margin: 0 }}>
          {product.stockQuantity === null ? 'Disponible' : `${product.stockQuantity} en stock`}
        </CardMeta>
      </View>

      {qty === 0 ? (
        <Button variant="primary" blueprint block onPress={() => onQtyChange(1)}>
          Agregar
        </Button>
      ) : (
        <View style={styles.productStepper}>
          <Pressable style={styles.stepperBtn} onPress={() => onQtyChange(qty - 1)}>
            <Minus size={15} strokeWidth={1.5} color={colors.text} />
          </Pressable>
          <Text style={styles.qty}>{qty}</Text>
          <Pressable style={styles.stepperBtn} onPress={() => onQtyChange(qty + 1)}>
            <Plus size={15} strokeWidth={1.5} color={colors.text} />
          </Pressable>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
  },
  headerTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  body: { paddingHorizontal: space.s4, gap: space.s3, paddingBottom: space.s6 },
  hero: {
    flexDirection: 'row', gap: space.s3, alignItems: 'flex-start',
    backgroundColor: colors.accent100, borderWidth: 1, borderColor: colors.divider,
    padding: space.s4,
  },
  heroIcon: {
    width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.divider,
  },
  heroTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.text },
  searchRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.s2 },
  searchIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s3 },
  productCard: { width: '47%', gap: space.s2 },
  productImage: { width: '100%', aspectRatio: 1, backgroundColor: colors.accent100 },
  productImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  productCategoryTag: { alignSelf: 'flex-start' },
  productName: { fontFamily: fonts.heading, fontSize: 14, lineHeight: 17, color: colors.text, minHeight: 34 },
  productMetaRow: { gap: 1 },
  productPrice: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  productStepper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.divider, height: 36,
  },
  stepperBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  qty: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text, minWidth: 20, textAlign: 'center' },
  footer: { padding: space.s4 },
});
