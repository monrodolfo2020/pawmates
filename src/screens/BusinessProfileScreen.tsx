import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Linking } from 'react-native';
import { ChevronLeft, MessageCircle, MapPin, Clock, Phone } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
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
import {
  api,
  BookingSummary,
  CATEGORY_LABELS_SINGULAR,
  ProviderDetail,
  isBookable,
} from '../api/client';
import { useAppState } from '../state/AppState';
import { whatsappUrl } from '../utils/contactLinks';

type Props = NativeStackScreenProps<RootStackParamList, 'Business'>;

const money = (cents: number, currency: string) => '$' + (cents / 100).toFixed(0) + ' ' + currency;

// A booking still worth chatting about — not one the owner cancelled or
// the paseador turned down.
const CHATTABLE_STATUSES = new Set(['requested', 'confirmed', 'in_progress', 'completed']);

export default function BusinessProfileScreen({ navigation, route }: Props) {
  const s = useAppState();
  const { providerId } = route.params;
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Lets an owner who already has a request/booking with this business
  // (most commonly a Meet & Greet) jump straight into that chat from here,
  // instead of having to dig through "Tus reservas" to find it.
  const [chatBooking, setChatBooking] = useState<BookingSummary | null>(null);

  useEffect(() => {
    api
      .getProvider(s.token, providerId)
      .then(setProvider)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar este negocio.'));
  }, [s.token, providerId]);

  // Refetches on focus (not just mount) so coming back from the chat
  // clears "Mensaje nuevo" right away — hasUnreadMessages is server-side
  // (per account, see BookingController), so this reflects reality even
  // if the message was read from a different device.
  useFocusEffect(
    useCallback(() => {
      if (!s.token) {
        setChatBooking(null);
        return;
      }
      api
        .listBookings(s.token, { activeContext: 'owner' })
        .then((bookings) => {
          const match = bookings.find(
            (b) => b.providerId === providerId && CHATTABLE_STATUSES.has(b.status),
          );
          setChatBooking(match ?? null);
        })
        .catch(() => setChatBooking(null));
    }, [s.token, providerId]),
  );

  const handleReservar = () => {
    if (s.authStatus !== 'authed') {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('Booking', { walkerId: providerId });
  };

  const bookable = provider ? isBookable(provider.category) : false;
  const waUrl = provider?.whatsapp ? whatsappUrl(provider.whatsapp, provider.name) : null;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {error && <CardMeta style={{ color: colors.accent }}>{error}</CardMeta>}
        {!error && !provider && <CardMeta>Cargando…</CardMeta>}
        {provider && (
          <>
            {provider.photo ? (
              <Image source={{ uri: provider.photo }} style={styles.hero} resizeMode="contain" />
            ) : (
              <ImagePlaceholder label="Foto del negocio" style={styles.hero} />
            )}
            <View>
              <Text style={styles.name}>{provider.name}</Text>
              <CardMeta style={{ fontSize: 13, marginTop: 2 }}>
                {CATEGORY_LABELS_SINGULAR[provider.category]}
                {provider.serviceArea ? ` · ${provider.serviceArea}` : ''}
              </CardMeta>
            </View>
            <View style={styles.badges}>
              {provider.identityVerified && <Tag variant="accent">Identidad verificada ✓</Tag>}
              {provider.emailVerified && <Tag variant="accent">Correo verificado ✓</Tag>}
              {provider.specialty && <Tag variant="accent">{provider.specialty}</Tag>}
              {provider.price && (
                <Tag variant="outline">{money(provider.price.amount, provider.price.currency)}/paseo</Tag>
              )}
            </View>

            {chatBooking && (
              <Card
                row
                elevation="sm"
                style={chatBooking.hasUnreadMessages ? styles.chatCardUnread : undefined}
                onPress={() => navigation.navigate('Chat', { bookingId: chatBooking.id })}
              >
                <MessageCircle
                  size={20}
                  strokeWidth={1.5}
                  color={chatBooking.hasUnreadMessages ? '#fff' : colors.accent}
                />
                <CardBody
                  style={[
                    { flex: 1, margin: 0, marginLeft: space.s2 },
                    chatBooking.hasUnreadMessages && { color: '#fff', opacity: 1 },
                  ]}
                >
                  {chatBooking.hasUnreadMessages
                    ? `Mensaje nuevo de ${provider.name}`
                    : `Enviar mensaje a ${provider.name}`}
                </CardBody>
                {chatBooking.hasUnreadMessages && <View style={styles.chatDot} />}
              </Card>
            )}

            {provider.bio && <Text style={styles.bio}>{provider.bio}</Text>}

            {(provider.publicAddress || provider.hours) && (
              <View style={{ gap: space.s2 }}>
                {provider.publicAddress && (
                  <View style={styles.infoRow}>
                    <MapPin size={16} strokeWidth={1.5} color={colors.accent} />
                    <Text style={styles.infoText}>{provider.publicAddress}</Text>
                  </View>
                )}
                {provider.hours && (
                  <View style={styles.infoRow}>
                    <Clock size={16} strokeWidth={1.5} color={colors.accent} />
                    <Text style={styles.infoText}>{provider.hours}</Text>
                  </View>
                )}
              </View>
            )}

            {provider.photos.length > 0 && (
              <View style={{ gap: space.s2 }}>
                <Text style={styles.h5}>Fotos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.s2 }}>
                  {provider.photos.map((uri) => (
                    <Image key={uri} source={{ uri }} style={styles.galleryPhoto} resizeMode="cover" />
                  ))}
                </ScrollView>
              </View>
            )}

            {provider.plansOffered && (
              <View style={{ gap: space.s2 }}>
                <Text style={styles.h5}>Planes y servicios</Text>
                <Text style={styles.bio}>{provider.plansOffered}</Text>
              </View>
            )}
            {provider.walkingSpots && (
              <View style={{ gap: space.s2 }}>
                <Text style={styles.h5}>Parques y sitios donde pasea</Text>
                <Text style={styles.bio}>{provider.walkingSpots}</Text>
              </View>
            )}
            <View style={styles.hr} />
            <View style={{ gap: space.s2 }}>
              <Text style={styles.h5}>Reseñas</Text>
              <CardMeta>Este negocio todavía no tiene reseñas.</CardMeta>
            </View>
          </>
        )}
      </ScrollView>
      {provider && (
        <View style={styles.footer}>
          {bookable ? (
            <>
              <Button
                variant="secondary"
                blueprint
                style={{ flex: 1 }}
                onPress={() => navigation.navigate('MeetGreet', { walkerId: providerId })}
              >
                Conócenos primero
              </Button>
              <Button variant="primary" blueprint style={{ flex: 1 }} onPress={handleReservar}>
                Reservar
              </Button>
            </>
          ) : (
            // Nothing to book for a vet or a groomer yet — the directory's
            // job for those is to hand the customer a way to reach them.
            <Button
              variant="primary"
              blueprint
              block
              disabled={!waUrl}
              icon={<Phone size={14} strokeWidth={1.5} color={waUrl ? colors.bg : colors.text} />}
              onPress={() => waUrl && void Linking.openURL(waUrl)}
            >
              {waUrl ? 'Contactar por WhatsApp' : 'Sin contacto disponible'}
            </Button>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.s3, paddingVertical: space.s2 },
  scroll: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s4 },
  hero: {
    width: '100%',
    height: 220,
    backgroundColor: colors.surface,
  },
  name: { fontFamily: fonts.heading, fontSize: 22, color: colors.text },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bio: { fontFamily: fonts.body, fontSize: 13, color: colors.text, opacity: 0.85 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  infoText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.text, opacity: 0.85 },
  galleryPhoto: { width: 140, height: 104, backgroundColor: colors.surface },
  hr: { height: 1, backgroundColor: colors.divider },
  h5: { fontFamily: fonts.heading, fontSize: 16, color: colors.text, marginBottom: space.s2 },
  footer: { flexDirection: 'row', gap: space.s2, padding: space.s4 },
  chatCardUnread: { backgroundColor: colors.accent, borderColor: colors.accent },
  chatDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
});
