import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Field from '../components/Field';
import TextField from '../components/TextField';
import PhotoPicker from '../components/PhotoPicker';
import Segmented from '../components/Segmented';
import Tag from '../components/Tag';
import RadioRow from '../components/RadioRow';
import Button from '../components/Button';
import { colors, radius, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import { careOptions, sizeOptions, temperamentOptions, vaccineOptions } from '../state/mockData';
import Notice from '../components/Notice';
import BottomBar from '../components/BottomBar';
import ScreenHeader from '../components/ScreenHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

// Three modes, one form — an owner can have any number of pets (see
// PetsController: no one-per-owner constraint), so this screen needs to
// tell apart "the forced first pet" from "editing pet X" from "adding
// another one":
//   - no petId + zero pets yet: the original forced flow (no back
//     button — Onboarding has always been the one screen a brand-new
//     owner can't skip, see RootNavigator's comment on why admin
//     accounts bypass it).
//   - petId given: editing that specific pet.
//   - no petId + at least one pet already: adding a new one.
// loadPetDraft() (AppState) seeds/resets the shared draft fields
// (petName, breed, ...) for whichever of these it is; savePet() then
// trusts editingPetId completely rather than re-guessing "which pet".
export default function OnboardingScreen({ navigation, route }: Props) {
  const s = useAppState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const petId = route.params?.petId;
  const isForcedFirstTime = !petId && s.pets.length === 0;
  const isEditingExisting = !!petId;

  useEffect(() => {
    const pet = petId ? s.pets.find((p) => p.id === petId) ?? null : null;
    s.loadPetDraft(pet);
    // Only re-seed when navigating to a different pet (or fresh) — not on
    // every keystroke, which would also live in `s`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await s.savePet();
      if (!isForcedFirstTime && navigation.canGoBack()) navigation.goBack();
      else navigation.replace('Home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar a tu mascota.');
    } finally {
      setSaving(false);
    }
  };

  // Every vaccine on the list: shown as its own box, and ticking it ticks all.
  const fullScheme = vaccineOptions.every((v) => s.vaccines.includes(v));

  const title = isEditingExisting ? 'Tu mascota' : isForcedFirstTime ? 'Cuéntanos de tu mascota' : 'Agregar mascota';
  const saveLabel = isEditingExisting ? 'Guardar cambios' : isForcedFirstTime ? 'Guardar y continuar' : 'Agregar mascota';

  return (
    <ScreenContainer>
      <ScreenHeader
        onBack={
          isForcedFirstTime
            ? undefined
            : () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))
        }
        kicker={isForcedFirstTime ? 'Último paso' : undefined}
        title={title}
        subtitle="Así los negocios que contactes saben a quién van a atender: su tamaño, su carácter y sus vacunas."
      />
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.petRow}>
          <PhotoPicker
            uri={s.petPhotoUri}
            onChange={s.setPetPhoto}
            style={styles.petPhoto}
            alertTitle="Foto de tu mascota"
          />
          <View style={{ flex: 1, gap: space.s2 }}>
            <TextField label="Nombre" value={s.petName} onChangeText={s.setPetName} placeholder="Rocky" autoCapitalize="words" />
            <TextField label="Raza" value={s.breed} onChangeText={s.setBreed} placeholder="Labrador retriever" autoCapitalize="words" />
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
          <View>
            <RadioRow
              label="Esquema completo"
              square
              selected={fullScheme}
              onPress={() =>
                s.setVaccines(
                  fullScheme
                    ? s.vaccines.filter((v) => !vaccineOptions.includes(v))
                    : [...new Set([...s.vaccines, ...vaccineOptions])],
                )
              }
            />
            <View style={styles.divider} />
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

        <Field label="Cuidados">
          <View>
            {careOptions.map((opt) => (
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

        {error && <Notice tone="danger">{error}</Notice>}
      </ScrollView>
      <BottomBar>
        <Button
          variant="primary"
          block
          disabled={saving || !s.petName || !s.breed}
          icon={<ArrowRight size={14} strokeWidth={1.5} color={colors.onAccent} />}
          onPress={handleSave}
        >
          {saving ? 'Guardando…' : saveLabel}
        </Button>
      </BottomBar>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.s4, gap: space.s5, paddingTop: space.s2, paddingBottom: space.s6 },
  petRow: { flexDirection: 'row', gap: space.s4, alignItems: 'center' },
  petPhoto: { width: 96, height: 96, borderRadius: radius.pill },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: space.s1 },
});
