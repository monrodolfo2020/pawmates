import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { ChevronLeft, Link2, ExternalLink, Copy, Check, Lock, Sparkles } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import Card from '../components/Card';
import { CardBody, CardMeta } from '../components/CardText';
import Segmented from '../components/Segmented';
import Tag from '../components/Tag';
import MicrositeView from '../components/MicrositeView';
import PageDesignEditor from '../components/PageDesignEditor';
import { colors, fonts, radius, space } from '../theme/tokens';
import { api, MyProviderProfile, PageDesign, ProviderDetail, isBookable } from '../api/client';
import { useAppState } from '../state/AppState';
import { micrositeUrl } from '../utils/contactLinks';

type Props = NativeStackScreenProps<RootStackParamList, 'MyPage'>;

type Tab = 'online' | 'design';

/** What the business still has to fill in before its page goes live —
 * mirrors ProviderProfile's publish rule on the backend, which is what
 * actually decides. */
function missingToPublish(profile: MyProviderProfile): string[] {
  const missing: string[] = [];
  if (!profile.businessName) missing.push('el nombre del negocio');
  if (!profile.bio) missing.push('la descripción');
  if (isBookable(profile.category) && !profile.price) missing.push('la tarifa por paseo');
  return missing;
}

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

  useFocusEffect(
    useCallback(() => {
      if (!s.token) return;
      api
        .getMyProviderProfile(s.token)
        .then((p) => {
          setProfile(p);
          setDraft(p?.design ?? null);
        })
        .catch(() => setProfile(null));
    }, [s.token]),
  );

  const url = profile?.slug ? micrositeUrl(profile.slug) : null;
  const isVip = profile?.plan === 'vip';
  const published = profile?.isPublished ?? false;
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
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>Mi página</Text>
      </View>

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
                <CardBody style={{ margin: 0 }}>Estado</CardBody>
                <View style={styles.rowStart}>
                  {isVip && <Tag variant="accent">VIP</Tag>}
                  <Tag variant={published ? 'accent' : 'outline'}>
                    {published ? 'Publicada ✓' : 'Sin publicar'}
                  </Tag>
                </View>
              </View>
              {!published && (
                <CardMeta>
                  {missing.length
                    ? `Falta ${missing.join(', ')} para que tu página sea visible.`
                    : 'Completa tu página para publicarla.'}
                </CardMeta>
              )}
            </Card>

            {isVip && profile && profile.hasUnpublishedDesign && (
              <Card>
                <CardBody style={{ margin: 0 }}>Tienes cambios sin publicar</CardBody>
                <CardMeta>
                  Tu nuevo diseño está guardado pero la página que ven tus clientes sigue igual.
                </CardMeta>
                <Button variant="primary" block blueprint onPress={() => void save(true)}>
                  {busy ? 'Publicando…' : 'Publicar cambios'}
                </Button>
              </Card>
            )}

            {published && url && (
              <Card>
                <View style={styles.rowStart}>
                  <Link2 size={18} strokeWidth={1.5} color={colors.accent} />
                  <CardBody style={{ margin: 0, flex: 1 }}>Tu enlace para compartir</CardBody>
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
                    blueprint
                    style={{ flex: 1 }}
                    icon={<ExternalLink size={14} strokeWidth={1.5} color={colors.bg} />}
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

            <Button variant="secondary" block blueprint onPress={() => navigation.navigate('ProviderProfileEdit')}>
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
            {!isVip && (
              <Card>
                <View style={styles.rowStart}>
                  <Lock size={18} strokeWidth={1.5} color={colors.accent} />
                  <CardBody style={{ margin: 0, flex: 1 }}>Diseño personalizado — plan VIP</CardBody>
                </View>
                <CardMeta>
                  Tu página usa el diseño estándar de PawMates, que se ve bien tal cual. Con el plan VIP
                  eliges colores y tipografía, subes tu logo y tu portada, cambias de plantilla y decides
                  qué secciones aparecen y en qué orden.
                </CardMeta>
                <CardMeta>Escríbenos para activar VIP en tu negocio.</CardMeta>
              </Card>
            )}

            {isVip && profile && draft && (
              <>
                <View style={styles.rowStart}>
                  <Sparkles size={16} strokeWidth={1.5} color={colors.accent} />
                  <Text style={styles.previewLabel}>Vista previa en vivo</Text>
                </View>
                <View style={styles.previewFrame}>
                  <MicrositeView business={asBusiness(profile)} design={draft} compact />
                </View>

                <PageDesignEditor design={draft} onChange={setDraft} />

                {error && <Text style={styles.error}>{error}</Text>}

                <View style={styles.actionsRow}>
                  <Button variant="secondary" style={{ flex: 1 }} disabled={busy} onPress={() => void save(false)}>
                    {busy ? 'Guardando…' : 'Guardar borrador'}
                  </Button>
                  <Button
                    variant="primary"
                    blueprint
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
              </>
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
  },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  tabs: { paddingHorizontal: space.s4, paddingBottom: space.s3 },
  body: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowStart: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  linkBox: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    backgroundColor: colors.neutral100, borderRadius: radius.sm,
  },
  linkText: { fontFamily: fonts.body, fontSize: 13, color: colors.text },
  actionsRow: { flexDirection: 'row', gap: space.s2 },

  previewBlock: { gap: space.s2 },
  previewLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted70 },
  previewFrame: {
    borderWidth: 1.5, borderColor: colors.divider, borderRadius: radius.lg,
    overflow: 'hidden',
  },
  error: { fontFamily: fonts.body, fontSize: 13, color: colors.accent },
});
