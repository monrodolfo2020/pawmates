import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import { Plus, Search } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Segmented from '../components/Segmented';
import Card from '../components/Card';
import { CardTitle, CardBody } from '../components/CardText';
import Tag from '../components/Tag';
import ImagePlaceholder from '../components/ImagePlaceholder';
import AppNav from '../components/AppNav';
import MapMock from '../components/MapMock';
import {
  api,
  CATEGORY_LABELS,
  CATEGORY_LABELS_SINGULAR,
  ProviderListing,
  SERVICE_CATEGORIES,
  ServiceCategory,
} from '../api/client';
import { colors, fonts, radius, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const MAP_POSITIONS = [
  { top: 34, left: 28 },
  { top: 58, left: 52 },
  { top: 22, left: 66 },
];

const money = (cents: number, currency: string) => '$' + (cents / 100).toFixed(0) + ' ' + currency;

export default function HomeScreen({ navigation }: Props) {
  const s = useAppState();
  const [providers, setProviders] = useState<ProviderListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<ServiceCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  // The directory is public — a guest who was sent a link should be able
  // to browse it and only hit the login wall when they try to book.
  const authed = s.authStatus === 'authed';

  useEffect(() => {
    setProviders(null);
    api
      .listProviders(s.token, category === 'all' ? undefined : category)
      .then(setProviders)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los servicios.'));
  }, [s.token, category]);

  // Search stays client-side on the already-loaded category: instant, and
  // the directory is small enough that a round trip per keystroke would
  // only make it feel slower.
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!providers || q === '') return providers;
    return providers.filter((p) =>
      [p.name, p.serviceArea, p.specialty, CATEGORY_LABELS_SINGULAR[p.category]]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q)),
    );
  }, [providers, search]);

  return (
    <ScreenContainer>
      <AppNav
        items={[
          { label: 'Inicio', onPress: () => navigation.navigate('Home') },
          { label: 'Reservas', onPress: () => navigation.navigate(authed ? 'Bookings' : 'Login') },
          { label: 'Perfil', onPress: () => navigation.navigate(authed ? 'Profile' : 'Login') },
        ]}
        activeIndex={0}
      />
      <View style={styles.header}>
        <View>
          {authed && <Text style={styles.kicker}>Hola, {s.name ?? s.email ?? ''}</Text>}
          <Text style={styles.title}>Servicios para tu mascota</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
          {s.roles.includes('admin') && (
            <Pressable onPress={() => navigation.navigate('Admin')}>
              <Tag variant="outline">Admin</Tag>
            </Pressable>
          )}
          {s.roles.includes('provider') && (
            <Pressable onPress={() => navigation.navigate('Dashboard')}>
              <Tag variant="outline">Mi negocio</Tag>
            </Pressable>
          )}
          {authed ? (
            <Pressable onPress={() => void s.logout()}>
              <Tag variant="outline">Salir</Tag>
            </Pressable>
          ) : (
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Tag variant="accent">Iniciar sesión</Tag>
            </Pressable>
          )}
        </View>
      </View>

      {s.pets.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petsRow} contentContainerStyle={styles.petsRowContent}>
          {s.pets.map((pet) => (
            // 'Onboarding' also serves as the per-pet edit form — see
            // that screen's comment on its three modes.
            <Pressable
              key={pet.id}
              style={styles.petItem}
              onPress={() => navigation.navigate('Onboarding', { petId: pet.id })}
            >
              {pet.photo ? (
                <Image source={{ uri: pet.photo }} style={styles.petPhoto} resizeMode="cover" />
              ) : (
                <ImagePlaceholder label="Foto" style={styles.petPhoto} />
              )}
              <Text style={styles.petName} numberOfLines={1}>{pet.name}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.petItem} onPress={() => navigation.navigate('Onboarding')}>
            <View style={styles.addPetPhoto}>
              <Plus size={20} strokeWidth={1.5} color={colors.accent} />
            </View>
            <Text style={styles.petName} numberOfLines={1}>Agregar</Text>
          </Pressable>
        </ScrollView>
      )}

      <View style={styles.searchBox}>
        <Search size={16} strokeWidth={2} color={colors.textMuted50} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Busca veterinaria, estética, paseador…"
          placeholderTextColor={colors.textMuted50}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}
        contentContainerStyle={styles.chipsRowContent}
      >
        {(['all', ...SERVICE_CATEGORIES] as const).map((c) => (
          <Pressable key={c} onPress={() => setCategory(c)}>
            <Tag variant={category === c ? 'accent' : 'outline'}>
              {c === 'all' ? 'Todos' : CATEGORY_LABELS[c]}
            </Tag>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.segRow}>
        <Segmented
          options={[{ label: 'Lista', value: 'lista' }, { label: 'Mapa', value: 'mapa' }]}
          value={s.discoverView}
          onChange={(v) => s.setDiscoverView(v as 'lista' | 'mapa')}
        />
      </View>

      {s.discoverView === 'mapa' && results && results.length > 0 && (
        <MapMock
          pins={results.map((p, i) => ({
            id: p.accountId,
            name: p.name.split(' ')[0],
            top: MAP_POSITIONS[i % MAP_POSITIONS.length].top,
            left: MAP_POSITIONS[i % MAP_POSITIONS.length].left,
            onPress: () => navigation.navigate('Business', { providerId: p.accountId }),
          }))}
        />
      )}

      <ScrollView contentContainerStyle={styles.list}>
        {error && (
          <Card>
            <CardBody style={{ color: colors.accent }}>{error}</CardBody>
          </Card>
        )}
        {results?.length === 0 && (
          <CardBody>
            {search.trim()
              ? 'Ningún negocio coincide con tu búsqueda.'
              : 'Todavía no hay negocios publicados en esta categoría. Vuelve pronto.'}
          </CardBody>
        )}
        {results?.map((p) => (
          <Card
            key={p.accountId}
            row
            elevation="sm"
            onPress={() => navigation.navigate('Business', { providerId: p.accountId })}
          >
            {p.photo ? (
              <Image source={{ uri: p.photo }} style={styles.businessPhoto} resizeMode="cover" />
            ) : (
              <ImagePlaceholder label="Foto" style={styles.businessPhoto} />
            )}
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.nameRow}>
                <CardTitle style={{ fontSize: 15 }}>{p.name}</CardTitle>
                {(p.emailVerified || p.identityVerified) && (
                  <Tag variant="accent" style={{ paddingVertical: 1, paddingHorizontal: 6 }}>
                    Verificado ✓
                  </Tag>
                )}
              </View>
              <CardBody style={{ margin: 0 }}>
                {p.serviceArea ?? 'Zona sin especificar'}
                {p.price ? ` · ${money(p.price.amount, p.price.currency)}/paseo` : ''}
              </CardBody>
              <View style={styles.tagsRow}>
                <Tag variant="outline" style={{ paddingVertical: 1, paddingHorizontal: 6 }}>
                  {CATEGORY_LABELS_SINGULAR[p.category]}
                </Tag>
                {p.specialty && (
                  <Tag variant="outline" style={{ paddingVertical: 1, paddingHorizontal: 6 }}>
                    {p.specialty}
                  </Tag>
                )}
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s4, paddingTop: space.s4, paddingBottom: space.s2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  kicker: { fontFamily: fonts.body, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.accent },
  title: { fontFamily: fonts.heading, fontSize: 22, color: colors.text },
  petsRow: { flexGrow: 0 },
  petsRowContent: { paddingHorizontal: space.s4, gap: space.s3, paddingBottom: space.s2 },
  petItem: { alignItems: 'center', gap: 4, width: 56 },
  petPhoto: { width: 48, height: 48, borderWidth: 1, borderColor: colors.divider },
  addPetPhoto: {
    width: 48, height: 48, borderWidth: 1, borderColor: colors.accent, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  petName: { fontFamily: fonts.body, fontSize: 11, color: colors.text, opacity: 0.8 },
  searchBox: {
    marginHorizontal: space.s4, marginBottom: space.s2,
    flexDirection: 'row', alignItems: 'center', gap: space.s2,
    paddingHorizontal: space.s3, minHeight: 42,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, borderRadius: radius.pill,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.text, paddingVertical: 10 },
  chipsRow: { flexGrow: 0 },
  chipsRowContent: { paddingHorizontal: space.s4, gap: 6, paddingBottom: space.s2 },
  segRow: { paddingHorizontal: space.s4, paddingBottom: space.s2 },
  list: { paddingHorizontal: space.s4, gap: space.s3, paddingBottom: space.s4 },
  businessPhoto: { width: 56, height: 56, marginRight: space.s3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
});
