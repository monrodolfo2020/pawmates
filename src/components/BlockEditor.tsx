import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import TextField from './TextField';
import { CardMeta } from './CardText';
import {
  BLOCK_HINTS,
  BLOCK_LABELS,
  PAGE_BLOCK_TYPES,
  PageBlockData,
  PageBlockItem,
  PageBlockType,
} from '../api/client';
import { colors, fonts, radius, space, type } from '../theme/tokens';

const MAX_ITEMS = 20; // matches parsePageDesign on the backend

/** What a new block of each type starts with: a sensible title where
 * there's an obvious one and empty fields otherwise — the examples live
 * in the placeholders, so nothing made-up can get published by accident. */
export function starterData(kind: PageBlockType): PageBlockData {
  const row = kind === 'prices' ? { name: '', detail: '', price: '' } : { name: '', detail: '' };
  switch (kind) {
    case 'hero':
      return { title: '', subtitle: '' };
    case 'text':
      return { title: '', body: '' };
    case 'prices':
      return { title: 'Precios', items: [row] };
    case 'faq':
      return { title: 'Preguntas frecuentes', items: [row] };
    case 'promo':
      return { title: '', body: '', until: null };
    case 'social':
      return { instagram: '', facebook: '', tiktok: '', website: '' };
    case 'video':
      return { title: '', url: '' };
    case 'team':
      return { title: 'Nuestro equipo', items: [row] };
  }
}

