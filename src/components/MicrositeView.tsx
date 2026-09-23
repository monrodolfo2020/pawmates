import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import { CalendarCheck, Clock, MapPin, MessageCircle, Navigation, PawPrint, Quote, ShieldCheck } from 'lucide-react-native';
import { CATEGORY_LABELS_SINGULAR, PageDesign, PageSection, ProviderDetail, isBookable } from '../api/client';
import { fonts, radius, space } from '../theme/tokens';
import { micrositeUrl, whatsappUrl } from '../utils/contactLinks';
import { reservationPath } from '../navigation/reservationIntent';

type Props = {
  business: ProviderDetail;
  design: PageDesign;
  /** Shrinks everything for the editor's side-by-side preview, where the
   * page renders inside a phone-sized frame rather than full screen. */
  compact?: boolean;
};

const money = (cents: number, currency: string) => '$' + (cents / 100).toFixed(0) + ' ' + currency;

// The page a visitor gets at /s/<slug>, and the same thing the VIP
// editor previews live while you change it. Every color and font comes
// from `design`, never from the app's own theme — a business's page has
// to look like the business, not like PawMates (the free plan just gets
// handed PawMates' defaults as its design; see the backend's
// ProviderProfile.effectiveDesign).
export default function MicrositeView({ business, design, compact = false }: Props) {
  // The page always fills whatever column it's given — the public screen
  // caps that at a readable width, the editor hands it a phone-sized
  // frame — so the only difference here is that everything inside the
  // editor's frame is scaled down to match.
  const scale = compact ? 0.82 : 1;

  const heading = design.font === 'display' ? fonts.display : fonts.bodyBold;
  const cover = design.cover ?? business.photos[0] ?? business.photo;
  // Whichever photo became the cover shouldn't repeat inside the gallery.
  const gallery = business.photos.filter((uri) => uri !== cover);
  const waUrl = business.whatsapp ? whatsappUrl(business.whatsapp, business.name) : null;
  const canReserve = isBookable(business.category) && Boolean(business.slug);
  // Exact coordinates when the business placed itself on the map, and a
  // text search as the fallback — the point of storing the coordinate is
  // that "Cómo llegar" stops guessing.
  const mapUrl =
    business.latitude !== null && business.longitude !== null
      ? `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
      : business.publicAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.publicAddress)}`
        : null;

  const muted = (opacity: number) => ({ color: design.textColor, opacity });
  const enabled = (id: PageSection) =>
    design.sections.find((s) => s.id === id)?.enabled ?? true;

  const sectionTitle = (text: string) => (
    <Text style={[styles.sectionTitle, { fontFamily: heading, color: design.textColor, fontSize: (design.font === 'display' ? 23 : 18) * scale }]}>
      {text}
    </Text>
  );

  const renderSection = (id: PageSection) => {
    if (!enabled(id)) return null;
    switch (id) {
      case 'about':
        return business.bio ? (
          <Text key={id} style={[styles.body, muted(0.85), { fontSize: 14 * scale }]}>{business.bio}</Text>
        ) : null;

      case 'services':
        return business.plansOffered ? (
          <View key={id} style={styles.section}>
            {sectionTitle('Servicios')}
            <Text style={[styles.body, muted(0.85), { paddingHorizontal: 0, fontSize: 14 * scale }]}>
              {business.plansOffered}
            </Text>
          </View>
        ) : null;

      case 'gallery':
        return gallery.length > 0 ? (
          <View key={id} style={styles.section}>
            {sectionTitle('Galería')}
            <View style={styles.galleryGrid}>
              {gallery.map((uri) => (
                <Image
                  key={uri}
                  source={{ uri }}
                  style={[styles.galleryPhoto, { width: 150 * scale, height: 112 * scale }]}
                  resizeMode="cover"
                />
              ))}
            </View>
          </View>
        ) : null;

      case 'hours':
        return business.publicAddress || business.hours || business.serviceArea ? (
          <View key={id} style={[styles.infoCard, { borderColor: design.primaryColor + '33' }]}>
            {(business.publicAddress || business.serviceArea) && (
              <View style={styles.infoRow}>
                <MapPin size={16 * scale} strokeWidth={1.5} color={design.primaryColor} />
                <Text style={[styles.infoText, muted(0.85), { fontSize: 13.5 * scale }]}>
                  {business.publicAddress ?? `Zona de servicio: ${business.serviceArea}`}
                </Text>
              </View>
            )}
            {business.hours && (
              <View style={styles.infoRow}>
                <Clock size={16 * scale} strokeWidth={1.5} color={design.primaryColor} />
                <Text style={[styles.infoText, muted(0.85), { fontSize: 13.5 * scale }]}>{business.hours}</Text>
              </View>
            )}
          </View>
        ) : null;

      case 'testimonials':
        return design.testimonials.length > 0 ? (
          <View key={id} style={styles.section}>
            {sectionTitle('Lo que dicen')}
            {design.testimonials.map((t, i) => (
              <View key={i} style={[styles.testimonial, { borderLeftColor: design.primaryColor }]}>
                <Quote size={14 * scale} strokeWidth={2} color={design.primaryColor} />
                <Text style={[styles.body, muted(0.85), { paddingHorizontal: 0, fontSize: 13.5 * scale }]}>
                  {t.text}
                </Text>
                {!!t.author && (
                  <Text style={[styles.testimonialAuthor, muted(0.55), { fontSize: 12 * scale }]}>
                    — {t.author}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : null;

      case 'map':
        // No maps SDK in this app — a "take me there" link into the
        // visitor's own maps app does the actual job of a map here.
        return mapUrl ? (
          <Pressable
            key={id}
            style={[styles.outlineButton, { borderColor: design.primaryColor }]}
            onPress={() => void Linking.openURL(mapUrl)}
          >
            <Navigation size={16 * scale} strokeWidth={2} color={design.primaryColor} />
            <Text style={[styles.outlineButtonText, { color: design.primaryColor, fontSize: 14 * scale }]}>
              Cómo llegar
            </Text>
          </Pressable>
        ) : null;

      case 'contact':
        return waUrl ? (
          // Second to "Reservar en PawMates" when that button is on the page,
          // so the page has one filled button, not two.
          <Pressable
            key={id}
            style={
              canReserve
                ? [styles.outlineButton, { borderColor: design.primaryColor }]
                : [styles.ctaButton, { backgroundColor: design.primaryColor }]
            }
            onPress={() => void Linking.openURL(waUrl)}
          >
            <MessageCircle size={18 * scale} strokeWidth={2} color={canReserve ? design.primaryColor : '#fff'} />
            <Text
              style={
                canReserve
                  ? [styles.outlineButtonText, { color: design.primaryColor, fontSize: 14 * scale }]
                  : [styles.ctaText, { fontSize: 15 * scale }]
              }
            >
              Escríbenos por WhatsApp
            </Text>
          </Pressable>
        ) : null;

      default:
        return null;
    }
  };

  const orderedSections = design.sections.map((s) => s.id);
  // 'gallery' leads on the gallery template, whatever order the sections
  // are otherwise in — that's what makes it the gallery template.
  const sectionOrder =
    design.template === 'gallery'
      ? ['gallery' as PageSection, ...orderedSections.filter((id) => id !== 'gallery')]
      : orderedSections;

  const showCover = design.template !== 'minimal' && cover;

  return (
    <View style={[styles.page, { backgroundColor: design.backgroundColor }]}>
      {showCover ? (
        <Image source={{ uri: cover! }} style={[styles.cover, { height: 240 * scale }]} resizeMode="cover" />
      ) : (
        <View
          style={[
            styles.coverBand,
            // Without a photo, a soft wash of the page's color rather than a
            // solid slab of it: the name below is what should stand out.
            { height: (design.template === 'minimal' ? 96 : 160) * scale, backgroundColor: design.primaryColor + '1F' },
          ]}
        >
          {!design.logo && <PawPrint size={40 * scale} strokeWidth={1.5} color={design.primaryColor} />}
        </View>
      )}

      <View style={[styles.headerBlock, design.logo ? { marginTop: -28 * scale } : null]}>
        {design.logo && (
          <Image
            source={{ uri: design.logo }}
            style={[
              styles.logo,
              {
                width: 64 * scale,
                height: 64 * scale,
                borderRadius: 32 * scale,
                borderColor: design.backgroundColor,
              },
            ]}
            resizeMode="cover"
          />
        )}
        <Text style={[styles.name, { fontFamily: heading, color: design.textColor, fontSize: (design.font === 'display' ? 38 : 30) * scale }]}>
          {business.name}
        </Text>
        <Text style={[styles.meta, muted(0.7), { fontSize: 14.5 * scale }]}>
          {[CATEGORY_LABELS_SINGULAR[business.category], business.specialty].filter(Boolean).join(' · ')}
        </Text>
        {(business.price || business.identityVerified) && (
          <View style={styles.badges}>
            {business.price && (
              <Text style={[styles.price, { color: design.textColor, fontSize: 15 * scale }]}>
                {money(business.price.amount, business.price.currency)}
                <Text style={[styles.meta, muted(0.7)]}> por paseo</Text>
              </Text>
            )}
            {business.identityVerified && (
              <View style={styles.verified}>
                <ShieldCheck size={15 * scale} strokeWidth={2} color={design.primaryColor} />
                <Text style={[styles.verifiedText, { color: design.primaryColor, fontSize: 13 * scale }]}>
                  Identidad verificada
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* The one thing a page can do that a WhatsApp link can't: send the
          visitor into PawMates to request a walk, with the business
          already open. Only businesses that can be booked get it. */}
      {canReserve && (
        <Pressable
          accessibilityRole="link"
          style={[styles.ctaButton, { backgroundColor: design.primaryColor }]}
          onPress={() => openReservation(business.slug!, compact)}
        >
          <CalendarCheck size={18 * scale} strokeWidth={2} color="#fff" />
          <Text style={[styles.ctaText, { fontSize: 15 * scale }]}>Reservar en PawMates</Text>
        </Pressable>
      )}

      {sectionOrder.map(renderSection)}

      <View style={[styles.footer, { borderTopColor: design.textColor + '22' }]}>
        <PawPrint size={14 * scale} strokeWidth={1.5} color={design.primaryColor} />
        <Text style={[styles.footerText, muted(0.5), { fontSize: 12 * scale }]}>
          Página creada con PawMates
        </Text>
      </View>
    </View>
  );
}

/** Same tab on the public page (it's the next step, not a detour); a new
 * one from the editor's preview, so the editor stays where it was. */
function openReservation(slug: string, fromPreview: boolean) {
  const url = reservationPath(micrositeUrl(slug));
  if (Platform.OS === 'web' && typeof window !== 'undefined' && !fromPreview) window.location.assign(url);
  else void Linking.openURL(url);
}

const styles = StyleSheet.create({
  page: { width: '100%', gap: space.s4, paddingBottom: space.s6 },
  cover: { width: '100%' },
  coverBand: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  headerBlock: { paddingHorizontal: space.s4, gap: space.s2 },
  logo: { borderWidth: 3 },
  name: {},
  badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: space.s4, rowGap: space.s1 },
  meta: { fontFamily: fonts.body },
  price: { fontFamily: fonts.bodyBold },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontFamily: fonts.bodySemiBold },

  body: { paddingHorizontal: space.s4, fontFamily: fonts.body, lineHeight: 21 },
  section: { paddingHorizontal: space.s4, gap: space.s2 },
  sectionTitle: {},

  ctaButton: {
    marginHorizontal: space.s4,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.s2,
    paddingVertical: 14, borderRadius: radius.pill,
  },
  ctaText: { fontFamily: fonts.bodyBold, color: '#fff' },
  outlineButton: {
    marginHorizontal: space.s4,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.s2,
    paddingVertical: 12, borderRadius: radius.pill, borderWidth: 1,
  },
  outlineButtonText: { fontFamily: fonts.bodyBold },

  infoCard: {
    marginHorizontal: space.s4, gap: space.s2,
    padding: space.s4, borderRadius: radius.lg, borderWidth: 1,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  infoText: { flex: 1, fontFamily: fonts.body },

  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 },
  galleryPhoto: { borderRadius: radius.sm },

  testimonial: { gap: 4, paddingLeft: space.s3, borderLeftWidth: 3 },
  testimonialAuthor: { fontFamily: fonts.bodyMedium },

  footer: {
    marginTop: space.s4, paddingTop: space.s4, marginHorizontal: space.s4, borderTopWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  footerText: { fontFamily: fonts.body },
});
