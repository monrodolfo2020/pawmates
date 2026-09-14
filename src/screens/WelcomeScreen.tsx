import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { PawPrint, ShoppingBag, ChevronRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import { colors, fonts, space } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <View style={styles.body}>
        <PawPrint size={40} strokeWidth={1.5} color={colors.accent} />
        <Text style={styles.title}>PawMates</Text>
        <Text style={styles.subtitle}>
          Encuentra paseadores de confianza para tu mascota, o regístrate como paseador y ofrece
          tus servicios.
        </Text>
        <Pressable style={styles.storeCard} onPress={() => navigation.navigate('Stores')}>
          <View style={styles.storeIcon}>
            <ShoppingBag size={22} strokeWidth={1.5} color={colors.accent} />
          </View>
          <View style={styles.storeText}>
            <Text style={styles.storeTitle}>Tienda PawMates</Text>
            <Text style={styles.storeSubtitle}>
              Comida, juguetes y accesorios — mira el catálogo, sin necesidad de cuenta
            </Text>
          </View>
          <ChevronRight size={20} strokeWidth={1.5} color={colors.textMuted70} />
        </Pressable>
      </View>
      <View style={styles.footer}>
        <Button
          variant="primary"
          block
          blueprint
          onPress={() => navigation.navigate('Signup', { role: 'owner' })}
        >
          Soy dueño de mascota — Registrarse
        </Button>
        <Button
          variant="secondary"
          block
          blueprint
          onPress={() => navigation.navigate('Signup', { role: 'provider' })}
        >
          Quiero ser paseador
        </Button>
        <Button variant="ghost" block onPress={() => navigation.navigate('Login')}>
          Ya tengo cuenta — iniciar sesión
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s3, paddingHorizontal: space.s6 },
  title: { fontFamily: fonts.heading, fontSize: 32, color: colors.text },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.text, opacity: 0.75, textAlign: 'center' },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
    width: '100%',
    marginTop: space.s3,
    padding: space.s3,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  storeIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  storeText: { flex: 1, gap: 2 },
  storeTitle: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  storeSubtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted70 },
  footer: { padding: space.s4, gap: space.s2 },
});
