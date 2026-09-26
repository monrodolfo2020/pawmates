import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Pressable } from 'react-native';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Link2,
  Palette,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import ScreenHeader from '../components/ScreenHeader';
import Button from '../components/Button';
import BottomBar from '../components/BottomBar';
import Card from '../components/Card';
import { CardMeta, CardTitle } from '../components/CardText';
import Notice from '../components/Notice';
import Segmented from '../components/Segmented';
import Sheet from '../components/Sheet';
import Tag from '../components/Tag';
import MicrositeView from '../components/MicrositeView';
import PageDesignEditor, { TestimonialsEditor } from '../components/PageDesignEditor';
import BlockEditor, { BlockPicker, cleanBlockData, newBlockId, starterData } from '../components/BlockEditor';
import PlanCard from '../components/PlanCard';
import QrCard from '../components/QrCard';
import { colors, fonts, radius, space, type } from '../theme/tokens';
import {
  api,
  BLOCK_LABELS,
  MyProviderProfile,
  PageBlockType,
  PageDesign,
  PageDesignSection,
  PageSection,
  ProviderDetail,
  SECTION_LABELS,
  isAddedBlock,
} from '../api/client';
import { listInSpanish, missingToPublish } from '../utils/pageStatus';
import { useAppState } from '../state/AppState';
import { micrositeUrl } from '../utils/contactLinks';

type Props = NativeStackScreenProps<RootStackParamList, 'MyPage'>;

type Tab = 'live' | 'edit';
type SaveState = 'saved' | 'saving' | 'error';

/** Built-in sections show what's on the business's profile, so their
 * content is edited there — the sheet says so and links to it. */
const PROFILE_SOURCE: Partial<Record<PageSection, string>> = {
  about: 'la descripción de tu negocio',
  services: 'los servicios que ofreces',
  gallery: 'las fotos de tu negocio',
  hours: 'tu dirección y tus horarios',
  map: 'tu dirección o tu ubicación en el mapa',
  contact: 'tu WhatsApp',
};

const AUTOSAVE_MS = 1200;
const DAY_MS = 24 * 60 * 60 * 1000;

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
    services: profile.services ?? [],
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

/** What goes to the server: half-typed values and empty rows left out. */
function forSaving(design: PageDesign): PageDesign {
  return {
    ...design,
    testimonials: design.testimonials.filter((t) => t.text.trim()),
    sections: design.sections.map((sec) => (sec.data ? { ...sec, data: cleanBlockData(sec.data) } : sec)),
  };
}

const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS));

/**
 * The business's page, in two modes. "En vivo" is exactly what visitors
 * get (plus the link and QR to share it). "Edición" is the same page with
 * every block framed and tappable: edit it, move it, hide it, add new
 * ones, change the look. Edits save themselves as a draft; nothing
 * reaches the public page until Publicar.
 *
 * The editor is open during the free month after approval, on VIP, and
 * while the business waits for its first approval (see the backend's
 * ProviderProfile.canCustomize). Outside that, Edición explains why and
 * offers the plan; the saved design waits untouched.
 */
