import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Linking } from 'react-native';
import { ChevronRight, MessageCircle, MapPin, Clock, Phone, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import BottomBar from '../components/BottomBar';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import { CardMeta } from '../components/CardText';
import { colors, fonts, radius, space, type } from '../theme/tokens';
import {
  api,
  BookingSummary,
  CATEGORY_LABELS_SINGULAR,
  ProviderDetail,
  isBookable,
} from '../api/client';
import { useAppState } from '../state/AppState';
import { whatsappUrl } from '../utils/contactLinks';
import Notice from '../components/Notice';

type Props = NativeStackScreenProps<RootStackParamList, 'Business'>;

const money = (cents: number, currency: string) => '$' + (cents / 100).toFixed(0) + ' ' + currency;

// A booking still worth chatting about — not one the owner cancelled or
// the paseador turned down.
const CHATTABLE_STATUSES = new Set(['requested', 'confirmed', 'in_progress', 'completed']);

export default function BusinessProfileScreen({ navigation, route }: Props) {
  const s = useAppState();
  // Arriving from a public page's "Reservar" link we only know the slug;
  // the id comes with the business once it loads.
  const params = route.params;
  const slug = 'slug' in params ? params.slug : null;
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const providerId = 'providerId' in params ? params.providerId : (provider?.accountId ?? null);
  const [error, setError] = useState<string | null>(null);
  // Lets an owner who already has a request/booking with this business
  // (most commonly a Meet & Greet) jump straight into that chat from here,
  // instead of having to dig through "Tus reservas" to find it.
  const [chatBooking, setChatBooking] = useState<BookingSummary | null>(null);

  useEffect(() => {
    (slug ? api.getProviderBySlug(slug) : api.getProvider(s.token, (params as { providerId: string }).providerId))
      .then(setProvider)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar este negocio.'));
  }, [s.token, params]);

  // Refetches on focus (not just mount) so coming back from the chat
  // clears "Mensaje nuevo" right away — hasUnreadMessages is server-side
  // (per account, see BookingController), so this reflects reality even
  // if the message was read from a different device.
  useFocusEffect(
    useCallback(() => {
      if (!s.token || !providerId) {
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
    if (!providerId) return;
    if (s.authStatus !== 'authed') {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('Booking', { walkerId: providerId });
  };

  const bookable = provider ? isBookable(provider.category) : false;
  const waUrl = provider?.whatsapp ? whatsappUrl(provider.whatsapp, provider.name) : null;
  // The same "take me there" link the public page has.
  const mapUrl = provider
    ? provider.latitude !== null && provider.longitude !== null
      ? `https://www.google.com/maps/search/?api=1&query=${provider.latitude},${provider.longitude}`
      : provider.publicAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.publicAddress)}`
        : null
    : null;

  const priceText = provider?.price ? money(provider.price.amount, provider.price.currency) : null;

  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {error && <Notice tone="danger">{error}</Notice>}
        {!error && !provider && <CardMeta>Cargando…</CardMeta>}
        {provider && (
          <>
            {provider.photo && (
              <Image source={{ uri: provider.photo }} style={styles.hero} resizeMode="cover" />
            )}
            <View style={styles.identity}>
              {!provider.photo && <Avatar name={provider.name} size={72} square />}
              <View style={{ flex: 1, gap: space.s1 }}>
                <Text style={styles.name}>{provider.name}</Text>
                <Text style={type.small}>
                  {[CATEGORY_LABELS_SINGULAR[provider.category], provider.serviceArea].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
            {(provider.identityVerified || provider.specialty) && (
              <View style={styles.facts}>
                {provider.identityVerified && (
                  <View style={styles.fact}>
                    <ShieldCheck size={16} strokeWidth={2} color={colors.success} />
                    <Text style={[styles.factText, { color: colors.success }]}>Identidad verificada por PawMates</Text>
                  </View>
                )}
                {provider.specialty && (
                  <View style={styles.fact}>
                    <Sparkles size={16} strokeWidth={1.75} color={colors.textMuted} />
                    <Text style={styles.factText}>{provider.specialty}</Text>
                  </View>
                )}
              </View>
            )}

            {chatBooking && (
              <Card
                row
                style={chatBooking.hasUnreadMessages ? styles.chatCardUnread : undefined}
                onPress={() => navigation.navigate('Chat', { bookingId: chatBooking.id })}
              >
                <MessageCircle size={20} strokeWidth={1.75} color={colors.accent} />
                <Text style={[styles.chatText, chatBooking.hasUnreadMessages && styles.chatTextUnread]}>
                  {chatBooking.hasUnreadMessages
                    ? `Mensaje nuevo de ${provider.name}`
                    : `Enviar mensaje a ${provider.name}`}
                </Text>
                {chatBooking.hasUnreadMessages && <View style={styles.chatDot} />}
                <ChevronRight size={18} strokeWidth={1.75} color={colors.textFaint} />
              </Card>
            )}

            {provider.bio && <Text style={styles.bio}>{provider.bio}</Text>}

            {bookable && (
              <Card
                row
                onPress={() =>
                  s.authStatus !== 'authed'
                    ? navigation.navigate('Login')
                    : providerId && navigation.navigate('MeetGreet', { walkerId: providerId })
                }
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={type.cardTitle}>Conócenos primero</Text>
                  <Text style={type.meta}>Un encuentro sin costo antes del primer paseo.</Text>
                </View>
                <ChevronRight size={18} strokeWidth={1.75} color={colors.textFaint} />
              </Card>
            )}

            {(provider.publicAddress || provider.hours) && (
              <View style={styles.section}>
                {provider.publicAddress && (
                  <View style={styles.infoRow}>
                    <MapPin size={18} strokeWidth={1.75} color={colors.textMuted} />
                    <Text style={styles.infoText}>{provider.publicAddress}</Text>
                    {mapUrl && (
                      <Text style={styles.link} onPress={() => void Linking.openURL(mapUrl)}>
                        Cómo llegar
                      </Text>
                    )}
                  </View>
                )}
                {provider.hours && (
                  <View style={styles.infoRow}>
                    <Clock size={18} strokeWidth={1.75} color={colors.textMuted} />
                    <Text style={styles.infoText}>{provider.hours}</Text>
                  </View>
                )}
              </View>
            )}

            {provider.photos.length > 0 && (
              <View style={styles.section}>
                <Text style={type.section}>Fotos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.s2 }}>
                  {provider.photos.map((uri) => (
                    <Image key={uri} source={{ uri }} style={styles.galleryPhoto} resizeMode="cover" />
                  ))}
                </ScrollView>
              </View>
            )}

            {provider.plansOffered && (
              <View style={styles.section}>
                <Text style={type.section}>Planes y servicios</Text>
                <Text style={styles.bio}>{provider.plansOffered}</Text>
              </View>
            )}
            {provider.walkingSpots && (
              <View style={styles.section}>
                <Text style={type.section}>Parques y sitios donde pasea</Text>
                <Text style={styles.bio}>{provider.walkingSpots}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
      {provider &&
        (bookable ? (
          <BottomBar
            summary={
              <>
                <Text style={styles.barPrice}>{priceText ?? 'Por acordar'}</Text>
                <Text style={type.meta}>{priceText ? 'por paseo · pagas directo' : 'precio con el negocio'}</Text>
              </>
            }
          >
            <Button variant="primary" onPress={handleReservar} style={{ minWidth: 140 }}>
              Reservar
            </Button>
          </BottomBar>
        ) : (
          // Nothing to book for a vet or a groomer yet — the directory's
          // job for those is to hand the customer a way to reach them.
          <BottomBar>
            <Button
              variant="primary"
              block
              disabled={!waUrl}
              icon={<Phone size={16} strokeWidth={1.75} color={colors.onAccent} />}
              onPress={() => waUrl && void Linking.openURL(waUrl)}
            >
              {waUrl ? 'Contactar por WhatsApp' : 'Sin contacto disponible'}
            </Button>
          </BottomBar>
        ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  link: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.accent },
  scroll: { paddingHorizontal: space.s4, gap: space.s5, paddingBottom: space.s6 },
  hero: { width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: colors.panel },
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.s4 },
  name: { ...type.display },
  facts: { gap: space.s2 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  factText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text, flexShrink: 1 },
  bio: { ...type.body },
  section: { gap: space.s3, paddingTop: space.s4, borderTopWidth: 1, borderTopColor: colors.divider },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: space.s3 },
  infoText: { flex: 1, ...type.body, fontSize: 14.5 },
  galleryPhoto: { width: 150, height: 112, borderRadius: radius.md, backgroundColor: colors.panel },
  barPrice: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.text },
  chatText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14.5, color: colors.text },
  chatTextUnread: { fontFamily: fonts.bodyBold },
  chatCardUnread: { backgroundColor: colors.accentTint, borderColor: colors.accentTintLine },
  chatDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
});
