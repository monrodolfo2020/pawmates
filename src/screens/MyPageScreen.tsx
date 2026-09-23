import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { Link2, ExternalLink, Copy, Check, Sparkles } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import Card from '../components/Card';
import { CardMeta, CardTitle } from '../components/CardText';
import Segmented from '../components/Segmented';
import Tag from '../components/Tag';
import MicrositeView from '../components/MicrositeView';
import PageDesignEditor from '../components/PageDesignEditor';
import PlanCard from '../components/PlanCard';
import QrCard from '../components/QrCard';
import { colors, fonts, radius, space } from '../theme/tokens';
import { api, MyProviderProfile, PageDesign, ProviderDetail } from '../api/client';
import { listInSpanish, missingToPublish } from '../utils/pageStatus';
import { useAppState } from '../state/AppState';
import { micrositeUrl } from '../utils/contactLinks';
import ScreenHeader from '../components/ScreenHeader';
import Notice from '../components/Notice';

type Props = NativeStackScreenProps<RootStackParamList, 'MyPage'>;

type Tab = 'online' | 'design';

/** MicrositeView renders the public shape, so the preview feeds it the
 * same fields off the owner's own profile. */
function asBusiness(profile: MyProviderProfile): ProviderDetail {
  return {
    accountId: profile.accountId,
    name: profile.businessName ?? 'Tu negocio',
    category: profile.category,
    slug: profile.slug,
    photo: profile.photo,
    serviceArea: profile.serviceArea,
    specialty: profile.specialty,
    price: profile.price,
    plansOffered: profile.plansOffered,
    walkingSpots: profile.walkingSpots,
    emailVerified: true,
    identityVerified: false,
    bio: profile.bio,
    photos: profile.photos,
    publicAddress: profile.publicAddress,
    hours: profile.hours,
    whatsapp: profile.whatsapp,
    latitude: profile.latitude,
    longitude: profile.longitude,
    plan: profile.plan,
    design: profile.design,
  };
}

/**
 * The business's own view of its micro-page, in the two halves the
 * product is built around: "En línea" is what the public actually gets
 * (plus the link to share it), and "Diseño" is the VIP editor. They're
 * separate because edits land in a draft — nothing a business changes
 * here shows up at /s/<slug> until it presses Publicar.
 */