/** A unique id for a new block, in the shape the backend accepts. */
export const newBlockId = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** The list of blocks to add, each with what it's for. */
export function BlockPicker({ onPick }: { onPick: (kind: PageBlockType) => void }) {
  return (
    <View style={{ gap: space.s2 }}>
      {PAGE_BLOCK_TYPES.map((kind) => (
        <Pressable
          key={kind}
          accessibilityRole="button"
          onPress={() => onPick(kind)}
          style={({ pressed }) => [styles.pickRow, pressed && { backgroundColor: colors.panel }]}
        >
          <Text style={type.cardTitle}>{BLOCK_LABELS[kind]}</Text>
          <Text style={type.meta}>{BLOCK_HINTS[kind]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

type EditorProps = {
  kind: PageBlockType;
  data: PageBlockData;
  onChange: (data: PageBlockData) => void;
};

/** The form for one block's content. Every keystroke goes up, so the page
 * behind the sheet updates as you type. */
export default function BlockEditor({ kind, data, onChange }: EditorProps) {
  const set = (patch: Partial<PageBlockData>) => onChange({ ...data, ...patch });
  const titleField = (placeholder: string) => (
    <TextField label="Título" value={data.title ?? ''} onChangeText={(title) => set({ title })}
      placeholder={placeholder} maxLength={80} autoCapitalize="sentences" />
  );

  switch (kind) {
    case 'hero':
      return (
        <>
          <TextField label="Frase principal" value={data.title ?? ''} onChangeText={(title) => set({ title })}
            placeholder="Cuidamos a tu mascota como a la nuestra" maxLength={80} autoCapitalize="sentences" />
          <MultiField label="Texto de apoyo" value={data.subtitle ?? ''} max={160}
            onChange={(subtitle) => set({ subtitle })} placeholder="Una o dos líneas más." />
        </>
      );
    case 'text':
      return (
        <>
          {titleField('Nuestra historia')}
          <MultiField label="Texto" value={data.body ?? ''} max={1500} tall
            onChange={(body) => set({ body })} placeholder="Escribe aquí…" />
        </>
      );
    case 'promo':
      return (
        <>
          {titleField('2×1 en baños este mes')}
          <MultiField label="Detalle" value={data.body ?? ''} max={300}
            onChange={(body) => set({ body })} placeholder="Qué incluye y cómo pedirla." />
          <TextField label="Último día (opcional, AAAA-MM-DD)" value={data.until ?? ''}
            onChangeText={(until) => set({ until: until.trim() || null })}
            placeholder="2026-12-31" maxLength={10} keyboardType="numbers-and-punctuation" />
          {!!data.until && !isDay(data.until) && <Warn>Escribe la fecha así: 2026-12-31.</Warn>}
          <CardMeta>Después de ese día la promoción se oculta sola de tu página.</CardMeta>
        </>
      );
    case 'social':
      return (
        <>
          <TextField label="Instagram" value={data.instagram ?? ''} onChangeText={(instagram) => set({ instagram })}
            placeholder="@tunegocio" maxLength={200} />
          <TextField label="Facebook" value={data.facebook ?? ''} onChangeText={(facebook) => set({ facebook })}
            placeholder="tunegocio o https://facebook.com/…" maxLength={200} />
          <TextField label="TikTok" value={data.tiktok ?? ''} onChangeText={(tiktok) => set({ tiktok })}
            placeholder="@tunegocio" maxLength={200} />
          <TextField label="Sitio web" value={data.website ?? ''} onChangeText={(website) => set({ website })}
            placeholder="https://…" maxLength={300} keyboardType="url" />
          {[data.instagram, data.facebook, data.tiktok].some((v) => v && !isHandle(v)) && (
            <Warn>Escribe el usuario (@tunegocio) o el enlace completo con https://.</Warn>
          )}
          {!!data.website && !isLink(data.website) && <Warn>El sitio web debe empezar con https://.</Warn>}
          <CardMeta>Deja vacío lo que no uses.</CardMeta>
        </>
      );
    case 'video':
      return (
        <>
          {titleField('Conócenos en video')}
          <TextField label="Enlace del video" value={data.url ?? ''} onChangeText={(url) => set({ url })}
            placeholder="https://youtube.com/…" maxLength={300} keyboardType="url" />
          {!!data.url && !isLink(data.url) && <Warn>El enlace debe empezar con https://.</Warn>}
          <CardMeta>De YouTube, TikTok, Instagram o Facebook. Se abre en la app del video.</CardMeta>
        </>
      );
    case 'prices':
      return (
        <>
          {titleField('Precios')}
          <ItemsField items={data.items ?? []} onChange={(items) => set({ items })} withPrice
            nameLabel="Servicio" detailLabel="Qué incluye" addLabel="Agregar servicio" />
        </>
      );
    case 'faq':
      return (
        <>
          {titleField('Preguntas frecuentes')}
          <ItemsField items={data.items ?? []} onChange={(items) => set({ items })}
            nameLabel="Pregunta" detailLabel="Respuesta" addLabel="Agregar pregunta" multilineDetail />
        </>
      );
    case 'team':
      return (
        <>
          {titleField('Nuestro equipo')}
          <ItemsField items={data.items ?? []} onChange={(items) => set({ items })}
            nameLabel="Nombre" detailLabel="Qué hace" addLabel="Agregar persona" />
        </>
      );
  }
}

export const blockTitle = (kind: PageBlockType) => BLOCK_LABELS[kind];

// The same rules the backend applies (page-design.ts). Used to warn while
// typing and to leave half-typed values out of the automatic save.
export const isDay = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
export const isLink = (v: string) => /^https:\/\/\S+$/i.test(v);
export const isHandle = (v: string) => /^(@?[\w.]{1,60}|https:\/\/\S+)$/.test(v);

/** What's safe to send while someone is still typing: half-written dates
 * and links are left out (they stay in the editor), empty rows dropped. */
export function cleanBlockData(data: PageBlockData): PageBlockData {
  const out: PageBlockData = { ...data };
  if (out.until && !isDay(out.until)) out.until = null;
  if (out.url && !isLink(out.url)) out.url = '';
  if (out.website && !isLink(out.website)) out.website = '';
  for (const key of ['instagram', 'facebook', 'tiktok'] as const) {
    if (out[key] && !isHandle(out[key]!.trim())) out[key] = '';
  }
  if (out.items) out.items = out.items.filter((it) => it.name.trim() || it.detail.trim());
  return out;
}

function Warn({ children }: { children: React.ReactNode }) {
  return <Text style={styles.warn}>{children}</Text>;
}

function MultiField({
  label, value, onChange, placeholder, max, tall,
}: { label: string; value: string; onChange: (v: string) => void; placeholder: string; max: number; tall?: boolean }) {
  return (
    <View style={{ gap: space.s2 - 2 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        multiline
        maxLength={max}
        style={[styles.input, { minHeight: tall ? 140 : 80 }]}
      />
    </View>
  );
}

function ItemsField({
  items, onChange, nameLabel, detailLabel, addLabel, withPrice, multilineDetail,
}: {
  items: PageBlockItem[];
  onChange: (items: PageBlockItem[]) => void;
  nameLabel: string;
  detailLabel: string;
  addLabel: string;
  withPrice?: boolean;
  multilineDetail?: boolean;
}) {
  const setItem = (i: number, patch: Partial<PageBlockItem>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  return (
    <View style={{ gap: space.s3 }}>
      {items.map((it, i) => (
        <View key={i} style={styles.item}>
          <View style={styles.itemHead}>
            <Text style={styles.label}>{nameLabel} {i + 1}</Text>
            <Pressable onPress={() => onChange(items.filter((_, idx) => idx !== i))} hitSlop={8}
              accessibilityRole="button" accessibilityLabel={`Quitar ${nameLabel.toLowerCase()} ${i + 1}`}>
              <X size={16} strokeWidth={2} color={colors.textMuted} />
            </Pressable>
          </View>
          <TextInput value={it.name} onChangeText={(name) => setItem(i, { name })} placeholder={nameLabel}
            placeholderTextColor={colors.textFaint} maxLength={multilineDetail ? 150 : 60} style={styles.input} />
          <TextInput value={it.detail} onChangeText={(detail) => setItem(i, { detail })} placeholder={detailLabel}
            placeholderTextColor={colors.textFaint} maxLength={multilineDetail ? 600 : 120}
            multiline={multilineDetail} style={[styles.input, multilineDetail && { minHeight: 72 }]} />
          {withPrice && (
            <TextInput value={it.price ?? ''} onChangeText={(price) => setItem(i, { price })} placeholder="Precio (ej. $150)"
              placeholderTextColor={colors.textFaint} maxLength={30} style={styles.input} />
          )}
        </View>
      ))}
      {items.length < MAX_ITEMS && (
        <Pressable style={styles.add} accessibilityRole="button"
          onPress={() => onChange([...items, withPrice ? { name: '', detail: '', price: '' } : { name: '', detail: '' }])}>
          <Plus size={16} strokeWidth={2} color={colors.accent} />
          <Text style={styles.addText}>{addLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.text },
  warn: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger, marginTop: -space.s2 },
  input: {
    minHeight: 44, paddingHorizontal: space.s3, paddingVertical: space.s2 + 2,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface,
    fontFamily: fonts.body, fontSize: 15, color: colors.text, textAlignVertical: 'top',
  },
  item: { gap: space.s2, paddingTop: space.s3, borderTopWidth: 1, borderTopColor: colors.divider },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  add: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: space.s1 },
  addText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.accent },
  pickRow: {
    gap: 2, padding: space.s4, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface,
  },
});
