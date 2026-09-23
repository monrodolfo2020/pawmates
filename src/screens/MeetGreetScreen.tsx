import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Handshake } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import RadioRow from '../components/RadioRow';
import Field from '../components/Field';
import Card from '../components/Card';
import { CardBody, CardMeta } from '../components/CardText';
import { colors, radius, space, type } from '../theme/tokens';
import { api, ProviderDetail } from '../api/client';
import { useAppState } from '../state/AppState';
import WhenPicker, { chosenSlot, initialWhen } from '../components/WhenPicker';
import { atSlot, formatWhen } from '../utils/bookingSlots';
import ScreenHeader from '../components/ScreenHeader';
import Notice from '../components/Notice';
import BottomBar from '../components/BottomBar';

type Props = NativeStackScreenProps<RootStackParamList, 'MeetGreet'>;

export default function MeetGreetScreen({ navigation, route }: Props) {
  const s = useAppState();
  const { walkerId } = route.params;
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [petId, setPetId] = useState(s.pets[0]?.id ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentBookingId, setSentBookingId] = useState<string | null>(null);
  const [when, setWhen] = useState(initialWhen);
  const slot = chosenSlot(when);
  const scheduledAt = slot === null ? null : atSlot(when.day, slot).toISOString();

  useEffect(() => {
    api.getProvider(s.token, walkerId).then(setProvider).catch(() => {});
  }, [s.token, walkerId]);

  const handleSubmit = async () => {
    if (s.authStatus !== 'authed') {
      navigation.navigate('Login');
      return;
    }
    if (!s.token || !petId || !scheduledAt) return;
    setError(null);
    setSubmitting(true);
    try {
      const booking = await api.requestMeetGreet(s.token, petId, walkerId, scheduledAt);
      setSentBookingId(booking.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sentBookingId) {
    return (
      <ScreenContainer>
        <View style={styles.sentBody}>
          <View style={styles.sentIcon}>
            <Handshake size={28} strokeWidth={1.75} color={colors.warning} />
          </View>
          <Text style={type.kicker}>Solicitud enviada</Text>
          <Text style={styles.sentTitle}>
            Le avisamos a {provider?.name ?? 'el negocio'}
          </Text>
          <Text style={styles.sentBody2}>
            Pediste conocerse el {scheduledAt ? formatWhen(scheduledAt) : ''}. En cuanto lo confirme,
            lo verás en "Tus reservas". No tiene costo.
          </Text>
          <Text style={styles.sentBody2}>
            Mientras tanto, pueden escribirse para acordar el punto de encuentro.
          </Text>
        </View>
        <BottomBar>
          <Button
            variant="secondary"
            block
            onPress={() => navigation.navigate('Chat', { bookingId: sentBookingId })}
          >
            Enviar mensaje
          </Button>
          <Button variant="primary" block onPress={() => navigation.navigate('Home')}>
            Volver al inicio
          </Button>
        </BottomBar>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => navigation.goBack()} title="Conócenos primero" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card tone="panel">
          <CardBody>
            Un Meet &amp; Greet es una sesión breve y sin costo para que tú, tu mascota y{' '}
            {provider?.name ?? 'el negocio'} se conozcan antes de reservar paseos. Elige cuándo te gustaría.
          </CardBody>
        </Card>

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

        <WhenPicker value={when} onChange={setWhen} />

        {error && <Notice tone="danger">{error}</Notice>}

        {s.pets.length === 0 && (
          <CardMeta>Agrega primero los datos de tu mascota para solicitar un Meet &amp; Greet.</CardMeta>
        )}
      </ScrollView>
      <BottomBar>
        <Button
          variant="primary"
          block
          disabled={submitting || s.pets.length === 0 || !scheduledAt}
          onPress={handleSubmit}
        >
          {submitting ? 'Enviando…' : 'Solicitar Meet & Greet'}
        </Button>
      </BottomBar>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.s4, gap: space.s5, paddingBottom: space.s6 },
  sentIcon: {
    width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.warningTint,
    alignItems: 'center', justifyContent: 'center',
  },
  sentBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s3, paddingHorizontal: space.s6 },
  sentTitle: { ...type.title, textAlign: 'center' },
  sentBody2: { ...type.body, color: colors.textMuted, textAlign: 'center' },
});
