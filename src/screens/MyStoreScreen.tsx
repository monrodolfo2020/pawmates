import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft, Store } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import TextField from '../components/TextField';
import Field from '../components/Field';
import Segmented from '../components/Segmented';
import Card from '../components/Card';
import { CardTitle, CardMeta, CardBody } from '../components/CardText';
import Tag from '../components/Tag';
import { api, CatalogItem, Product, ProductCategory, StorefrontDetail } from '../api/client';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'MyStore'>;

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  treat: 'Premio',
  toy: 'Juguete',
  accessory: 'Accesorio',
  service_addon: 'Extra',
  other: 'Otro',
};

const money = (cents: number, currency: string) => `$${(cents / 100).toFixed(2)} ${currency}`;

export default function MyStoreScreen({ navigation }: Props) {
  const s = useAppState();
  const [store, setStore] = useState<StorefrontDetail | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!s.token) return;
    api
      .getMyStorefront(s.token)
      .then(setStore)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar tu tienda.'));
  };

  useEffect(load, [s.token]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>Mi tienda</Text>
      </View>
      {error && (
        <View style={{ paddingHorizontal: space.s4 }}>
          <Card>
            <CardBody style={{ color: colors.accent }}>{error}</CardBody>
          </Card>
        </View>
      )}
      {store === undefined && !error && (
        <View style={{ padding: space.s4 }}>
          <CardMeta>Cargando…</CardMeta>
        </View>
      )}
      {store === null && (
        <View style={styles.body}>
          <Store size={32} strokeWidth={1.5} color={colors.accent} />
          <Text style={styles.h5}>Todavía no tienes tienda</Text>
          <CardBody>
            Por ahora, el administrador de la plataforma es quien crea la tienda de cada
            paseador. Pídele que la abra para tu cuenta — en cuanto lo haga, la verás aquí.
          </CardBody>
        </View>
      )}
      {store && <StoreManager store={store} onChange={load} navigation={navigation} />}
    </ScreenContainer>
  );
}

function StoreManager({
  store,
  onChange,
  navigation,
}: {
  store: StorefrontDetail;
  onChange: () => void;
  navigation: Props['navigation'];
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.row}>
        <Text style={styles.h5}>{store.name}</Text>
        <Tag variant={store.isActive ? 'accent' : 'outline'}>{store.isActive ? 'Activa' : 'Inactiva'}</Tag>
      </View>
      {store.description && <CardBody>{store.description}</CardBody>}

      <Button variant="secondary" blueprint block onPress={() => navigation.navigate('Orders', { mode: 'sales', title: 'Pedidos recibidos' })}>
        Ver pedidos recibidos
      </Button>

      <View style={{ gap: space.s2 }}>
        <View style={styles.row}>
          <Text style={styles.h5}>Productos ({store.products.length})</Text>
          <Button variant="ghost" onPress={() => setShowPicker((v) => !v)}>
            {showPicker ? 'Cerrar catálogo' : '+ Agregar del catálogo'}
          </Button>
        </View>

        {showPicker && (
          <CatalogPicker
            alreadyListed={new Set(store.products.map((p) => p.catalogItemId).filter(Boolean) as string[])}
            onAdded={onChange}
          />
        )}

        {store.products.map((p) => (
          <ProductRow key={p.id} product={p} onChange={onChange} />
        ))}
      </View>
    </ScrollView>
  );
}

function CatalogPicker({ alreadyListed, onAdded }: { alreadyListed: Set<string>; onAdded: () => void }) {
  const s = useAppState();
  const [catalog, setCatalog] = useState<CatalogItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');

  useEffect(() => {
    if (!s.token) return;
    api
      .listCatalog(s.token)
      .then(setCatalog)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo.'));
  }, [s.token]);

  const filtered = useMemo(() => {
    if (!catalog) return [];
    const q = search.trim().toLowerCase();
    return catalog.filter(
      (c) =>
        !alreadyListed.has(c.id) &&
        (category === 'all' || c.category === category) &&
        (q === '' || c.name.toLowerCase().includes(q)),
    );
  }, [catalog, search, category, alreadyListed]);

  return (
    <Card>
      <TextField label="Buscar" value={search} onChangeText={setSearch} placeholder="Correa, galletas, pelota…" />
      <Field label="Categoría">
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
      </Field>
      {error && <CardBody style={{ color: colors.accent }}>{error}</CardBody>}
      <CardMeta>{filtered.length} disponibles</CardMeta>
      <View style={{ gap: space.s2, maxHeight: 360 }}>
        <ScrollView>
          {filtered.map((c) => (
            <CatalogRow key={c.id} item={c} onAdded={onAdded} />
          ))}
        </ScrollView>
      </View>
    </Card>
  );
}

function CatalogRow({ item, onAdded }: { item: CatalogItem; onAdded: () => void }) {
  const s = useAppState();
  const [stock, setStock] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!s.token) return;
    setAdding(true);
    setError(null);
    try {
      await api.addProduct(s.token, {
        catalogItemId: item.id,
        stockQuantity: stock ? Number(stock) : undefined,
      });
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={styles.catalogRow}>
      <View style={{ flex: 1 }}>
        <CardBody style={{ margin: 0 }}>{item.name}</CardBody>
        <CardMeta>
          {CATEGORY_LABEL[item.category]} · {money(item.suggestedPrice.amount, item.suggestedPrice.currency)}
        </CardMeta>
        {error && <CardMeta style={{ color: colors.accent }}>{error}</CardMeta>}
      </View>
      <View style={{ width: 60 }}>
        <TextField label="" value={stock} onChangeText={setStock} placeholder="Stock" keyboardType="number-pad" />
      </View>
      <Button variant="secondary" disabled={adding} onPress={handleAdd}>
        {adding ? '…' : '+'}
      </Button>
    </View>
  );
}

function ProductRow({ product, onChange }: { product: Product; onChange: () => void }) {
  const s = useAppState();
  const [busy, setBusy] = useState(false);

  const toggleActive = async () => {
    if (!s.token) return;
    setBusy(true);
    try {
      await api.updateProduct(s.token, product.id, { isActive: !product.isActive });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <View style={styles.row}>
        <CardTitle style={{ fontSize: 15 }}>{product.name}</CardTitle>
        <Tag variant={product.isActive ? 'accent' : 'outline'}>{product.isActive ? 'Activo' : 'Inactivo'}</Tag>
      </View>
      <View style={styles.row}>
        <Text style={styles.price}>{money(product.price.amount, product.price.currency)}</Text>
        <CardMeta>{product.stockQuantity === null ? 'Ilimitado' : `${product.stockQuantity} en stock`}</CardMeta>
      </View>
      <Button variant="secondary" disabled={busy} onPress={toggleActive}>
        {product.isActive ? 'Desactivar' : 'Activar'}
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
  },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  body: { paddingHorizontal: space.s4, gap: space.s3, paddingBottom: space.s4 },
  h5: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  catalogRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.s2, paddingVertical: 6 },
});
