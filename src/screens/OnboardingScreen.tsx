import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Field, { InputDisplay } from '../components/Field';
import ImagePlaceholder from '../components/ImagePlaceholder';
import Segmented from '../components/Segmented';
import Tag from '../components/Tag';
import RadioRow from '../components/RadioRow';
import Button from '../components/Button';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import { sizeOptions, temperamentOptions, vaccineOptions } from '../state/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  const s = useAppState();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.kicker}>Paso 1 de 1</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Cuéntanos de tu perro</Text>
        <Text style={styles.subtitle}>
          Con esto encontramos paseadores que encajen con su tamaño y temperamento.
        </Text>

        <View style={styles.petRow}>
          <ImagePlaceholder label="Foto" style={styles.petPhoto} />
          <View style={{ flex: 1, gap: space.s2 }}>
            <Field label="Nombre">
              <InputDisplay value={s.petName} />
            </Field>
            <Field label="Raza">
              <InputDisplay value={s.breed} />
            </Field>
          </View>
        </View>

        <Field label="Tamaño">
          <Segmented
            options={sizeOptions.map((v) => ({ label: v, value: v }))}
            value={s.size}
            onChange={s.setSize}
          />
        </Field>

        <Field label="Temperamento (elige varios)">
          <View style={styles.wrapRow}>
            {temperamentOptions.map((opt) => (
              <Tag
                key={opt}
                variant={s.temperament.includes(opt) ? 'accent' : 'outline'}
                onPress={() => s.toggleTemperament(opt)}
              >
                {opt}
              </Tag>
            ))}
          </View>
        </Field>

        <Field label="Vacunas al día">
          <View style={{ gap: 2 }}>
            {vaccineOptions.map((opt) => (
              <RadioRow
                key={opt}
                label={opt}
                square
                selected={s.vaccines.includes(opt)}
                onPress={() => s.toggleVaccine(opt)}
              />
            ))}
          </View>
        </Field>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          variant="primary"
          block
          blueprint
          icon={<ArrowRight size={14} strokeWidth={1.5} color={colors.bg} />}
          onPress={() => navigation.replace('Home')}
        >
          Guardar y continuar
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.s4, paddingTop: space.s4, paddingBottom: space.s2 },
  kicker: { fontFamily: fonts.body, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.accent },
  scroll: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s4 },
  title: { fontFamily: fonts.heading, fontSize: 26, color: colors.text },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.text, opacity: 0.75 },
  petRow: { flexDirection: 'row', gap: space.s4, alignItems: 'center' },
  petPhoto: { width: 84, height: 84 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  footer: { padding: space.s4 },
});
