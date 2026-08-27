import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
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
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import { walkers } from '../state/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const s = useAppState();

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

      <View style={styles.segRow}>
        <Segmented
          options={[{ label: 'Lista', value: 'lista' }, { label: 'Mapa', value: 'mapa' }]}
          value={s.discoverView}
          onChange={(v) => s.setDiscoverView(v as 'lista' | 'mapa')}
        />
      </View>

      {s.discoverView === 'mapa' && <MapMock />}

      <ScrollView contentContainerStyle={styles.list}>
        {walkers.map((w) => (
          <Card
            key={w.id}
            row
            elevation="sm"
            onPress={() => navigation.navigate('WalkerProfile', { walkerId: w.id })}
          >
            <ImagePlaceholder label="Foto" style={styles.walkerPhoto} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.nameRow}>
                <CardTitle style={{ fontSize: 15 }}>{w.name}</CardTitle>
                <Tag variant="accent" style={{ paddingVertical: 1, paddingHorizontal: 6 }}>
                  {w.rating} ★
                </Tag>
              </View>
              <CardBody style={{ margin: 0 }}>{w.distance} · {w.price}</CardBody>
              <Tag variant="outline" style={{ paddingVertical: 1, paddingHorizontal: 6 }}>
                {w.badge}
              </Tag>
            </View>
          </Card>
        ))}
      </ScrollView>

      <BottomTabBar items={['Inicio', 'Reservas', 'Mensajes', 'Perfil']} activeIndex={0} />
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
  segRow: { paddingHorizontal: space.s4, paddingBottom: space.s2 },
  list: { paddingHorizontal: space.s4, gap: space.s3, paddingBottom: space.s4 },
  walkerPhoto: { width: 56, height: 56, marginRight: space.s3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
