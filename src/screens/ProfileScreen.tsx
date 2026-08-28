import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import Card from '../components/Card';
import { CardKicker, CardTitle, CardMeta } from '../components/CardText';
import Tag from '../components/Tag';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ROLE_LABEL: Record<string, string> = {
  owner: 'Dueño de mascota',
  provider: 'Paseador',
  admin: 'Administrador',
};

export default function ProfileScreen({ navigation }: Props) {
  const s = useAppState();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>Perfil</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Card>
          <CardKicker>Cuenta</CardKicker>
          <CardTitle>{s.name ?? 'Sin nombre'}</CardTitle>
          <CardMeta>{s.email}</CardMeta>
          <View style={styles.wrapRow}>
            {s.roles.map((r) => (
              <Tag key={r} variant="outline">{ROLE_LABEL[r] ?? r}</Tag>
            ))}
          </View>
        </Card>

        {s.roles.includes('owner') && s.pets.length > 0 && (
          <Card>
            <CardKicker>Tus mascotas</CardKicker>
            {s.pets.map((p) => (
              <CardMeta key={p.id}>{p.name} · {p.breed} · {p.size}</CardMeta>
            ))}
          </Card>
        )}

        <View style={{ gap: space.s2 }}>
          {s.roles.includes('provider') && (
            <Button variant="secondary" blueprint block onPress={() => navigation.navigate('Dashboard')}>
              Modo paseador
            </Button>
          )}
          {s.roles.includes('owner') && (
            <Button variant="secondary" blueprint block onPress={() => navigation.navigate('Home')}>
              Modo dueño
            </Button>
          )}
          {s.roles.includes('admin') && (
            <Button variant="secondary" blueprint block onPress={() => navigation.navigate('Admin')}>
              Panel de administrador
            </Button>
          )}
          <Button variant="primary" blueprint block onPress={() => void s.logout()}>
            Salir
          </Button>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
  },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  body: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s4 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
