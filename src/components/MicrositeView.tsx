import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import { AtSign, CalendarCheck, CirclePlay, Clock, Globe, MapPin, MessageCircle, Navigation, PawPrint, Quote, ShieldCheck, Tag } from 'lucide-react-native';
import {
  CATEGORY_LABELS_SINGULAR,
  PageDesign,
  PageDesignSection,
  PageSection,
  ProviderDetail,
  isAddedBlock,
  isBookable,
} from '../api/client';
import { fonts, pageFonts, radius, space } from '../theme/tokens';
import { micrositeUrl, whatsappUrl } from '../utils/contactLinks';
import { reservationPath } from '../navigation/reservationIntent';

type Props = {
  business: ProviderDetail;
  design: PageDesign;
  /** Shrinks everything for the editor's side-by-side preview, where the
   * page renders inside a phone-sized frame rather than full screen. */
  compact?: boolean;
  /** The editor's Edición mode: every entry (hidden or empty ones too)
   * goes through `wrap`, which adds its tap-to-edit frame. */
  editing?: { wrap: (section: PageDesignSection, content: React.ReactNode) => React.ReactNode };
};

const money = (cents: number, currency: string) => '$' + (cents / 100).toFixed(0) + ' ' + currency;

// The page a visitor gets at /s/<slug>, and the same thing the VIP
// editor previews live while you change it. Every color and font comes
// from `design`, never from the app's own theme — a business's page has
// to look like the business, not like PawMates (the free plan just gets
// handed PawMates' defaults as its design; see the backend's
// ProviderProfile.effectiveDesign).
export default function MicrositeView({ business, design, compact = false, editing }: Props) {
  // The page always fills whatever column it's given — the public screen
  // caps that at a readable width, the editor hands it a phone-sized
  // frame — so the only difference here is that everything inside the
  // editor's frame is scaled down to match.
  const scale = compact ? 0.82 : 1;

  const face = pageFonts[design.font] ?? pageFonts.display;
  const heading = face.family;
  // "Grande" enlarges every text on the page, titles a little less.
  const big = design.textSize === 'large';
  const ts = scale * (big ? 1.15 : 1);
  const hs = scale * (big ? 1.08 : 1);
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

  const sectionTitle = (text: string) => (
    <Text style={[styles.sectionTitle, { fontFamily: heading, color: design.textColor, fontSize: face.section * hs }]}>
      {text}
    </Text>
  );

  const renderSection = (id: PageSection) => {
    switch (id) {
      case 'about':
        return business.bio ? (
          <Text key={id} style={[styles.body, muted(0.85), { fontSize: 14 * ts }]}>{business.bio}</Text>
        ) : null;

      case 'services':
        return business.plansOffered ? (
          <View key={id} style={styles.section}>
            {sectionTitle('Servicios')}
            <Text style={[styles.body, muted(0.85), { paddingHorizontal: 0, fontSize: 14 * ts }]}>
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
                <Text style={[styles.infoText, muted(0.85), { fontSize: 13.5 * ts }]}>
                  {business.publicAddress ?? `Zona de servicio: ${business.serviceArea}`}
                </Text>
              </View>
            )}
            {business.hours && (
              <View style={styles.infoRow}>
                <Clock size={16 * scale} strokeWidth={1.5} color={design.primaryColor} />
                <Text style={[styles.infoText, muted(0.85), { fontSize: 13.5 * ts }]}>{business.hours}</Text>
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
                <Text style={[styles.body, muted(0.85), { paddingHorizontal: 0, fontSize: 13.5 * ts }]}>
                  {t.text}
                </Text>
                {!!t.author && (
                  <Text style={[styles.testimonialAuthor, muted(0.55), { fontSize: 12 * ts }]}>
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
            <Text style={[styles.outlineButtonText, { color: design.primaryColor, fontSize: 14 * ts }]}>
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
                  ? [styles.outlineButtonText, { color: design.primaryColor, fontSize: 14 * ts }]
                  : [styles.ctaText, { fontSize: 15 * ts }]
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

  // 'gallery' leads on the gallery template, whatever order the sections
  // are otherwise in — that's what makes it the gallery template.
  const sectionOrder =
    design.template === 'gallery'
      ? [
          ...design.sections.filter((x) => x.id === 'gallery'),
          ...design.sections.filter((x) => x.id !== 'gallery'),
        ]
      : design.sections;

  const renderBlock = (section: PageDesignSection) => {
    const d = section.data ?? {};
    const title = (fallback: string) => sectionTitle(d.title || fallback);
    const bodyText = (value: string, size = 14) => (
      <Text style={[styles.body, muted(0.85), { paddingHorizontal: 0, fontSize: size * scale }]}>{value}</Text>
    );
    const rows = (d.items ?? []).filter((it) => it.name || it.detail);
    switch (section.type) {
      case 'hero':
        return d.title || d.subtitle ? (
          <View style={[styles.hero, { backgroundColor: design.primaryColor + '14', borderColor: design.primaryColor + '33' }]}>
            {!!d.title && (
              <Text style={{ fontFamily: heading, color: design.textColor, fontSize: face.hero * hs, lineHeight: face.hero * 1.15 * hs }}>
                {d.title}
              </Text>
            )}
            {!!d.subtitle && bodyText(d.subtitle, 15)}
          </View>
        ) : null;

      case 'text':
        return d.title || d.body ? (
          <View style={styles.section}>
            {!!d.title && sectionTitle(d.title)}
            {!!d.body && bodyText(d.body)}
          </View>
        ) : null;

      case 'prices':
        return rows.length ? (
          <View style={styles.section}>
            {title('Precios')}
            {rows.map((it, i) => (
              <View key={i} style={[styles.priceRow, i > 0 && { borderTopColor: design.textColor + '1A', borderTopWidth: 1 }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.rowName, { color: design.textColor, fontSize: 14.5 * ts }]}>{it.name}</Text>
                  {!!it.detail && <Text style={[styles.meta, muted(0.65), { fontSize: 13 * ts }]}>{it.detail}</Text>}
                </View>
                {!!it.price && <Text style={[styles.price, { color: design.textColor, fontSize: 15 * ts }]}>{it.price}</Text>}
              </View>
            ))}
          </View>
        ) : null;

      case 'faq':
        return rows.length ? (
          <View style={styles.section}>
            {title('Preguntas frecuentes')}
            {rows.map((it, i) => (
              <View key={i} style={{ gap: 2, marginTop: i ? space.s2 : 0 }}>
                <Text style={[styles.rowName, { color: design.textColor, fontSize: 14.5 * ts }]}>{it.name}</Text>
                {!!it.detail && bodyText(it.detail, 13.5)}
              </View>
            ))}
          </View>
        ) : null;

      case 'team':
        return rows.length ? (
          <View style={styles.section}>
            {title('Nuestro equipo')}
            <View style={styles.teamGrid}>
              {rows.map((it, i) => (
                <View key={i} style={styles.teamMember}>
                  <View style={[styles.teamAvatar, { backgroundColor: design.primaryColor + '1F', width: 44 * scale, height: 44 * scale }]}>
                    <Text style={{ fontFamily: fonts.bodyBold, color: design.primaryColor, fontSize: 16 * ts }}>
                      {(it.name.trim()[0] ?? '?').toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowName, { color: design.textColor, fontSize: 14 * ts }]}>{it.name}</Text>
                    {!!it.detail && <Text style={[styles.meta, muted(0.65), { fontSize: 12.5 * ts }]}>{it.detail}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null;

      case 'promo': {
        const expired = !!d.until && d.until < todayIso();
        if (!d.title && !d.body) return null;
        // A promotion past its date hides itself on the live page; the
        // editor still shows it, marked, so it can be updated or removed.
        if (expired && !editing) return null;
        return (
          <View style={[styles.promo, { borderColor: design.primaryColor, backgroundColor: design.primaryColor + '0F' }]}>
            <View style={styles.infoRow}>
              <Tag size={16 * scale} strokeWidth={2} color={design.primaryColor} />
              <Text style={[styles.rowName, { color: design.textColor, fontSize: 16 * ts, flex: 1 }]}>{d.title}</Text>
            </View>
            {!!d.body && bodyText(d.body)}
            {!!d.until && (
              <Text style={[styles.meta, { color: design.primaryColor, fontSize: 12.5 * ts }]}>
                {expired ? 'Terminó el ' : 'Válida hasta el '}
                {formatDay(d.until)}
              </Text>
            )}
          </View>
        );
      }

      case 'social': {
        const links = socialLinks(d);
        return links.length ? (
          <View style={[styles.section, styles.socialRow]}>
            {links.map((l) => (
              <Pressable
                key={l.label}
                accessibilityRole="link"
                onPress={() => void Linking.openURL(l.url)}
                style={[styles.socialPill, { borderColor: design.primaryColor }]}
              >
                {l.label === 'Sitio web' ? (
                  <Globe size={14 * scale} strokeWidth={2} color={design.primaryColor} />
                ) : (
                  <AtSign size={14 * scale} strokeWidth={2} color={design.primaryColor} />
                )}
                <Text style={[styles.outlineButtonText, { color: design.primaryColor, fontSize: 13.5 * ts }]}>{l.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null;
      }

      case 'video':
        return d.url ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(d.url!)}
            style={[styles.video, { backgroundColor: design.textColor + '0D', borderColor: design.textColor + '1A' }]}
          >
            <CirclePlay size={36 * scale} strokeWidth={1.5} color={design.primaryColor} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowName, { color: design.textColor, fontSize: 15 * ts }]}>{d.title || 'Mira nuestro video'}</Text>
              <Text style={[styles.meta, muted(0.6), { fontSize: 12.5 * ts }]}>{videoHost(d.url)}</Text>
            </View>
          </Pressable>
        ) : null;

      default:
        return null;
    }
  };

  const renderEntry = (section: PageDesignSection) => {
    const content = isAddedBlock(section) ? renderBlock(section) : renderSection(section.type as PageSection);
    if (editing) return <React.Fragment key={section.id}>{editing.wrap(section, content)}</React.Fragment>;
    if (!section.enabled || !content) return null;
    return <React.Fragment key={section.id}>{content}</React.Fragment>;
  };

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
        <Text style={[styles.name, { fontFamily: heading, color: design.textColor, fontSize: face.name * hs }]}>
          {business.name}
        </Text>
        <Text style={[styles.meta, muted(0.7), { fontSize: 14.5 * ts }]}>
          {[CATEGORY_LABELS_SINGULAR[business.category], business.specialty].filter(Boolean).join(' · ')}
        </Text>
        {(business.price || business.identityVerified) && (
          <View style={styles.badges}>
            {business.price && (
              <Text style={[styles.price, { color: design.textColor, fontSize: 15 * ts }]}>
                {money(business.price.amount, business.price.currency)}
                <Text style={[styles.meta, muted(0.7)]}> por paseo</Text>
              </Text>
            )}
            {business.identityVerified && (
              <View style={styles.verified}>
                <ShieldCheck size={15 * scale} strokeWidth={2} color={design.primaryColor} />
                <Text style={[styles.verifiedText, { color: design.primaryColor, fontSize: 13 * ts }]}>
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
          <Text style={[styles.ctaText, { fontSize: 15 * ts }]}>Reservar en PawMates</Text>
        </Pressable>
      )}

      {sectionOrder.map(renderEntry)}

      <View style={[styles.footer, { borderTopColor: design.textColor + '22' }]}>
        <PawPrint size={14 * scale} strokeWidth={1.5} color={design.primaryColor} />
        <Text style={[styles.footerText, muted(0.5), { fontSize: 12 * ts }]}>
          Página creada con PawMates
        </Text>
      </View>
    </View>
  );
}

const todayIso = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const formatDay = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });

/** A handle ("@paseospedro" or "paseospedro") or a full link, as typed. */
function profileUrl(value: string, base: string, at = false): string {
  if (/^https:\/\//i.test(value)) return value;
  const name = value.replace(/^@/, '');
  return `${base}${at ? '@' : ''}${name}`;
}

export function socialLinks(d: { instagram?: string; facebook?: string; tiktok?: string; website?: string }) {
  return [
    d.instagram && { label: 'Instagram', url: profileUrl(d.instagram, 'https://instagram.com/') },
    d.facebook && { label: 'Facebook', url: profileUrl(d.facebook, 'https://facebook.com/') },
    d.tiktok && { label: 'TikTok', url: profileUrl(d.tiktok, 'https://www.tiktok.com/', true) },
    d.website && { label: 'Sitio web', url: d.website },
  ].filter(Boolean) as { label: string; url: string }[];
}

function videoHost(url: string): string {
  if (/youtu\.?be/i.test(url)) return 'YouTube';
  if (/tiktok/i.test(url)) return 'TikTok';
  if (/instagram/i.test(url)) return 'Instagram';
  if (/facebook|fb\.watch/i.test(url)) return 'Facebook';
  return 'Video';
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

  hero: { marginHorizontal: space.s4, padding: space.s5, borderRadius: radius.lg, borderWidth: 1, gap: space.s2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: space.s3, paddingVertical: space.s2 },
  rowName: { fontFamily: fonts.bodySemiBold },
  teamGrid: { gap: space.s3 },
  teamMember: { flexDirection: 'row', alignItems: 'center', gap: space.s3 },
  teamAvatar: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  promo: { marginHorizontal: space.s4, padding: space.s4, borderRadius: radius.lg, borderWidth: 1.5, gap: space.s2 },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 },
  socialPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: space.s3, paddingVertical: space.s2, borderRadius: radius.pill, borderWidth: 1,
  },
  video: {
    marginHorizontal: space.s4, flexDirection: 'row', alignItems: 'center', gap: space.s3,
    padding: space.s4, borderRadius: radius.lg, borderWidth: 1,
  },

  footer: {
    marginTop: space.s4, paddingTop: space.s4, marginHorizontal: space.s4, borderTopWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  footerText: { fontFamily: fonts.body },
});
