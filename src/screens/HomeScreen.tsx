import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Segmented from '../components/Segmented';
import Card from '../components/Card';
import { CardTitle, CardBody } from '../components/CardText';
import Tag from '../components/Tag';
import ImagePlaceholder from '../components/ImagePlaceholder';
import BottomTabBar from '../components/BottomTabBar';
import MapMock from '../components/MapMock';
import { api, ProviderListing } from '../api/client';
import { colors, fonts, space } from '../theme/tokens';
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

  useEffect(() => {
    api
      .listProviders(s.token)
      .then(setProviders)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los paseadores.'));
  }, [s.token]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Hola, {s.name ?? s.email ?? ''}</Text>
          <Text style={styles.title}>Paseadores cerca de ti</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
          {s.roles.includes('admin') && (
            <Pressable onPress={() => navigation.navigate('Admin')}>
              <Tag variant="outline">Admin</Tag>
            </Pressable>
          )}
          {s.roles.includes('provider') && (
            <Pressable onPress={() => navigation.navigate('Dashboard')}>
              <Tag variant="outline">Modo paseador</Tag>
            </Pressable>
          )}
          <Pressable onPress={() => void s.logout()}>
            <Tag variant="outline">Salir</Tag>
          </Pressable>
        </View>
      </View>

      {s.pets.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petsRow} contentContainerStyle={styles.petsRowContent}>
          {s.pets.map((pet) => (
            // 'Onboarding' also serves as the edit form once a pet
            // already exists — see that screen's comment.
            <Pressable key={pet.id} style={styles.petItem} onPress={() => navigation.navigate('Onboarding')}>
              {pet.photo ? (
                <Image source={{ uri: pet.photo }} style={styles.petPhoto} resizeMode="cover" />
              ) : (
                <ImagePlaceholder label="Foto" style={styles.petPhoto} />
              )}
              <Text style={styles.petName} numberOfLines={1}>{pet.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.segRow}>
        <Segmented
          options={[{ label: 'Lista', value: 'lista' }, { label: 'Mapa', value: 'mapa' }]}
          value={s.discoverView}
          onChange={(v) => s.setDiscoverView(v as 'lista' | 'mapa')}
        />
      </View>

      {s.discoverView === 'mapa' && providers && providers.length > 0 && (
        <MapMock
          pins={providers.map((p, i) => ({
            id: p.accountId,
            name: p.name.split(' ')[0],
            top: MAP_POSITIONS[i % MAP_POSITIONS.length].top,
            left: MAP_POSITIONS[i % MAP_POSITIONS.length].left,
            onPress: () => navigation.navigate('WalkerProfile', { walkerId: p.accountId }),
          }))}
        />
      )}

      <ScrollView contentContainerStyle={styles.list}>
        {error && (
          <Card>
            <CardBody style={{ color: colors.accent }}>{error}</CardBody>
          </Card>
        )}
        {providers?.length === 0 && (
          <CardBody>Todavía no hay paseadores publicados por aquí. Vuelve pronto.</CardBody>
        )}
        {providers?.map((p) => (
          <Card
            key={p.accountId}
            row
            elevation="sm"
            onPress={() => navigation.navigate('WalkerProfile', { walkerId: p.accountId })}
          >
            {p.photo ? (
              <Image source={{ uri: p.photo }} style={styles.walkerPhoto} resizeMode="cover" />
            ) : (
              <ImagePlaceholder label="Foto" style={styles.walkerPhoto} />
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
              {p.specialty && (
                <Tag variant="outline" style={{ paddingVertical: 1, paddingHorizontal: 6 }}>
                  {p.specialty}
                </Tag>
              )}
            </View>
          </Card>
        ))}
      </ScrollView>

      <BottomTabBar
        items={[
          { label: 'Inicio', onPress: () => navigation.navigate('Home') },
          { label: 'Reservas', onPress: () => navigation.navigate('Bookings') },
          { label: 'Tienda', onPress: () => navigation.navigate('Stores') },
          { label: 'Perfil', onPress: () => navigation.navigate('Profile') },
        ]}
        activeIndex={0}
      />
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
  avatar: { width: 40, height: 40 },
  petsRow: { flexGrow: 0 },
  petsRowContent: { paddingHorizontal: space.s4, gap: space.s3, paddingBottom: space.s2 },
  petItem: { alignItems: 'center', gap: 4, width: 56 },
  petPhoto: { width: 48, height: 48, borderWidth: 1, borderColor: colors.divider },
  petName: { fontFamily: fonts.body, fontSize: 11, color: colors.text, opacity: 0.8 },
  segRow: { paddingHorizontal: space.s4, paddingBottom: space.s2 },
  list: { paddingHorizontal: space.s4, gap: space.s3, paddingBottom: space.s4 },
  walkerPhoto: { width: 56, height: 56, marginRight: space.s3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
