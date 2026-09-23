import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft, Handshake } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import RadioRow from '../components/RadioRow';
import Field from '../components/Field';
import Card from '../components/Card';
import { CardBody, CardMeta } from '../components/CardText';
import { colors, fonts, space } from '../theme/tokens';
import { api, ProviderDetail } from '../api/client';
import { useAppState } from '../state/AppState';
import WhenPicker, { chosenSlot, initialWhen } from '../components/WhenPicker';
import { atSlot, formatWhen } from '../utils/bookingSlots';

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
        <View style={styles.header}>
          <Text style={styles.title}>Solicitud enviada</Text>
        </View>
        <View style={styles.sentBody}>
          <Handshake size={40} strokeWidth={1.5} color={colors.accent} />
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
        <View style={styles.footer}>
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
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>Conócenos primero</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
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

        {error && (
          <Card>
            <CardBody style={{ color: colors.accent }}>{error}</CardBody>
          </Card>
        )}

        {s.pets.length === 0 && (
          <CardMeta>Agrega primero los datos de tu mascota para solicitar un Meet &amp; Greet.</CardMeta>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          variant="primary"
          block
          disabled={submitting || s.pets.length === 0 || !scheduledAt}
          onPress={handleSubmit}
        >
          {submitting ? 'Enviando…' : 'Solicitar Meet & Greet'}
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
  footer: { padding: space.s4, gap: space.s2 },
  sentBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s3, paddingHorizontal: space.s6 },
  sentTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.text, textAlign: 'center' },
  sentBody2: { fontFamily: fonts.body, fontSize: 14, color: colors.text, opacity: 0.75, textAlign: 'center' },
});
