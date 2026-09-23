import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dog, GraduationCap, House, Scissors, Stethoscope } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import Notice from '../components/Notice';
import Wordmark from '../components/Wordmark';
import { colors, fonts, radius, space, tintFor, type } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const CATEGORIES = [
  { label: 'Veterinarias', Icon: Stethoscope },
  { label: 'Estéticas', Icon: Scissors },
  { label: 'Paseadores', Icon: Dog },
  { label: 'Hoteles', Icon: House },
  { label: 'Entrenadores', Icon: GraduationCap },
];

export default function WelcomeScreen({ navigation }: Props) {
  const s = useAppState();
  return (
    <ScreenContainer>
      <View style={styles.top}>
        <Wordmark size={24} />
      </View>
      <View style={styles.body}>
        {/* A session that ended because the account was suspended lands
            here, not on Login — so the reason has to be shown here too,
            or it just looks like the app logged them out for nothing. */}
        {s.authError && <Notice tone="danger">{s.authError}</Notice>}
        <View style={styles.icons} accessibilityElementsHidden>
          {CATEGORIES.map(({ label, Icon }) => {
            const tint = tintFor(label);
            return (
              <View key={label} style={[styles.icon, { backgroundColor: tint.bg }]}>
                <Icon size={24} strokeWidth={1.75} color={tint.fg} />
              </View>
            );
          })}
        </View>
        <Text style={styles.headline}>Todo lo que tu mascota necesita, cerca de ti.</Text>
        <Text style={styles.subtitle}>
          Encuentra negocios de confianza y contáctalos directo. Si tienes un negocio, consigue tu
          propia página para compartir.
        </Text>
        <Text style={styles.category}>{CATEGORIES.map((c) => c.label).join(' · ')}</Text>
      </View>

      <View style={styles.footer}>
        <Button variant="primary" block onPress={() => navigation.navigate('Home')}>
          Ver servicios cerca de ti
        </Button>
        <View style={styles.pair}>
          <Button style={styles.half} onPress={() => navigation.navigate('Signup', { role: 'owner' })}>
            Soy dueño
          </Button>
          <Button style={styles.half} onPress={() => navigation.navigate('Signup', { role: 'provider' })}>
            Tengo un negocio
          </Button>
        </View>
        <Button variant="ghost" block onPress={() => navigation.navigate('Login')}>
          Ya tengo cuenta · Iniciar sesión
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: space.s5, paddingTop: space.s4 },
  body: { flex: 1, justifyContent: 'flex-end', gap: space.s4, paddingHorizontal: space.s5, paddingBottom: space.s8 },
  icons: { flexDirection: 'row', gap: space.s2, marginBottom: space.s2 },
  icon: { width: 52, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  headline: { ...type.display, fontSize: 42, lineHeight: 46 },
  subtitle: { ...type.body, color: colors.textMuted, fontSize: 16, lineHeight: 24 },
  category: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.textMuted },
  footer: { paddingHorizontal: space.s5, paddingBottom: space.s5, gap: space.s2 },
  pair: { flexDirection: 'row', gap: space.s2 },
  half: { flex: 1 },
});
