import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import Field from '../components/Field';
import Tag from '../components/Tag';
import RadioRow from '../components/RadioRow';
import Segmented from '../components/Segmented';
import { CardMeta } from '../components/CardText';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import { bookableDays, dayLabel, slotsFor, slotLabel, atSlot } from '../utils/bookingSlots';

type Props = NativeStackScreenProps<RootStackParamList, 'Booking'>;

/**
 * Picking what to ask for: which pet, which day, what time, how long.
 * Nothing is sent from here — "Revisar solicitud" only moves on to the
 * summary, and the request goes out from there once the owner has seen
 * exactly what they're asking for and at what price.
 */
export default function BookingScreen({ navigation, route }: Props) {
  const s = useAppState();
  const { walkerId } = route.params;
  const [duration, setDuration] = useState('60');
  const [petId, setPetId] = useState(s.pets[0]?.id ?? '');

  // Built once per visit: "today" shouldn't shift under the owner while
  // they're choosing.
  const days = useMemo(() => bookableDays(new Date()), []);
  const [day, setDay] = useState(days[0]);
  const slots = useMemo(() => slotsFor(day, new Date()), [day]);
  const [slot, setSlot] = useState<number | null>(null);
  const chosenSlot = slot !== null && slots.includes(slot) ? slot : null;

  const canContinue = Boolean(petId) && chosenSlot !== null;

  const handleContinue = () => {
    if (!canContinue || chosenSlot === null) return;
    navigation.navigate('Checkout', {
      walkerId,
      petId,
      scheduledAt: atSlot(day, chosenSlot).toISOString(),
      durationMinutes: Number(duration),
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>Solicitar paseo</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {s.pets.length === 0 && (
          <CardMeta style={{ color: colors.accent }}>
            Agrega primero los datos de tu mascota para poder solicitar un paseo.
          </CardMeta>
        )}

        {s.pets.length > 1 && (
          <Field label="¿Para cuál mascota?">
            <View>
              {s.pets.map((pet) => (
                <RadioRow
                  key={pet.id}
                  label={`${pet.name} · ${pet.breed}`}
                  selected={petId === pet.id}
                  onPress={() => setPetId(pet.id)}
                />
              ))}
            </View>
          </Field>
        )}

        <Field label="Día">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {days.map((d) => (
              <Tag
                key={d.toISOString()}
                variant={d.getTime() === day.getTime() ? 'accent' : 'outline'}
                onPress={() => setDay(d)}
              >
                {dayLabel(d, new Date())}
              </Tag>
            ))}
          </ScrollView>
        </Field>

        <Field label="Hora">
          {slots.length === 0 ? (
            <CardMeta>Ya no quedan horarios para hoy. Elige otro día.</CardMeta>
          ) : (
            <View style={styles.slotGrid}>
              {slots.map((minutes) => (
                <Tag
                  key={minutes}
                  variant={chosenSlot === minutes ? 'accent' : 'outline'}
                  onPress={() => setSlot(minutes)}
                  style={styles.slot}
                >
                  {slotLabel(minutes)}
                </Tag>
              ))}
            </View>
          )}
        </Field>

        <Field label="Duración">
          <Segmented
            options={[{ label: '30 min', value: '30' }, { label: '60 min', value: '60' }]}
            value={duration}
            onChange={setDuration}
          />
        </Field>

        <CardMeta>
          Es una solicitud para un solo paseo. El negocio la acepta o la rechaza, y te avisamos
          aquí mismo.
        </CardMeta>
      </ScrollView>
      <View style={styles.footer}>
        <Button variant="primary" block disabled={!canContinue} onPress={handleContinue}>
          Revisar solicitud
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
  },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  scroll: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s4 },
  chipRow: { gap: 6 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  slot: { minWidth: 72, alignItems: 'center' },
  footer: { padding: space.s4 },
});
