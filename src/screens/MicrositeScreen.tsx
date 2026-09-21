import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable, Linking, useWindowDimensions } from 'react-native';
import { MapPin, Clock, MessageCircle, PawPrint } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Tag from '../components/Tag';
import { colors, fonts, radius, space } from '../theme/tokens';
import { api, CATEGORY_LABELS_SINGULAR, ProviderDetail } from '../api/client';
import { whatsappUrl } from '../utils/contactLinks';

type Props = NativeStackScreenProps<RootStackParamList, 'Microsite'>;

const money = (cents: number, currency: string) => '$' + (cents / 100).toFixed(0) + ' ' + currency;

// Desktop gets the page in a centered column rather than stretched edge
// to edge — this is a landing page someone was linked to, not an app
// screen, and full-width body text at 1400px is unreadable.
const PAGE_MAX_WIDTH = 720;

/**
 * The free plan's micro-page: one fixed layout in PawMates' own colors,
 * filled with whatever the business put in its profile. The VIP plan
 * (colors, fonts, templates, reorderable sections) builds on this same
 * screen in a later phase.
 *
 * Served standalone at /s/<slug> — see RootNavigator's microsite gate.
 * Every visitor is treated as a signed-out stranger, because that's who
 * a shared link usually reaches.
 */
export default function MicrositeScreen({ route }: Props) {
  const { slug } = route.params;
  const { width } = useWindowDimensions();
  const [business, setBusiness] = useState<ProviderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getProviderBySlug(slug)
      .then(setBusiness)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar esta página.'));
  }, [slug]);

  const cover = business?.photos[0] ?? business?.photo ?? null;
  const waUrl = business?.whatsapp ? whatsappUrl(business.whatsapp, business.name) : null;
  const gallery = business ? business.photos.slice(cover === business.photos[0] ? 1 : 0) : [];

  if (error) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <PawPrint size={40} strokeWidth={1.5} color={colors.accent} />
          <Text style={styles.notFoundTitle}>Página no encontrada</Text>
          <Text style={styles.notFoundBody}>{error}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!business) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={styles.notFoundBody}>Cargando…</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.page, { maxWidth: PAGE_MAX_WIDTH, width: Math.min(width, PAGE_MAX_WIDTH) }]}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, styles.coverEmpty]}>
              <PawPrint size={44} strokeWidth={1.5} color={colors.accent} />
            </View>
          )}

          <View style={styles.headerBlock}>
            <Text style={styles.name}>{business.name}</Text>
            <View style={styles.badges}>
              <Tag variant="accent">{CATEGORY_LABELS_SINGULAR[business.category]}</Tag>
              {business.identityVerified && <Tag variant="outline">Identidad verificada ✓</Tag>}
              {business.specialty && <Tag variant="outline">{business.specialty}</Tag>}
              {business.price && (
                <Tag variant="outline">
                  {money(business.price.amount, business.price.currency)}/paseo
                </Tag>
              )}
            </View>
          </View>

          {business.bio && <Text style={styles.bio}>{business.bio}</Text>}

          {waUrl && (
            <Pressable style={styles.ctaButton} onPress={() => void Linking.openURL(waUrl)}>
              <MessageCircle size={18} strokeWidth={2} color={colors.bg} />
              <Text style={styles.ctaText}>Escríbenos por WhatsApp</Text>
            </Pressable>
          )}

          {(business.publicAddress || business.hours || business.serviceArea) && (
            <View style={styles.infoCard}>
              {business.publicAddress && (
                <View style={styles.infoRow}>
                  <MapPin size={16} strokeWidth={1.5} color={colors.accent} />
                  <Text style={styles.infoText}>{business.publicAddress}</Text>
                </View>
              )}
              {business.serviceArea && !business.publicAddress && (
                <View style={styles.infoRow}>
                  <MapPin size={16} strokeWidth={1.5} color={colors.accent} />
                  <Text style={styles.infoText}>Zona de servicio: {business.serviceArea}</Text>
                </View>
              )}
              {business.hours && (
                <View style={styles.infoRow}>
                  <Clock size={16} strokeWidth={1.5} color={colors.accent} />
                  <Text style={styles.infoText}>{business.hours}</Text>
                </View>
              )}
            </View>
          )}

          {business.plansOffered && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Servicios</Text>
              <Text style={styles.bio}>{business.plansOffered}</Text>
            </View>
          )}

          {gallery.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Galería</Text>
              <View style={styles.galleryGrid}>
                {gallery.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.galleryPhoto} resizeMode="cover" />
                ))}
              </View>
            </View>
          )}

          <View style={styles.footer}>
            <PawPrint size={16} strokeWidth={1.5} color={colors.accent} />
            <Text style={styles.footerText}>Página creada con PawMates</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { alignItems: 'center', paddingBottom: space.s8 },
  page: { gap: space.s4, paddingBottom: space.s4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s3, paddingHorizontal: space.s6 },
  notFoundTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.text },
  notFoundBody: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted70, textAlign: 'center' },

  cover: { width: '100%', height: 240, backgroundColor: colors.accent100 },
  coverEmpty: { alignItems: 'center', justifyContent: 'center' },

  headerBlock: { paddingHorizontal: space.s4, gap: space.s2 },
  name: { fontFamily: fonts.heading, fontSize: 30, color: colors.text },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bio: { paddingHorizontal: space.s4, fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.text, opacity: 0.85 },

  ctaButton: {
    marginHorizontal: space.s4,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.s2,
    paddingVertical: 14, borderRadius: radius.pill, backgroundColor: colors.accent,
  },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.bg },

  infoCard: {
    marginHorizontal: space.s4, gap: space.s2,
    padding: space.s4, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  infoText: { flex: 1, fontFamily: fonts.body, fontSize: 13.5, color: colors.text, opacity: 0.85 },

  section: { paddingHorizontal: space.s4, gap: space.s2 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 },
  galleryPhoto: { width: 150, height: 112, borderRadius: radius.sm, backgroundColor: colors.surface },

  footer: {
    marginTop: space.s4, paddingTop: space.s4, marginHorizontal: space.s4,
    borderTopWidth: 1, borderTopColor: colors.divider,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  footerText: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted50 },
});
