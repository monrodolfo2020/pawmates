import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import { ChevronRight, LocateFixed, MapPin, Plus, Search, ShieldCheck } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Tag from '../components/Tag';
import Avatar from '../components/Avatar';
import AppNav from '../components/AppNav';
import {
  api,
  CATEGORY_LABELS,
  CATEGORY_LABELS_SINGULAR,
  ProviderListing,
  SERVICE_CATEGORIES,
  ServiceCategory,
} from '../api/client';
import { colors, fonts, radius, space, type } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import Notice from '../components/Notice';
import { clearReservation, reservationSlug } from '../navigation/reservationIntent';
import { RatingLine } from '../components/Bones';
import { distanceKm, formatDistance, pointOf, sortByDistance } from '../utils/distance';
import { useMyLocation } from '../utils/useMyLocation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const money = (cents: number, currency: string) => '$' + (cents / 100).toFixed(0) + ' ' + currency;

/** Where to find a business: the area a walker covers, or the address
 * of a place you visit (a vet, a groomer). */
const where = (p: ProviderListing) => p.serviceArea ?? p.publicAddress;

export default function HomeScreen({ navigation, route }: Props) {
  const s = useAppState();
  const [providers, setProviders] = useState<ProviderListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<ServiceCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  // With the owner's location, nearest first by default; the best-rated
  // order is one tap away and is what everyone gets without a location.
  const [order, setOrder] = useState<'near' | 'rated'>('near');
  const here = useMyLocation({ askNow: route.params?.nearMe === true });
  // The directory is public — a guest who was sent a link should be able
  // to browse it and only hit the login wall when they try to book.
  const authed = s.authStatus === 'authed';

  // Signed in (or just signed up and added their pet) after following a
  // business's "Reservar en PawMates" link: take them back to it.
  useEffect(() => {
    const slug = reservationSlug();
    if (!authed || !slug) return;
    // Deferred a tick: on a fresh page load this screen mounts in the same
    // commit as the navigator, which ignores a navigate() that early.
    const timer = setTimeout(() => {
      clearReservation();
      navigation.navigate('Business', { slug });
    });
    return () => clearTimeout(timer);
  }, [authed, navigation]);

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
    const found =
      !providers || q === ''
        ? providers
        : providers.filter((p) =>
            [p.name, p.serviceArea, p.publicAddress, p.specialty, CATEGORY_LABELS_SINGULAR[p.category]]
              .filter(Boolean)
              .some((field) => field!.toLowerCase().includes(q)),
          );
    return found && here.point && order === 'near' ? sortByDistance(found, here.point) : found;
  }, [providers, search, here.point, order]);

  const distanceTo = (p: ProviderListing) => {
    const point = pointOf(p);
    return here.point && point ? formatDistance(distanceKm(here.point, point)) : null;
  };

  const nav = [
    { label: 'Inicio', onPress: () => navigation.navigate('Home') },
    { label: 'Reservas', onPress: () => navigation.navigate(authed ? 'Bookings' : 'Login') },
    { label: 'Perfil', onPress: () => navigation.navigate(authed ? 'Profile' : 'Login') },
    ...(s.roles.includes('provider') ? [{ label: 'Mi negocio', onPress: () => navigation.navigate('Dashboard') }] : []),
    ...(s.roles.includes('admin') ? [{ label: 'Admin', onPress: () => navigation.navigate('Admin') }] : []),
    ...(!authed ? [{ label: 'Iniciar sesión', onPress: () => navigation.navigate('Login') }] : []),
  ];

  return (
    <ScreenContainer>
      <AppNav items={nav} activeIndex={0} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          {authed && <Text style={type.kicker}>Hola, {firstName(s.name ?? s.email ?? '')}</Text>}
          <Text style={type.display}>Servicios para tu mascota</Text>
        </View>

        {s.pets.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petsRow}>
            {s.pets.map((pet) => (
              // 'Onboarding' also serves as the per-pet edit form — see
              // that screen's comment on its three modes.
              <Pressable
                key={pet.id}
                style={styles.petItem}
                onPress={() => navigation.navigate('Onboarding', { petId: pet.id })}
              >
                <Avatar name={pet.name} uri={pet.photo} size={52} />
                <Text style={styles.petName} numberOfLines={1}>{pet.name}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.petItem} onPress={() => navigation.navigate('Onboarding')}>
              <View style={styles.addPet}>
                <Plus size={20} strokeWidth={1.75} color={colors.textMuted} />
              </View>
              <Text style={styles.petName} numberOfLines={1}>Agregar</Text>
            </Pressable>
          </ScrollView>
        )}

        <View style={styles.searchBox}>
          <Search size={18} strokeWidth={1.75} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Busca veterinaria, estética, paseador…"
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {(['all', ...SERVICE_CATEGORIES] as const).map((c) => (
            <Tag key={c} variant={category === c ? 'accent' : 'outline'} onPress={() => setCategory(c)}>
              {c === 'all' ? 'Todos' : CATEGORY_LABELS[c]}
            </Tag>
          ))}
        </ScrollView>

        <View style={styles.locationRow}>
          {here.status === 'ready' ? (
            <>
              <Text style={styles.orderLabel}>Ordenar:</Text>
              <Tag variant={order === 'near' ? 'accent' : 'outline'} onPress={() => setOrder('near')}>
                Más cerca
              </Tag>
              <Tag variant={order === 'rated' ? 'accent' : 'outline'} onPress={() => setOrder('rated')}>
                Mejor calificados
              </Tag>
            </>
          ) : here.status === 'locating' ? (
            <Text style={styles.locationText}>Buscando tu ubicación…</Text>
          ) : here.status === 'denied' ? (
            <Text style={styles.locationText}>
              No tenemos permiso para ver tu ubicación. Puedes activarlo en la configuración de tu navegador o
              teléfono, o escribir tu colonia o ciudad en el buscador.
            </Text>
          ) : (
            <Pressable style={styles.locateBtn} onPress={here.request} accessibilityRole="button">
              <LocateFixed size={16} strokeWidth={2} color={colors.accent} />
              <Text style={styles.locateText}>
                {here.status === 'unavailable'
                  ? 'No pudimos obtener tu ubicación. Intentar de nuevo'
                  : 'Usar mi ubicación para ver los más cercanos'}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.list}>
          {error && <Notice tone="danger">{error}</Notice>}
          {results?.length === 0 && (
            <Notice>
              {search.trim()
                ? 'Ningún negocio coincide con tu búsqueda.'
                : 'Todavía no hay negocios publicados en esta categoría. Vuelve pronto.'}
            </Notice>
          )}
          {results?.map((p) => (
            <Card key={p.accountId} row onPress={() => navigation.navigate('Business', { providerId: p.accountId })}>
              <Avatar name={p.name} uri={p.photo} size={60} square />
              <View style={styles.cardText}>
                <Text style={styles.name} numberOfLines={2}>{p.name}</Text>
                <Text style={type.small} numberOfLines={1}>
                  {[CATEGORY_LABELS_SINGULAR[p.category], where(p)].filter(Boolean).join(' · ')}
                </Text>
                {p.specialty && (
                  <Text style={type.meta} numberOfLines={1}>{p.specialty}</Text>
                )}
                {p.rating && <RatingLine rating={p.rating} size={13} />}
                {distanceTo(p) && (
                  <View style={styles.distance}>
                    <MapPin size={13} strokeWidth={2} color={colors.accent} />
                    <Text style={styles.distanceText}>{distanceTo(p)}</Text>
                  </View>
                )}
                <View style={styles.cardFoot}>
                  {p.price && (
                    <Text style={styles.price}>
                      {money(p.price.amount, p.price.currency)}
                      <Text style={styles.priceUnit}> / paseo</Text>
                    </Text>
                  )}
                  {/* Only an admin-reviewed identity earns the badge; a verified
                      email says nothing an owner can rely on. */}
                  {p.identityVerified && (
                    <View style={styles.verified}>
                      <ShieldCheck size={14} strokeWidth={2} color={colors.success} />
                      <Text style={styles.verifiedText}>Identidad verificada</Text>
                    </View>
                  )}
                </View>
              </View>
              <ChevronRight size={18} strokeWidth={1.75} color={colors.textFaint} />
            </Card>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const firstName = (full: string) => full.split(/[\s@]/)[0];

const styles = StyleSheet.create({
  scroll: { paddingBottom: space.s8 },
  header: { paddingHorizontal: space.s4, paddingTop: space.s5, paddingBottom: space.s4, gap: space.s1 },
  petsRow: { paddingHorizontal: space.s4, gap: space.s3, paddingBottom: space.s4 },
  petItem: { alignItems: 'center', gap: space.s1, width: 60 },
  addPet: {
    width: 52, height: 52, borderRadius: radius.pill, backgroundColor: colors.panel,
    alignItems: 'center', justifyContent: 'center',
  },
  petName: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.textMuted },
  searchBox: {
    marginHorizontal: space.s4, marginBottom: space.s3,
    flexDirection: 'row', alignItems: 'center', gap: space.s2,
    paddingHorizontal: space.s4, minHeight: 48,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.text, paddingVertical: space.s3 },
  chipsRow: { paddingHorizontal: space.s4, gap: space.s2, paddingBottom: space.s4 },
  locationRow: {
    marginHorizontal: space.s4, marginBottom: space.s4,
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.s2,
  },
  orderLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted },
  locationText: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  locateBtn: { flexDirection: 'row', alignItems: 'center', gap: space.s2, paddingVertical: space.s1 },
  locateText: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.accent },
  distance: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distanceText: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.text },
  list: { paddingHorizontal: space.s4, gap: space.s3 },
  cardText: { flex: 1, gap: 2, minWidth: 0 },
  name: { fontFamily: fonts.display, fontSize: 22, lineHeight: 25, color: colors.text },
  cardFoot: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: space.s3, rowGap: 2, marginTop: space.s1 },
  price: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  priceUnit: { fontFamily: fonts.body, color: colors.textMuted },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.success },
});