export default function MyPageScreen({ navigation }: Props) {
  const s = useAppState();
  const [profile, setProfile] = useState<MyProviderProfile | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('online');
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState<PageDesign | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(() => {
    if (!s.token) return;
    api
      .getMyProviderProfile(s.token)
      .then((p) => {
        setProfile(p);
        setDraft(p?.design ?? null);
      })
      .catch(() => setProfile(null));
  }, [s.token]);

  useFocusEffect(loadProfile);

  const url = profile?.slug ? micrositeUrl(profile.slug) : null;
  const isVip = profile?.isVip ?? false;
  const complete = profile?.isPublished ?? false;
  const approved = profile?.approvedAt != null;
  // The backend's answer, not ours: the share link and the QR would lead
  // to a page that doesn't open until it says so.
  const published = profile?.isPubliclyVisible ?? false;
  const missing = profile ? missingToPublish(profile) : [];
  // Either an edit that hasn't been saved yet, or one saved as a draft
  // that hasn't been published — both mean "the live page is behind".
  const dirty = Boolean(
    profile && draft && (JSON.stringify(draft) !== JSON.stringify(profile.design) || profile.hasUnpublishedDesign),
  );

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied (or missing outside a browser) —
      // the link is on screen right next to this button either way.
    }
  };

  /** Saves the draft, then (optionally) makes it the live page. */
  const save = async (thenPublish: boolean) => {
    if (!s.token || !draft) return;
    setBusy(true);
    setError(null);
    try {
      // A testimonial with no text is a half-filled row, not something to
      // send — the backend rejects it outright.
      const design = { ...draft, testimonials: draft.testimonials.filter((t) => t.text.trim()) };
      let saved = await api.saveMyProviderProfile(s.token, { design });
      if (thenPublish) saved = await api.publishPageDesign(s.token);
      setProfile(saved);
      setDraft(saved.design);
      if (thenPublish) setTab('online');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el diseño.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => navigation.goBack()} title="Mi página" />

      <View style={styles.tabs}>
        <Segmented
          options={[
            { label: 'En línea', value: 'online' },
            { label: 'Diseño', value: 'design' },
          ]}
          value={tab}
          onChange={(v) => setTab(v as Tab)}
        />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {profile === undefined && <CardMeta>Cargando…</CardMeta>}

        {profile !== undefined && tab === 'online' && (
          <>
            <Card>
              <View style={styles.rowBetween}>
                <CardTitle>Estado</CardTitle>
                <View style={styles.rowStart}>
                  {isVip && <Tag variant="success">VIP</Tag>}
                  <Tag variant={published ? 'success' : 'warning'}>
                    {published ? 'Publicada ✓' : !approved ? 'En revisión' : 'Sin publicar'}
                  </Tag>
                </View>
              </View>
              {!approved && (
                <CardMeta>
                  Estamos revisando tu negocio. Mientras tanto puedes preparar tu página; nadie más la
                  ve todavía. Te avisaremos por correo, con tu enlace y tu código QR, en cuanto esté en
                  línea.
                </CardMeta>
              )}
              {!complete && (
                <CardMeta>
                  {missing.length
                    ? `Falta ${listInSpanish(missing)} para que tu página sea visible.`
                    : 'Completa tu página para publicarla.'}
                </CardMeta>
              )}
            </Card>

            {isVip && profile && profile.hasUnpublishedDesign && (
              <Card>
                <CardTitle>Tienes cambios sin publicar</CardTitle>
                <CardMeta>
                  Tu nuevo diseño está guardado pero la página que ven tus clientes sigue igual.
                </CardMeta>
                <Button variant="primary" block onPress={() => void save(true)}>
                  {busy ? 'Publicando…' : 'Publicar cambios'}
                </Button>
              </Card>
            )}

            {published && url && (
              <Card>
                <View style={styles.rowStart}>
                  <Link2 size={18} strokeWidth={1.75} color={colors.textMuted} />
                  <CardTitle style={{ flex: 1 }}>Tu enlace para compartir</CardTitle>
                </View>
                <View style={styles.linkBox}>
                  <Text style={styles.linkText} selectable numberOfLines={2}>
                    {url}
                  </Text>
                </View>
                <View style={styles.actionsRow}>
                  <Button
                    variant="secondary"
                    style={{ flex: 1 }}
                    icon={
                      copied ? (
                        <Check size={14} strokeWidth={2} color={colors.text} />
                      ) : (
                        <Copy size={14} strokeWidth={1.5} color={colors.text} />
                      )
                    }
                    onPress={() => void copyLink()}
                  >
                    {copied ? 'Copiado' : 'Copiar enlace'}
                  </Button>
                  <Button
                    variant="primary"
                    style={{ flex: 1 }}
                    icon={<ExternalLink size={14} strokeWidth={1.5} color={colors.onAccent} />}
                    onPress={() => void Linking.openURL(url)}
                  >
                    Ver mi página
                  </Button>
                </View>
                <CardMeta>
                  Compártelo en tus redes o con tus clientes: se abre sin necesidad de crear una cuenta.
                </CardMeta>
              </Card>
            )}

            {published && profile?.slug && <QrCard slug={profile.slug} />}

            <Button variant="secondary" block onPress={() => navigation.navigate('ProviderProfileEdit')}>
              Editar mi página
            </Button>

            {profile && (
              <View style={styles.previewBlock}>
                <Text style={styles.previewLabel}>Así se ve tu página publicada</Text>
                <View style={styles.previewFrame}>
                  <MicrositeView
                    business={asBusiness(profile)}
                    design={profile.publishedDesign ?? profile.design}
                    compact
                  />
                </View>
              </View>
            )}
          </>
        )}

        {profile !== undefined && tab === 'design' && (
          <>
            {!isVip && <PlanCard onActivated={loadProfile} />}

            {isVip && profile && draft && (
              <>
                <View style={styles.rowStart}>
                  <Sparkles size={16} strokeWidth={1.75} color={colors.textMuted} />
                  <Text style={styles.previewLabel}>Vista previa en vivo</Text>
                </View>
                <View style={styles.previewFrame}>
                  <MicrositeView business={asBusiness(profile)} design={draft} compact />
                </View>

                <PageDesignEditor design={draft} onChange={setDraft} />

                {error && <Notice tone="danger">{error}</Notice>}

                <View style={styles.actionsRow}>
                  <Button variant="secondary" style={{ flex: 1 }} disabled={busy} onPress={() => void save(false)}>
                    {busy ? 'Guardando…' : 'Guardar borrador'}
                  </Button>
                  <Button
                    variant="primary"
                    style={{ flex: 1 }}
                    disabled={busy || !dirty}
                    onPress={() => void save(true)}
                  >
                    Publicar
                  </Button>
                </View>
                <CardMeta>
                  Tus cambios no se ven en tu enlace público hasta que publiques.
                </CardMeta>

                <PlanCard onActivated={loadProfile} />
              </>
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabs: { paddingHorizontal: space.s4, paddingBottom: space.s3 },
  body: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowStart: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  linkBox: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    backgroundColor: colors.panel, borderRadius: radius.sm,
  },
  linkText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  actionsRow: { flexDirection: 'row', gap: space.s2 },

  previewBlock: { gap: space.s2 },
  previewLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textMuted },
  previewFrame: {
    borderWidth: 1, borderColor: colors.divider, borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