export default function MyPageScreen({ navigation }: Props) {
  const s = useAppState();
  const [profile, setProfile] = useState<MyProviderProfile | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('live');
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState<PageDesign | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'style' | 'add' | 'block' | null>(null);
  const lastSaved = useRef<string | null>(null);

  const loadProfile = useCallback(() => {
    if (!s.token) return;
    api
      .getMyProviderProfile(s.token)
      .then((p) => {
        setProfile(p);
        setDraft(p?.design ?? null);
        lastSaved.current = p ? JSON.stringify(forSaving(p.design)) : null;
      })
      .catch(() => setProfile(null));
  }, [s.token]);

  useFocusEffect(loadProfile);

  const saveDraft = useCallback(
    async (design: PageDesign) => {
      if (!s.token) return null;
      const body = forSaving(design);
      const json = JSON.stringify(body);
      if (json === lastSaved.current) return profile ?? null;
      setSaveState('saving');
      try {
        const saved = await api.saveMyProviderProfile(s.token, { design: body });
        lastSaved.current = JSON.stringify(forSaving(saved.design));
        setProfile(saved);
        // A logo or cover goes up as a photo once and comes back as a
        // link; keep the link so the next save doesn't upload it again.
        setDraft((current) =>
          current ? { ...current, logo: saved.design.logo, cover: saved.design.cover } : current,
        );
        setSaveState('saved');
        setError(null);
        return saved;
      } catch (err) {
        setSaveState('error');
        setError(err instanceof Error ? err.message : 'No se pudo guardar tu diseño.');
        return null;
      }
    },
    [s.token, profile],
  );

  // Every change saves itself a moment after the last keystroke.
  useEffect(() => {
    if (!draft || !profile?.canCustomize) return;
    if (JSON.stringify(forSaving(draft)) === lastSaved.current) return;
    setSaveState('saving');
    const timer = setTimeout(() => void saveDraft(draft), AUTOSAVE_MS);
    return () => clearTimeout(timer);
    // saveDraft changes with `profile`, which the save itself updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const url = profile?.slug ? micrositeUrl(profile.slug) : null;
  const complete = profile?.isPublished ?? false;
  const approved = profile?.approvedAt != null;
  const published = profile?.isPubliclyVisible ?? false;
  const missing = profile ? missingToPublish(profile) : [];
  const canEdit = profile?.canCustomize ?? false;
  const unpublished = Boolean(
    profile && draft && (profile.hasUnpublishedDesign || JSON.stringify(forSaving(draft)) !== lastSaved.current),
  );

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied — the link is on screen anyway.
    }
  };

  const publish = async () => {
    if (!s.token || !draft) return;
    setPublishing(true);
    try {
      await saveDraft(draft);
      const saved = await api.publishPageDesign(s.token);
      setProfile(saved);
      setError(null);
      setTab('live');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar.');
    } finally {
      setPublishing(false);
    }
  };

  const discard = () => {
    if (!profile) return;
    setDraft(profile.publishedDesign ?? profile.liveDesign);
    setSelectedId(null);
  };

  // --- editing the list of blocks ---
  const sections = draft?.sections ?? [];
  const selected = sections.find((x) => x.id === selectedId) ?? null;
  const setSections = (next: PageDesignSection[]) => draft && setDraft({ ...draft, sections: next });
  const updateSection = (id: string, patch: Partial<PageDesignSection>) =>
    setSections(sections.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const move = (id: string, delta: number) => {
    const i = sections.findIndex((x) => x.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    setSections(next);
  };
  const remove = (id: string) => {
    setSections(sections.filter((x) => x.id !== id));
    setSelectedId(null);
    setSheet(null);
  };
  const addBlock = (kind: PageBlockType) => {
    const block: PageDesignSection = { id: newBlockId(), type: kind, enabled: true, data: starterData(kind) };
    // Right under the block that's selected, or at the top of the page.
    const at = selectedId ? sections.findIndex((x) => x.id === selectedId) + 1 : 0;
    setSections([...sections.slice(0, at), block, ...sections.slice(at)]);
    setSelectedId(block.id);
    setSheet('block');
  };

  const label = (sec: PageDesignSection) =>
    isAddedBlock(sec) ? BLOCK_LABELS[sec.type] : SECTION_LABELS[sec.type as PageSection];

  const wrap = (sec: PageDesignSection, content: React.ReactNode) => {
    const isSelected = sec.id === selectedId;
    const index = sections.findIndex((x) => x.id === sec.id);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Editar ${label(sec)}`}
        onPress={() => setSelectedId(isSelected ? null : sec.id)}
        style={[styles.frame, isSelected && styles.frameSelected]}
      >
        <View style={styles.frameBar}>
          <Text style={[styles.frameLabel, isSelected && { color: colors.accent }]} numberOfLines={1}>
            {label(sec)}
          </Text>
          {!sec.enabled && <Tag>Oculto</Tag>}
        </View>
        <View pointerEvents="none" style={!sec.enabled && styles.hidden}>
          {content ?? (
            <Text style={styles.placeholder}>
              {isAddedBlock(sec)
                ? 'Todavía está vacío. Toca "Editar" para escribirlo.'
                : sec.type === 'testimonials'
                  ? 'Sin testimonios todavía. Toca "Editar" para agregarlos.'
                  : `No se muestra todavía: agrega ${PROFILE_SOURCE[sec.type as PageSection] ?? 'la información'} en los datos de tu negocio.`}
            </Text>
          )}
        </View>
        {isSelected && (
          <View style={styles.tools}>
            <Tool icon={Pencil} label="Editar" onPress={() => setSheet('block')} />
            <Tool icon={ArrowUp} label="Subir" disabled={index <= 0} onPress={() => move(sec.id, -1)} />
            <Tool icon={ArrowDown} label="Bajar" disabled={index >= sections.length - 1} onPress={() => move(sec.id, 1)} />
            <Tool
              icon={sec.enabled ? EyeOff : Eye}
              label={sec.enabled ? 'Ocultar' : 'Mostrar'}
              onPress={() => updateSection(sec.id, { enabled: !sec.enabled })}
            />
            {isAddedBlock(sec) && <Tool icon={Trash2} label="Borrar" danger onPress={() => remove(sec.id)} />}
          </View>
        )}
      </Pressable>
    );
  };

  const trialNotice = profile && (
    profile.isVip ? null : profile.inTrial && profile.trialEndsAt ? (
      <Notice tone="warning" title={`Prueba gratis: te quedan ${daysLeft(profile.trialEndsAt)} días`}>
        Hasta entonces puedes personalizar tu página sin costo. Después se verá con el diseño estándar de
        PawMates hasta que actives VIP; tu diseño queda guardado.
      </Notice>
    ) : !approved && canEdit ? (
      <Notice title="Ya puedes diseñar tu página">
        Tu prueba gratis de 30 días empieza cuando aprobemos tu negocio; estos días no cuentan.
      </Notice>
    ) : !canEdit ? (
      <Notice tone="warning" title="Tu prueba gratis terminó">
        Tu página se ve con el diseño estándar de PawMates. Activa VIP y vuelve tu diseño, tal como lo dejaste.
      </Notice>
    ) : null
  );

  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => navigation.goBack()} title="Mi página" />

      <View style={styles.tabs}>
        <Segmented
          options={[
            { label: 'En vivo', value: 'live' },
            { label: 'Edición', value: 'edit' },
          ]}
          value={tab}
          onChange={(v) => {
            setTab(v as Tab);
            setSelectedId(null);
          }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {profile === undefined && <CardMeta>Cargando…</CardMeta>}
        {trialNotice}

        {profile && tab === 'live' && (
          <>
            <Card>
              <View style={styles.rowBetween}>
                <CardTitle>Estado</CardTitle>
                <View style={styles.rowStart}>
                  {profile.isVip && <Tag variant="success">VIP</Tag>}
                  <Tag variant={published ? 'success' : 'warning'}>
                    {published ? 'Publicada ✓' : !approved ? 'En revisión' : 'Sin publicar'}
                  </Tag>
                </View>
              </View>
              {!approved && (
                <CardMeta>
                  Estamos revisando tu negocio. Mientras tanto puedes preparar tu página; nadie más la ve
                  todavía. Te avisaremos por correo, con tu enlace y tu código QR, en cuanto esté en línea.
                </CardMeta>
              )}
              {!complete && (
                <CardMeta>
                  {missing.length
                    ? `Falta ${listInSpanish(missing)} para que tu página sea visible.`
                    : 'Completa tu página para publicarla.'}
                </CardMeta>
              )}
              {canEdit && profile.hasUnpublishedDesign && (
                <Notice tone="warning">Tienes cambios en Edición que todavía no publicas.</Notice>
              )}
            </Card>

            {published && url && (
              <Card>
                <View style={styles.rowStart}>
                  <Link2 size={18} strokeWidth={1.75} color={colors.textMuted} />
                  <CardTitle style={{ flex: 1 }}>Tu enlace para compartir</CardTitle>
                </View>
                <View style={styles.linkBox}>
                  <Text style={styles.linkText} selectable numberOfLines={2}>{url}</Text>
                </View>
                <View style={styles.actionsRow}>
                  <Button
                    style={{ flex: 1 }}
                    icon={copied
                      ? <Check size={16} strokeWidth={2} color={colors.text} />
                      : <Copy size={16} strokeWidth={1.75} color={colors.text} />}
                    onPress={() => void copyLink()}
                  >
                    {copied ? 'Copiado' : 'Copiar enlace'}
                  </Button>
                  <Button
                    variant="primary"
                    style={{ flex: 1 }}
                    icon={<ExternalLink size={16} strokeWidth={1.75} color={colors.onAccent} />}
                    onPress={() => void Linking.openURL(url)}
                  >
                    Ver mi página
                  </Button>
                </View>
              </Card>
            )}

            {published && profile.slug && <QrCard slug={profile.slug} />}

            <View style={styles.previewBlock}>
              <Text style={type.section}>Así la ven tus clientes</Text>
              <View style={styles.previewFrame}>
                <MicrositeView business={asBusiness(profile)} design={profile.liveDesign} />
              </View>
            </View>

            {!profile.isVip && <PlanCard onActivated={loadProfile} />}
          </>
        )}

        {profile && tab === 'edit' && !canEdit && (
          <>
            <PlanCard onActivated={loadProfile} />
            <View style={styles.previewBlock}>
              <Text style={type.section}>Tu diseño guardado</Text>
              <CardMeta>Así volverá a verse tu página cuando actives VIP.</CardMeta>
              <View style={styles.previewFrame}>
                <MicrositeView business={asBusiness(profile)} design={profile.design} />
              </View>
            </View>
          </>
        )}

        {profile && draft && tab === 'edit' && canEdit && (
          <>
            <View style={styles.toolbar}>
              <Button size="sm" icon={<Palette size={16} strokeWidth={1.75} color={colors.text} />}
                onPress={() => setSheet('style')}>
                Estilo
              </Button>
              <Button size="sm" icon={<Plus size={16} strokeWidth={2} color={colors.text} />}
                onPress={() => setSheet('add')}>
                Agregar bloque
              </Button>
              <Text style={styles.saveState} accessibilityLiveRegion="polite">
                {saveState === 'saving' ? 'Guardando…' : saveState === 'error' ? 'Sin guardar' : 'Borrador guardado'}
              </Text>
            </View>
            <CardMeta>Toca un bloque para editarlo, moverlo u ocultarlo.</CardMeta>
            {error && <Notice tone="danger">{error}</Notice>}
            <View style={styles.canvas}>
              <MicrositeView business={asBusiness(profile)} design={draft} editing={{ wrap }} />
            </View>
          </>
        )}
      </ScrollView>

      {profile && draft && tab === 'edit' && canEdit && (
        <BottomBar
          summary={
            <Text style={type.meta}>
              {unpublished ? 'Tus cambios no se ven en tu página hasta que publiques.' : 'Todo está publicado.'}
            </Text>
          }
        >
          {unpublished && profile.publishedDesign && (
            <Button variant="ghost" size="sm" onPress={discard}>Descartar</Button>
          )}
          <Button variant="primary" disabled={!unpublished || publishing} onPress={() => void publish()}>
            {publishing ? 'Publicando…' : 'Publicar'}
          </Button>
        </BottomBar>
      )}

      {draft && (
        <>
          <Sheet visible={sheet === 'style'} title="Estilo de tu página" onClose={() => setSheet(null)}
            footer={<Button variant="primary" block onPress={() => setSheet(null)}>Listo</Button>}>
            <PageDesignEditor design={draft} onChange={setDraft} />
          </Sheet>

          <Sheet visible={sheet === 'add'} title="Agregar bloque" onClose={() => setSheet(null)}>
            <CardMeta>
              {selected ? `Se agrega debajo de "${label(selected)}".` : 'Se agrega al principio de tu página.'}
            </CardMeta>
            <BlockPicker onPick={addBlock} />
          </Sheet>

          <Sheet
            visible={sheet === 'block' && !!selected}
            title={selected ? label(selected) : ''}
            onClose={() => setSheet(null)}
            footer={
              <>
                <Button variant="primary" block onPress={() => setSheet(null)}>Listo</Button>
                {selected && isAddedBlock(selected) && (
                  <Button variant="danger" block onPress={() => remove(selected.id)}>Borrar este bloque</Button>
                )}
              </>
            }
          >
            {selected && isAddedBlock(selected) && (
              <BlockEditor
                kind={selected.type}
                data={selected.data ?? {}}
                onChange={(data) => updateSection(selected.id, { data })}
              />
            )}
            {selected?.type === 'testimonials' && <TestimonialsEditor design={draft} onChange={setDraft} />}
            {selected && !isAddedBlock(selected) && selected.type !== 'testimonials' && (
              <>
                <Text style={type.body}>
                  Este bloque muestra {PROFILE_SOURCE[selected.type as PageSection]}, que se editan en la
                  información de tu negocio. Aquí solo decides dónde va y si se ve.
                </Text>
                <Button onPress={() => { setSheet(null); navigation.navigate('ProviderProfileEdit'); }}>
                  Editar información del negocio
                </Button>
              </>
            )}
          </Sheet>
        </>
      )}
    </ScreenContainer>
  );
}

function Tool({
  icon: Icon, label, onPress, disabled, danger,
}: {
  icon: typeof Pencil;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  const color = disabled ? colors.textFaint : danger ? colors.danger : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.tool, pressed && { backgroundColor: colors.panel }]}
    >
      <Icon size={16} strokeWidth={1.75} color={color} />
      <Text style={[styles.toolText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { paddingHorizontal: space.s4, paddingBottom: space.s3 },
  body: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowStart: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  linkBox: { paddingHorizontal: space.s3, paddingVertical: space.s2, backgroundColor: colors.panel, borderRadius: radius.sm },
  linkText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  actionsRow: { flexDirection: 'row', gap: space.s2 },
  previewBlock: { gap: space.s2 },
  previewFrame: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.lg, overflow: 'hidden' },

  toolbar: { flexDirection: 'row', alignItems: 'center', gap: space.s2, flexWrap: 'wrap' },
  saveState: { ...type.meta, marginLeft: 'auto' },
  canvas: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.divider, paddingBottom: space.s2 },
  frame: {
    marginHorizontal: space.s1, paddingVertical: space.s2, gap: space.s1,
    borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'transparent',
  },
  frameSelected: { borderColor: colors.accent, backgroundColor: 'rgba(200, 73, 42, 0.04)' },
  frameBar: { flexDirection: 'row', alignItems: 'center', gap: space.s2, paddingHorizontal: space.s3 },
  frameLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11.5, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.textFaint },
  hidden: { opacity: 0.4 },
  placeholder: { ...type.small, fontStyle: 'italic', paddingHorizontal: space.s4, paddingVertical: space.s2 },
  tools: {
    flexDirection: 'row', flexWrap: 'wrap', gap: space.s1, marginHorizontal: space.s3, marginTop: space.s1,
    padding: space.s1, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: space.s2, paddingVertical: space.s2, borderRadius: radius.sm },
  toolText: { fontFamily: fonts.bodySemiBold, fontSize: 12.5 },
});
