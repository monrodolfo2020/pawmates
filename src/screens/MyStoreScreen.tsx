import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
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
import { api, Product, ProductCategory, StorefrontDetail } from '../api/client';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'MyStore'>;

const CATEGORY_OPTIONS: { label: string; value: ProductCategory }[] = [
  { label: 'Premio', value: 'treat' },
  { label: 'Juguete', value: 'toy' },
  { label: 'Accesorio', value: 'accessory' },
  { label: 'Extra', value: 'service_addon' },
  { label: 'Otro', value: 'other' },
];

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
        <OpenStorefrontForm
          onOpened={() => {
            setError(null);
            load();
          }}
        />
      )}
      {store && <StoreManager store={store} onChange={load} navigation={navigation} />}
    </ScreenContainer>
  );
}

function OpenStorefrontForm({ onOpened }: { onOpened: () => void }) {
  const s = useAppState();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!s.token) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.openStorefront(s.token, { name, description: description || undefined });
      onOpened();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la tienda.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.h5}>Abre tu tienda</Text>
      <CardBody>
        Vende premios, juguetes y accesorios directamente a tus clientes — se entregan en su
        próximo paseo contigo.
      </CardBody>
      <TextField label="Nombre de la tienda" value={name} onChangeText={setName} placeholder="Snacks de Camila" />
      <TextField
        label="Descripción (opcional)"
        value={description}
        onChangeText={setDescription}
        placeholder="Premios y accesorios para perros felices"
      />
      {error && (
        <Card>
          <CardBody style={{ color: colors.accent }}>{error}</CardBody>
        </Card>
      )}
      <Button variant="primary" blueprint block disabled={submitting || name.length < 2} onPress={handleSubmit}>
        {submitting ? 'Abriendo…' : 'Abrir tienda'}
      </Button>
    </ScrollView>
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
  const [showForm, setShowForm] = useState(false);

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
          <Button variant="ghost" onPress={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancelar' : '+ Agregar'}
          </Button>
        </View>

        {showForm && (
          <AddProductForm
            onAdded={() => {
              setShowForm(false);
              onChange();
            }}
          />
        )}

        {store.products.map((p) => (
          <ProductRow key={p.id} product={p} onChange={onChange} />
        ))}
      </View>
    </ScrollView>
  );
}

function AddProductForm({ onAdded }: { onAdded: () => void }) {
  const s = useAppState();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState<ProductCategory>('treat');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceAmount = Math.round(Number(price.replace(',', '.')) * 100);
  const canSubmit = name.length >= 2 && priceAmount > 0;

  const handleSubmit = async () => {
    if (!s.token) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.addProduct(s.token, {
        name,
        description: description || undefined,
        priceAmount,
        priceCurrency: 'USD',
        stockQuantity: stock ? Number(stock) : undefined,
        category,
      });
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar el producto.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <TextField label="Nombre" value={name} onChangeText={setName} placeholder="Galletas de pollo" />
      <TextField label="Descripción (opcional)" value={description} onChangeText={setDescription} placeholder="Bolsa de 200g" />
      <View style={{ flexDirection: 'row', gap: space.s3 }}>
        <View style={{ flex: 1 }}>
          <TextField label="Precio (USD)" value={price} onChangeText={setPrice} placeholder="8.50" keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Stock (vacío = ilimitado)" value={stock} onChangeText={setStock} placeholder="20" keyboardType="number-pad" />
        </View>
      </View>
      <Field label="Categoría">
        <Segmented options={CATEGORY_OPTIONS} value={category} onChange={(v) => setCategory(v as ProductCategory)} />
      </Field>
      {error && <CardBody style={{ color: colors.accent }}>{error}</CardBody>}
      <Button variant="primary" blueprint block disabled={submitting || !canSubmit} onPress={handleSubmit}>
        {submitting ? 'Guardando…' : 'Agregar producto'}
      </Button>
    </Card>
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
});
