import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import TextField from '../components/TextField';
import Field from '../components/Field';
import Segmented from '../components/Segmented';
import PhotoPicker from '../components/PhotoPicker';
import Card from '../components/Card';
import { CardKicker, CardTitle, CardBody, CardMeta } from '../components/CardText';
import Tag from '../components/Tag';
import {
  api,
  AdminAccount,
  AdminVerification,
  AdminStorefront,
  AdminOrder,
  AdminCatalogItem,
  OrderStatus,
  ProductCategory,
} from '../api/client';
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

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  treat: 'Premio',
  toy: 'Juguete',
  accessory: 'Accesorio',
  service_addon: 'Extra',
  other: 'Otro',
};

const money = (cents: number, currency: string) => `$${(cents / 100).toFixed(2)} ${currency}`;

type Section = 'cuentas' | 'verificaciones' | 'tiendas' | 'pedidos' | 'catalogo';

export default function AdminScreen({ navigation }: Props) {
  const s = useAppState();
  const [section, setSection] = useState<Section>('cuentas');
  const [accounts, setAccounts] = useState<AdminAccount[] | null>(null);
  const [verifications, setVerifications] = useState<AdminVerification[] | null>(null);
  const [storefronts, setStorefronts] = useState<AdminStorefront[] | null>(null);
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [catalog, setCatalog] = useState<AdminCatalogItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!s.token) return;
    Promise.all([
      api.adminListAccounts(s.token),
      api.adminListVerifications(s.token),
      api.adminListStorefronts(s.token),
      api.adminListOrders(s.token),
      api.adminListCatalog(s.token),
    ])
      .then(([a, v, st, o, c]) => {
        setAccounts(a);
        setVerifications(v);
        setStorefronts(st);
        setOrders(o);
        setCatalog(c);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el panel.'));
  };

  useEffect(load, [s.token]);

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
            { label: 'Verif.', value: 'verificaciones' },
            { label: 'Tiendas', value: 'tiendas' },
            { label: 'Pedidos', value: 'pedidos' },
            { label: 'Catálogo', value: 'catalogo' },
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

        {section === 'tiendas' && accounts && storefronts && (
          <TiendasSection accounts={accounts} storefronts={storefronts} onChange={load} />
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

        {section === 'catalogo' && catalog && <CatalogoSection catalog={catalog} onChange={load} />}
      </ScrollView>
    </ScreenContainer>
  );
}

function TiendasSection({
  accounts,
  storefronts,
  onChange,
}: {
  accounts: AdminAccount[];
  storefronts: AdminStorefront[];
  onChange: () => void;
}) {
  const s = useAppState();
  const [showForm, setShowForm] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storefrontProviderIds = new Set(storefronts.map((st) => st.providerId));
  const eligibleProviders = accounts.filter(
    (a) => a.roles.includes('provider') && !storefrontProviderIds.has(a.id),
  );

  const handleCreate = async () => {
    if (!s.token || !providerId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.openStorefront(s.token, { providerId, name, description: description || undefined });
      setShowForm(false);
      setProviderId(null);
      setName('');
      setDescription('');
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la tienda.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ gap: space.s2 }}>
      <View style={styles.row}>
        <Text style={styles.h5}>Tiendas ({storefronts.length})</Text>
        <Button variant="ghost" onPress={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : '+ Crear tienda'}
        </Button>
      </View>

      {showForm && (
        <Card>
          <CardMeta>Paseador ({eligibleProviders.length} sin tienda)</CardMeta>
          {eligibleProviders.length === 0 && (
            <CardBody>Todos los paseadores registrados ya tienen tienda.</CardBody>
          )}
          {eligibleProviders.map((p) => (
            <Pressable key={p.id} onPress={() => setProviderId(p.id)} style={styles.providerRow}>
              <Tag variant={providerId === p.id ? 'accent' : 'outline'}>{p.email}</Tag>
            </Pressable>
          ))}
          <TextField label="Nombre de la tienda" value={name} onChangeText={setName} placeholder="Snacks de Camila" />
          <TextField
            label="Descripción (opcional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Premios y accesorios para perros felices"
          />
          {error && <CardBody style={{ color: colors.accent }}>{error}</CardBody>}
          <Button
            variant="primary"
            blueprint
            block
            disabled={submitting || !providerId || name.length < 2}
            onPress={handleCreate}
          >
            {submitting ? 'Creando…' : 'Crear tienda'}
          </Button>
        </Card>
      )}

      {storefronts.length === 0 && <CardMeta>Todavía no hay tiendas abiertas.</CardMeta>}
      {storefronts.map((st) => (
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
  );
}

function CatalogoSection({ catalog, onChange }: { catalog: AdminCatalogItem[]; onChange: () => void }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [onlyMissingPhoto, setOnlyMissingPhoto] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter(
      (c) =>
        (category === 'all' || c.category === category) &&
        (q === '' || c.name.toLowerCase().includes(q)) &&
        (!onlyMissingPhoto || !c.photo),
    );
  }, [catalog, search, category, onlyMissingPhoto]);

  const withPhoto = catalog.filter((c) => c.photo).length;

  return (
    <View style={{ gap: space.s2 }}>
      <Text style={styles.h5}>
        Catálogo maestro ({catalog.length}) · {withPhoto} con foto
      </Text>
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
      <Pressable onPress={() => setOnlyMissingPhoto((v) => !v)}>
        <Tag variant={onlyMissingPhoto ? 'accent' : 'outline'}>Solo sin foto</Tag>
      </Pressable>
      {filtered.map((item) => (
        <CatalogItemRow key={item.id} item={item} onChange={onChange} />
      ))}
    </View>
  );
}

function CatalogItemRow({ item, onChange }: { item: AdminCatalogItem; onChange: () => void }) {
  const s = useAppState();
  const [busy, setBusy] = useState(false);

  const setPhoto = async (base64: string | null) => {
    if (!s.token || !base64) return;
    setBusy(true);
    try {
      await api.adminUpdateCatalogItem(s.token, item.id, { photo: base64 });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card row>
      <PhotoPicker
        uri={item.photo}
        onChange={(v) => setPhoto(v.base64)}
        style={styles.catalogPhoto}
        alertTitle="Foto del producto"
      />
      <View style={{ flex: 1, gap: 2 }}>
        <CardBody style={{ margin: 0 }}>{item.name}</CardBody>
        <CardMeta>
          {CATEGORY_LABEL[item.category]} · {money(item.suggestedPrice.amount, item.suggestedPrice.currency)}
        </CardMeta>
        {busy && <CardMeta>Guardando…</CardMeta>}
      </View>
    </Card>
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
  providerRow: { marginBottom: 2 },
  catalogPhoto: { width: 56, height: 56, marginRight: space.s3 },
});
