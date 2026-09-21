import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PawPrint } from 'lucide-react-native';
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
          Veterinarias, estéticas, paseadores, hoteles y más: encuentra todo lo que tu mascota
          necesita, o registra tu negocio y consigue tu propia página para compartir.
        </Text>

        <View style={styles.footer}>
          <Button variant="secondary" block blueprint onPress={() => navigation.navigate('Home')}>
            Ver servicios cerca de ti
          </Button>
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
            Tengo un negocio de mascotas — Registrarse
          </Button>
          <Button variant="ghost" block onPress={() => navigation.navigate('Login')}>
            Ya tengo cuenta — iniciar sesión
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s3, paddingHorizontal: space.s6 },
  title: { fontFamily: fonts.heading, fontSize: 32, color: colors.text },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.text, opacity: 0.75, textAlign: 'center' },
  footer: { width: '100%', marginTop: space.s6, gap: space.s2 },
});
