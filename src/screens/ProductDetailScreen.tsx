import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, Pressable, Dimensions,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { ChevronLeft, Minus, Plus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { api, Product, ProductCategory, StorefrontDetail } from '../api/client';
import { commerceColors as c, commerceFonts as f, commerceRadius as r, tintFor } from '../theme/commerceTokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

const money = (cents: number, currency: string) => '$' + (cents / 100).toFixed(2).replace(/\.00$/, '') + ' ' + currency;

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  treat: 'Premio',
  toy: 'Juguete',
  accessory: 'Accesorio',
  service_addon: 'Extra de servicio',
  other: 'Otro',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_WIDTH = Math.min(SCREEN_WIDTH, 480);

export default function ProductDetailScreen({ navigation, route }: Props) {
  const s = useAppState();
  const { providerId, productId } = route.params;
  const [store, setStore] = useState<StorefrontDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    api
      .getStorefront(s.token, providerId)
      .then(setStore)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el producto.'));
  }, [s.token, providerId]);

  const product: Product | undefined = store?.products.find((p) => p.id === productId);

  const onScrollPhotos = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / HERO_WIDTH);
    setPhotoIndex(idx);
  };

  const handleAddToCart = () => {
    if (!product) return;
    s.setCartQty(product.id, (s.cart[product.id] ?? 0) + qty);
    navigation.navigate('Cart', { providerId });
  };

  if (error) {
    return (
      <ScreenContainer>
        <View style={styles.centerFill}>
          <Text style={styles.error}>{error}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!product) {
    return (
      <ScreenContainer>
        <View style={styles.centerFill}>
          <Text style={styles.mutedBody}>Cargando…</Text>
        </View>
      </ScreenContainer>
    );
  }

  const tint = tintFor(product.id);
  const inStock = product.stockQuantity === null || product.stockQuantity > 0;

  return (
    <ScreenContainer>
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.scrollBody}>
          <View style={styles.hero}>
            {product.photos.length > 0 ? (
              <ScrollView
                horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                onScroll={onScrollPhotos} scrollEventThrottle={32}
              >
                {product.photos.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.heroImage} resizeMode="cover" />
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.heroImage, { backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={styles.heroInitial}>{product.name[0]}</Text>
              </View>
            )}
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <ChevronLeft size={18} strokeWidth={2} color={c.ink} />
            </Pressable>
            {product.photos.length > 1 && (
              <View style={styles.dots}>
                {product.photos.map((_, i) => (
                  <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>

          <View style={styles.body}>
            <Text style={styles.brand}>{CATEGORY_LABEL[product.category]}</Text>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.stock}>
              {product.stockQuantity === null ? 'Disponible' : `${product.stockQuantity} en stock`}
            </Text>
            {product.description && <Text style={styles.description}>{product.description}</Text>}

            <Text style={styles.qtyLabel}>Cantidad</Text>
            <View style={styles.qtyStepper}>
              <Pressable style={styles.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus size={16} strokeWidth={2} color={c.ink} />
              </Pressable>
              <Text style={styles.qtyValue}>{qty}</Text>
              <Pressable style={styles.qtyBtn} onPress={() => setQty((q) => q + 1)}>
                <Plus size={16} strokeWidth={2} color={c.ink} />
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View>
            <Text style={styles.footerPrice}>{money(product.price.amount * qty, product.price.currency)}</Text>
            <Text style={styles.footerNote}>{inStock ? 'Entrega con tu próximo paseo' : 'Sin stock'}</Text>
          </View>
          <Pressable
            style={[styles.addBtn, !inStock && styles.addBtnDisabled]}
            onPress={inStock ? handleAddToCart : undefined}
          >
            <Text style={styles.addBtnText}>Agregar al carrito</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  scrollBody: { paddingBottom: 120 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { fontFamily: f.body, fontSize: 14, color: c.clay, textAlign: 'center' },
  mutedBody: { fontFamily: f.body, fontSize: 14, color: c.mute },
  hero: { height: 320, position: 'relative' },
  heroImage: { width: HERO_WIDTH, height: 320 },
  heroInitial: { fontFamily: f.serif, fontSize: 120, color: 'rgba(23,26,21,0.18)' },
  backBtn: {
    position: 'absolute', top: 20, left: 18, width: 38, height: 38, borderRadius: r.pill,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  dots: { position: 'absolute', bottom: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(23,26,21,0.22)' },
  dotActive: { width: 16, backgroundColor: 'rgba(23,26,21,0.5)' },
  body: { padding: 20 },
  brand: { fontFamily: f.bodySemiBold, fontSize: 11.5, letterSpacing: 1, textTransform: 'uppercase', color: c.muted2 },
  name: { fontFamily: f.serif, fontSize: 30, color: c.ink, marginTop: 6, lineHeight: 34 },
  stock: { fontFamily: f.body, fontSize: 13, color: c.mute, marginTop: 8 },
  description: { fontFamily: f.body, fontSize: 14.5, lineHeight: 22, color: '#4A4F45', marginTop: 14 },
  qtyLabel: { fontFamily: f.bodyBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: c.muted2, marginTop: 24 },
  qtyStepper: {
    flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 12,
    alignSelf: 'flex-start', borderWidth: 1, borderColor: c.line, borderRadius: r.md, paddingHorizontal: 8,
  },
  qtyBtn: { width: 36, height: 42, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontFamily: f.bodySemiBold, fontSize: 16, color: c.ink, minWidth: 20, textAlign: 'center' },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20,
    backgroundColor: 'rgba(247,244,238,0.94)', borderTopWidth: 1, borderTopColor: c.line,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  footerPrice: { fontFamily: f.serif, fontSize: 24, color: c.ink },
  footerNote: { fontFamily: f.body, fontSize: 11, color: c.muted2, marginTop: 2 },
  addBtn: { flex: 1, paddingVertical: 16, borderRadius: r.md, backgroundColor: c.moss, alignItems: 'center' },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { fontFamily: f.bodyBold, fontSize: 15, color: c.bg },
});
