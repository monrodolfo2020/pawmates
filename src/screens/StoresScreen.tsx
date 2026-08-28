import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Store } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import { CardTitle, CardMeta, CardBody } from '../components/CardText';
import Tag from '../components/Tag';
import BottomTabBar from '../components/BottomTabBar';
import { api, StorefrontListing } from '../api/client';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Stores'>;

export default function StoresScreen({ navigation }: Props) {
  const s = useAppState();
  const [stores, setStores] = useState<StorefrontListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!s.token) return;
    api
      .listStorefronts(s.token)
      .then(setStores)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar las tiendas.'));
  }, [s.token]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.kicker}>PawMates Commerce</Text>
        <Text style={styles.title}>Tiendas de paseadores</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {error && (
          <Card>
            <CardBody style={{ color: colors.accent }}>{error}</CardBody>
          </Card>
        )}
        {stores?.length === 0 && (
          <CardMeta>Todavía no hay tiendas abiertas. Vuelve más tarde.</CardMeta>
        )}
        {stores?.map((store) => (
          <Card
            key={store.id}
            row
            elevation="sm"
            onPress={() => navigation.navigate('Storefront', { providerId: store.providerId })}
          >
            <View style={styles.icon}>
              <Store size={22} strokeWidth={1.5} color={colors.accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <CardTitle style={{ fontSize: 15 }}>{store.name}</CardTitle>
              {store.description && <CardBody style={{ margin: 0 }}>{store.description}</CardBody>}
              <Tag variant="outline" style={{ paddingVertical: 1, paddingHorizontal: 6 }}>
                {store.productCount} {store.productCount === 1 ? 'producto' : 'productos'}
              </Tag>
            </View>
          </Card>
        ))}
      </ScrollView>

      <BottomTabBar
        items={[
          { label: 'Inicio', onPress: () => navigation.navigate('Home') },
          { label: 'Reservas', onPress: () => navigation.navigate('Bookings') },
          { label: 'Tiendas', onPress: () => navigation.navigate('Stores') },
          { label: 'Perfil', onPress: () => navigation.navigate('Profile') },
        ]}
        activeIndex={2}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.s4, paddingTop: space.s4, paddingBottom: space.s2 },
  kicker: { fontFamily: fonts.body, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.accent },
  title: { fontFamily: fonts.heading, fontSize: 22, color: colors.text },
  list: { paddingHorizontal: space.s4, gap: space.s3, paddingTop: space.s2, paddingBottom: space.s4 },
  icon: {
    width: 48, height: 48, marginRight: space.s3, borderRadius: 0,
    backgroundColor: colors.accent100, alignItems: 'center', justifyContent: 'center',
  },
});
