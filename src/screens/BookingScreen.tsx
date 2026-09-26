import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import Field from '../components/Field';
import RadioRow from '../components/RadioRow';
import Segmented from '../components/Segmented';
import { CardMeta } from '../components/CardText';
import { space } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import { atSlot } from '../utils/bookingSlots';
import WhenPicker, { chosenSlot, initialWhen } from '../components/WhenPicker';
import ScreenHeader from '../components/ScreenHeader';
import Notice from '../components/Notice';
import BottomBar from '../components/BottomBar';
import ServiceList from '../components/ServiceList';
import { api, BusinessService } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Booking'>;

/**
 * Picking what to ask for: which pet, which walk, which day, what time.
 * A business with a list of services is booked by picking one (its
 * duration and price come with it); one without a list gets the plain
 * 30/60 minute choice.
 * Nothing is sent from here — "Revisar solicitud" only moves on to the
 * summary, and the request goes out from there once the owner has seen
 * exactly what they're asking for and at what price.
 */
export default function BookingScreen({ navigation, route }: Props) {
  const s = useAppState();
  const { walkerId } = route.params;
  const [duration, setDuration] = useState('60');
  const [services, setServices] = useState<BusinessService[]>([]);
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(route.params.serviceId ?? null);

  useEffect(() => {
    api
      .getProvider(s.token, walkerId)
      .then((business) => {
        setServices(business.services ?? []);
        setBasePrice(business.price?.amount ?? null);
      })
      .catch(() => setServices([]));
  }, [s.token, walkerId]);

  // A service picked on the profile that has since disappeared doesn't
  // count as picked.
  const service = services.find((x) => x.id === serviceId) ?? null;
  const needsService = services.length > 0;
  const minutes = service?.durationMinutes ?? Number(duration);
  const [petId, setPetId] = useState(s.pets[0]?.id ?? '');

  const [when, setWhen] = useState(initialWhen);
  const slot = chosenSlot(when);

  const canContinue = Boolean(petId) && slot !== null && (!needsService || service !== null);

  const handleContinue = () => {
    if (!canContinue || slot === null) return;
    navigation.navigate('Checkout', {
      walkerId,
      petId,
      scheduledAt: atSlot(when.day, slot).toISOString(),
      durationMinutes: minutes,
      serviceId: service?.id,
    });
  };

  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => navigation.goBack()} title="Solicitar paseo" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {s.pets.length === 0 && (
          <Notice tone="danger">
            Agrega primero los datos de tu mascota para poder solicitar un paseo.
          </Notice>
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

        {needsService && (
          <Field label="¿Qué paseo?">
            <ServiceList
              services={services}
              fallbackPrice={basePrice}
              selectedId={serviceId}
              onPick={(picked) => setServiceId(picked.id)}
            />
          </Field>
        )}

        <WhenPicker value={when} onChange={setWhen} />

        {(!needsService || (service && service.durationMinutes === null)) && (
          <Field label="Duración">
            <Segmented
              options={[{ label: '30 min', value: '30' }, { label: '60 min', value: '60' }]}
              value={duration}
              onChange={setDuration}
            />
          </Field>
        )}

        <CardMeta>
          Es una solicitud para un solo paseo. El negocio la acepta o la rechaza, y te avisamos
          aquí mismo.
        </CardMeta>
      </ScrollView>
      <BottomBar>
        <Button variant="primary" block disabled={!canContinue} onPress={handleContinue}>
          Revisar solicitud
        </Button>
      </BottomBar>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.s4, gap: space.s5, paddingBottom: space.s6 },
});
