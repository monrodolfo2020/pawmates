import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, TextInput, ScrollView, StyleSheet, Pressable } from 'react-native';
import { ShoppingBag, Search } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import BottomTabBar from '../components/BottomTabBar';
import { api, Product, ProductCategory, StorefrontDetail } from '../api/client';
import { vividColors as c, vividFonts as f, vividRadius as r, vividTintFor as tintForRaw } from '../theme/vividTokens';
import { useAppState } from '../state/AppState';

const tintFor = (seed: string) => tintForRaw(seed).bg;

type Props = NativeStackScreenProps<RootStackParamList, 'Storefront'>;

const money = (cents: number, currency: string) => '$' + (cents / 100).toFixed(2).replace(/\.00$/, '') + ' ' + currency;

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  treat: 'Premios',
  toy: 'Juguetes',
  accessory: 'Accesorios',
  service_addon: 'Extras',
  other: 'Otros',
};
const CATEGORY_BLURB: Record<ProductCategory, string> = {
  treat: 'Galletas, snacks',
  toy: 'Mordederas, pelotas',
  accessory: 'Correas, camas, aseo',
  service_addon: 'Extras del paseo',
  other: 'Suplementos, salud',
};

export default function StorefrontScreen({ navigation, route }: Props) {
  const s = useAppState();
  const { providerId } = route.params;
  const [store, setStore] = useState<StorefrontDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    api
      .getStorefront(s.token, providerId)
      .then(setStore)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la tienda.'));
  }, [s.token, providerId]);

  const products = store?.products ?? [];
  const cartCount = Object.values(s.cart).reduce((a, b) => a + b, 0);

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<ProductCategory, number>> = {};
    for (const p of products) counts[p.category] = (counts[p.category] ?? 0) + 1;
    return counts;
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) => (category === 'all' || p.category === category) && (q === '' || p.name.toLowerCase().includes(q)),
    );
  }, [products, search, category]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const addOne = (p: Product) => {
    s.setCartQty(p.id, (s.cart[p.id] ?? 0) + 1);
    showToast(p.name + ' agregado');
  };

  return (
    <ScreenContainer>
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.body} style={styles.scroll}>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>PawMates Commerce</Text>
              <Text style={styles.title}>{store?.name ?? 'Tienda'}</Text>
            </View>
            <Pressable style={styles.cartBtn} onPress={() => navigation.navigate('Cart', { providerId })}>
              <ShoppingBag size={19} strokeWidth={1.6} color={c.ink} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Search size={16} strokeWidth={2} color={c.muted2} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar comida, juguetes, extras"
              placeholderTextColor={c.muted2}
              style={styles.searchInput}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          {store?.description && <Text style={styles.description}>{store.description}</Text>}

          <Text style={styles.sectionTitle}>Comprar por categoría</Text>
          <View style={styles.categoryGrid}>
            <Pressable
              style={[styles.categoryTile, category === 'all' && styles.categoryTileActive]}
              onPress={() => setCategory('all')}
            >
              <Text style={styles.categoryLabel}>Todas</Text>
              <Text style={styles.categoryCount}>{products.length} productos</Text>
            </Pressable>
            {(Object.keys(CATEGORY_LABEL) as ProductCategory[]).map((cat) => (
              <Pressable
                key={cat}
                style={[styles.categoryTile, category === cat && styles.categoryTileActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={styles.categoryLabel}>{CATEGORY_LABEL[cat]}</Text>
                <Text style={styles.categoryCount}>{categoryCounts[cat] ?? 0} · {CATEGORY_BLURB[cat]}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>
              {category === 'all' ? 'Todo el catálogo' : CATEGORY_LABEL[category]}
            </Text>
            <Text style={styles.mutedSmall}>{filtered.length} productos</Text>
          </View>

          {products.length === 0 ? (
            <Text style={styles.mutedBody}>Esta tienda todavía no tiene productos.</Text>
          ) : filtered.length === 0 ? (
            <Text style={styles.mutedBody}>Ningún producto coincide con tu búsqueda.</Text>
          ) : (
            <View style={styles.grid}>
              {filtered.map((p) => (
                <ProductTile
                  key={p.id}
                  product={p}
                  onOpen={() => navigation.navigate('ProductDetail', { providerId, productId: p.id })}
                  onAdd={() => addOne(p)}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {toast && (
          <View style={styles.toast}>
            <View style={styles.toastDot} />
            <Text style={styles.toastText}>{toast}</Text>
            <Pressable onPress={() => navigation.navigate('Cart', { providerId })}>
              <Text style={styles.toastAction}>Ver carrito</Text>
            </Pressable>
          </View>
        )}

        <BottomTabBar
          items={[
            { label: 'Inicio', onPress: () => navigation.navigate(s.authStatus === 'authed' ? 'Home' : 'Login') },
            { label: 'Reservas', onPress: () => navigation.navigate(s.authStatus === 'authed' ? 'Bookings' : 'Login') },
            { label: 'Tienda', onPress: () => navigation.navigate('Stores') },
            { label: 'Perfil', onPress: () => navigation.navigate(s.authStatus === 'authed' ? 'Profile' : 'Login') },
          ]}
          activeIndex={2}
        />
      </View>
    </ScreenContainer>
  );
}

function ProductTile({ product, onOpen, onAdd }: { product: Product; onOpen: () => void; onAdd: () => void }) {
  const photo = product.photos[0] ?? null;
  const tint = tintFor(product.id);
  return (
    <View style={styles.tile}>
      <Pressable onPress={onOpen}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.tileImage} resizeMode="cover" />
        ) : (
          <View style={[styles.tileImage, { backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.tileInitial}>{product.name[0]}</Text>
          </View>
        )}
      </Pressable>
      <View style={styles.tileBody}>
        <Text style={styles.tileBrand}>{CATEGORY_LABEL[product.category]}</Text>
        <Text style={styles.tileName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.tilePrice}>{money(product.price.amount, product.price.currency)}</Text>
          <Pressable style={styles.addBtn} onPress={onAdd}>
            <Text style={styles.addBtnText}>+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  scroll: { flex: 1, backgroundColor: c.bg },
  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 4 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  kicker: { fontFamily: f.bodySemiBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: c.muted2 },
  title: { fontFamily: f.display, fontSize: 32, color: c.ink, marginTop: 4 },
  cartBtn: {
    width: 42, height: 42, borderRadius: r.pill, borderWidth: 1, borderColor: c.line,
    backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  cartBadge: {
    position: 'absolute', top: -3, right: -3, minWidth: 19, height: 19, borderRadius: r.pill,
    backgroundColor: c.rose, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
    borderWidth: 2, borderColor: c.bg,
  },
  cartBadgeText: { fontFamily: f.bodyBold, fontSize: 11, color: '#fff' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13,
    borderRadius: r.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, marginBottom: 20,
  },
  searchInput: { flex: 1, fontFamily: f.body, fontSize: 15, color: c.ink, padding: 0 },
  error: { fontFamily: f.body, fontSize: 13, color: c.rose, marginBottom: 12 },
  description: { fontFamily: f.body, fontSize: 13.5, color: c.mute, marginBottom: 20, lineHeight: 19 },
  sectionTitle: { fontFamily: f.display, fontSize: 21, color: c.ink, marginBottom: 10 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  categoryTile: {
    width: '47.5%', padding: 14, borderRadius: r.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface,
  },
  categoryTileActive: { borderColor: c.coral, backgroundColor: c.mintTint },
  categoryLabel: { fontFamily: f.bodySemiBold, fontSize: 14.5, color: c.ink },
  categoryCount: { fontFamily: f.body, fontSize: 11.5, color: c.mute, marginTop: 3 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mutedSmall: { fontFamily: f.body, fontSize: 12, color: c.muted2 },
  mutedBody: { fontFamily: f.body, fontSize: 13.5, color: c.mute },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 13 },
  tile: { width: '47%', backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: r.lg, overflow: 'hidden' },
  tileImage: { width: '100%', aspectRatio: 1.1 },
  tileInitial: { fontFamily: f.display, fontSize: 44, color: 'rgba(23,26,21,0.22)' },
  tileBody: { padding: 12, gap: 3 },
  tileBrand: { fontFamily: f.bodySemiBold, fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase', color: c.muted2 },
  tileName: { fontFamily: f.bodySemiBold, fontSize: 13.5, lineHeight: 17, color: c.ink, minHeight: 34 },
  tilePrice: { fontFamily: f.display, fontSize: 19, color: c.ink },
  addBtn: { width: 28, height: 28, borderRadius: r.pill, backgroundColor: c.coral, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 17, lineHeight: 17, fontFamily: f.body },
  toast: {
    position: 'absolute', left: 16, right: 16, bottom: 96, padding: 14, borderRadius: r.md,
    backgroundColor: c.ink, flexDirection: 'row', alignItems: 'center', gap: 11,
  },
  toastDot: { width: 7, height: 7, borderRadius: r.pill, backgroundColor: c.rose },
  toastText: { flex: 1, fontFamily: f.bodyMedium, fontSize: 13.5, color: c.bg },
  toastAction: { fontFamily: f.bodyBold, fontSize: 13.5, color: c.rose },
});
