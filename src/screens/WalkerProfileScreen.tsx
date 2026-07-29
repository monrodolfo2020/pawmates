import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import ImagePlaceholder from '../components/ImagePlaceholder';
import Tag from '../components/Tag';
import Card from '../components/Card';
import { CardMeta, CardBody } from '../components/CardText';
import { colors, fonts, space } from '../theme/tokens';
import { reviews } from '../state/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'WalkerProfile'>;

// Mock content matches the design's single featured walker (Camila) — the
// prototype doesn't vary this screen per walker id.
export default function WalkerProfileScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ImagePlaceholder label="Video de presentación" style={styles.hero} />
        <View>
          <Text style={styles.name}>Camila Rodríguez</Text>
          <CardMeta style={{ fontSize: 13, marginTop: 2 }}>4.9 ★ · 128 reseñas · a 1.2 km</CardMeta>
        </View>
        <View style={styles.badges}>
          <Tag variant="accent">Identidad verificada</Tag>
          <Tag variant="accent">Seguro incluido</Tag>
          <Tag variant="outline">Primeros auxilios</Tag>
        </View>
        <Text style={styles.bio}>
          Paseadora de tiempo completo hace 3 años, especializada en perros grandes y energéticos.
          Paseos de 30/60 min, GPS y fotos incluidas.
        </Text>
        <View style={styles.hr} />
        <View style={{ gap: space.s2 }}>
          <Text style={styles.h5}>Reseñas verificadas</Text>
          {reviews.map((rv) => (
            <Card key={rv.name}>
              <CardMeta>{rv.name} · {rv.rating} ★</CardMeta>
              <CardBody>{rv.text}</CardBody>
            </Card>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button variant="secondary" blueprint style={{ flex: 1 }}>
          Meet &amp; Greet
        </Button>
        <Button
          variant="primary"
          blueprint
          style={{ flex: 1 }}
          onPress={() => navigation.navigate('Booking', { walkerId: 'w1' })}
        >
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
