import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import ImagePlaceholder from '../components/ImagePlaceholder';
import Tag from '../components/Tag';
import { CardMeta } from '../components/CardText';
import { colors, fonts, space } from '../theme/tokens';
import { api, ProviderDetail } from '../api/client';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'WalkerProfile'>;

const money = (cents: number, currency: string) => '$' + (cents / 100).toFixed(0) + ' ' + currency;

export default function WalkerProfileScreen({ navigation, route }: Props) {
  const s = useAppState();
  const { walkerId } = route.params;
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getProvider(s.token, walkerId)
      .then(setProvider)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar este paseador.'));
  }, [s.token, walkerId]);

  const handleReservar = () => {
    if (s.authStatus !== 'authed') {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('Booking', { walkerId });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {error && <CardMeta style={{ color: colors.accent }}>{error}</CardMeta>}
        {!error && !provider && <CardMeta>Cargando…</CardMeta>}
        {provider && (
          <>
            {provider.photo ? (
              <Image source={{ uri: provider.photo }} style={styles.hero} resizeMode="cover" />
            ) : (
              <ImagePlaceholder label="Foto de perfil" style={styles.hero} />
            )}
            <View>
              <Text style={styles.name}>{provider.name}</Text>
              {provider.serviceArea && <CardMeta style={{ fontSize: 13, marginTop: 2 }}>{provider.serviceArea}</CardMeta>}
            </View>
            <View style={styles.badges}>
              {provider.emailVerified && <Tag variant="accent">Correo verificado ✓</Tag>}
              {provider.specialty && <Tag variant="accent">{provider.specialty}</Tag>}
              {provider.price && (
                <Tag variant="outline">{money(provider.price.amount, provider.price.currency)}/paseo</Tag>
              )}
            </View>
            {provider.bio && <Text style={styles.bio}>{provider.bio}</Text>}
            {provider.plansOffered && (
              <View style={{ gap: space.s2 }}>
                <Text style={styles.h5}>Planes y servicios</Text>
                <Text style={styles.bio}>{provider.plansOffered}</Text>
              </View>
            )}
            {provider.walkingSpots && (
              <View style={{ gap: space.s2 }}>
                <Text style={styles.h5}>Parques y sitios donde pasea</Text>
                <Text style={styles.bio}>{provider.walkingSpots}</Text>
              </View>
            )}
            <View style={styles.hr} />
            <View style={{ gap: space.s2 }}>
              <Text style={styles.h5}>Reseñas</Text>
              <CardMeta>Este paseador todavía no tiene reseñas.</CardMeta>
            </View>
          </>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button variant="secondary" blueprint style={{ flex: 1 }}>
          Meet &amp; Greet
        </Button>
        <Button variant="primary" blueprint style={{ flex: 1 }} onPress={handleReservar}>
          Reservar
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.s3, paddingVertical: space.s2 },
  scroll: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s4 },
  hero: { width: '100%', height: 150 },
  name: { fontFamily: fonts.heading, fontSize: 22, color: colors.text },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bio: { fontFamily: fonts.body, fontSize: 13, color: colors.text, opacity: 0.85 },
  hr: { height: 1, backgroundColor: colors.divider },
  h5: { fontFamily: fonts.heading, fontSize: 16, color: colors.text, marginBottom: space.s2 },
  footer: { flexDirection: 'row', gap: space.s2, padding: space.s4 },
});
