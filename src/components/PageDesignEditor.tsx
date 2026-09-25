import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { X, Plus } from 'lucide-react-native';
import PhotoPicker from './PhotoPicker';
import { CardMeta, CardTitle } from './CardText';
import {
  FONT_LABELS,
  PAGE_FONTS,
  PAGE_TEMPLATES,
  PageDesign,
  PAGE_TEXT_SIZES,
  PageTextSize,
  TEXT_SIZE_LABELS,
  PageTemplate,
  PageTestimonial,
  TEMPLATE_LABELS,
} from '../api/client';
import { colors, fonts, pageFonts, radius, space } from '../theme/tokens';

type Props = {
  design: PageDesign;
  onChange: (design: PageDesign) => void;
};

const MAX_TESTIMONIALS = 6; // matches parsePageDesign on the backend

// No OS color picker exists in React Native, and a free-form hex field
// alone is a good way to end up with unreadable pages, so each color is a
// row of curated swatches — with the hex still editable underneath for
// anyone matching an exact brand color.
const PRIMARY_SWATCHES = ['#C8492A', '#FF6B4A', '#2F7A55', '#2E6F95', '#6B4FA3', '#B7791F', '#261E2C'];
const BACKGROUND_SWATCHES = ['#FBF6F1', '#FFFFFF', '#F4ECE3', '#F2F7F6', '#261E2C', '#1E1A24'];
const TEXT_SWATCHES = ['#261E2C', '#3A3350', '#FFFFFF', '#F4ECE3'];

const isHex = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

function Chips<T extends string>({
  options, labels, value, onChange,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{labels[opt]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ColorRow({
  label, value, swatches, onChange,
}: {
  label: string;
  value: string;
  swatches: string[];
  onChange: (hex: string) => void;
}) {
  return (
    <View style={styles.colorBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {swatches.map((hex) => (
          <Pressable
            key={hex}
            onPress={() => onChange(hex)}
            style={[
              styles.swatch,
              { backgroundColor: hex },
              hex.toLowerCase() === value.toLowerCase() && styles.swatchSelected,
            ]}
          />
        ))}
      </View>
      <TextInput
        value={value}
        onChangeText={(text) => {
          // Only push a valid color up — the field still shows whatever
          // is being typed, so "#FF6" mid-typing doesn't reset itself.
          if (isHex(text)) onChange(text);
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={7}
        placeholder="#FF6B4A"
        placeholderTextColor={colors.textMuted}
        style={styles.hexInput}
      />
    </View>
  );
}

/** Ready-made color sets that always read well — most people should
 * never need the individual colors below them. */
export const PALETTES: { name: string; primary: string; background: string; text: string }[] = [
  { name: 'Terracota', primary: '#C8492A', background: '#FBF6F1', text: '#261E2C' },
  { name: 'Bosque', primary: '#2F7A55', background: '#F3F7F2', text: '#1F2A24' },
  { name: 'Océano', primary: '#2E6F95', background: '#F2F7FA', text: '#1D2A33' },
  { name: 'Lavanda', primary: '#6B4FA3', background: '#F7F4FB', text: '#2A2238' },
  { name: 'Miel', primary: '#B7791F', background: '#FFF9EE', text: '#2E2416' },
  { name: 'Frambuesa', primary: '#C2416B', background: '#FFF5F7', text: '#2E1C24' },
  { name: 'Blanco y negro', primary: '#261E2C', background: '#FFFFFF', text: '#261E2C' },
  { name: 'Noche', primary: '#F07A58', background: '#1E1A24', text: '#F4ECE3' },
];

/**
 * How the page looks, as a whole: template, type, colors, logo and
 * cover. What's *on* the page (blocks and their order) is edited on the
 * page itself — see MyPageScreen's Edición mode. Like the rest of the
 * editor it never saves anything; it hands the whole design back up.
 */
export default function PageDesignEditor({ design, onChange }: Props) {
  const set = (patch: Partial<PageDesign>) => onChange({ ...design, ...patch });
  const [customColors, setCustomColors] = React.useState(false);
  const activePalette = PALETTES.find(
    (p) =>
      p.primary.toLowerCase() === design.primaryColor.toLowerCase() &&
      p.background.toLowerCase() === design.backgroundColor.toLowerCase() &&
      p.text.toLowerCase() === design.textColor.toLowerCase(),
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.group}>
        <CardTitle>Colores</CardTitle>
        <View style={styles.paletteGrid}>
          {PALETTES.map((p) => {
            const selected = p === activePalette;
            return (
              <Pressable
                key={p.name}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => set({ primaryColor: p.primary, backgroundColor: p.background, textColor: p.text })}
                style={[styles.palette, { backgroundColor: p.background }, selected && styles.paletteSelected]}
              >
                <View style={[styles.paletteDot, { backgroundColor: p.primary }]} />
                <Text style={[styles.paletteName, { color: p.text }]} numberOfLines={1}>{p.name}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={() => setCustomColors((v) => !v)} hitSlop={6}>
          <Text style={styles.linkText}>{customColors ? 'Ocultar colores a mano' : 'Elegir colores a mano'}</Text>
        </Pressable>
        {customColors && (
          <View style={{ gap: space.s3 }}>
            <ColorRow label="Color principal" value={design.primaryColor} swatches={PRIMARY_SWATCHES}
              onChange={(primaryColor) => set({ primaryColor })} />
            <ColorRow label="Fondo" value={design.backgroundColor} swatches={BACKGROUND_SWATCHES}
              onChange={(backgroundColor) => set({ backgroundColor })} />
            <ColorRow label="Texto" value={design.textColor} swatches={TEXT_SWATCHES}
              onChange={(textColor) => set({ textColor })} />
          </View>
        )}
      </View>

      <View style={styles.group}>
        <CardTitle>Plantilla</CardTitle>
        <Chips options={PAGE_TEMPLATES} labels={TEMPLATE_LABELS} value={design.template}
          onChange={(template: PageTemplate) => set({ template })} />
        <CardMeta>
          Galería pone tus fotos primero. Minimalista quita la portada y deja solo una franja de color.
        </CardMeta>
      </View>

      <View style={styles.group}>
        <CardTitle>Tipografía de los títulos</CardTitle>
        <View style={styles.chipRow}>
          {PAGE_FONTS.map((font) => {
            const selected = font === design.font;
            return (
              <Pressable
                key={font}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => set({ font })}
                style={[styles.fontChip, selected && styles.fontChipSelected]}
              >
                <Text style={{ fontFamily: pageFonts[font].family, fontSize: pageFonts[font].section, color: colors.text }}>
                  {FONT_LABELS[font]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.group}>
        <CardTitle>Tamaño del texto</CardTitle>
        <Chips options={PAGE_TEXT_SIZES} labels={TEXT_SIZE_LABELS} value={design.textSize ?? 'normal'}
          onChange={(textSize: PageTextSize) => set({ textSize })} />
        <CardMeta>Grande ayuda a quien lee desde un teléfono pequeño o sin lentes.</CardMeta>
      </View>

      <View style={styles.group}>
        <CardTitle>Logo y portada</CardTitle>
        <View style={styles.imageRow}>
          <View style={styles.imageSlot}>
            <Text style={styles.fieldLabel}>Logo</Text>
            <PhotoPicker
              uri={design.logo}
              label="Logo"
              alertTitle="Logo del negocio"
              style={styles.logoSlot}
              onChange={(result) => {
                if (result.base64) set({ logo: result.base64 });
              }}
            />
            {design.logo && (
              <Pressable onPress={() => set({ logo: null })} hitSlop={6}>
                <Text style={styles.removeLink}>Quitar</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.imageSlot}>
            <Text style={styles.fieldLabel}>Portada</Text>
            <PhotoPicker
              uri={design.cover}
              label="Portada"
              alertTitle="Portada del negocio"
              style={styles.coverSlot}
              onChange={(result) => {
                if (result.base64) set({ cover: result.base64 });
              }}
            />
            {design.cover && (
              <Pressable onPress={() => set({ cover: null })} hitSlop={6}>
                <Text style={styles.removeLink}>Quitar</Text>
              </Pressable>
            )}
          </View>
        </View>
        <CardMeta>Sin portada propia usamos la primera foto de tu galería.</CardMeta>
      </View>
    </View>
  );
}

/** The testimonials a business writes for its page (they aren't collected
 * from customers in the app). */
export function TestimonialsEditor({ design, onChange }: Props) {
  const set = (testimonials: PageTestimonial[]) => onChange({ ...design, testimonials });
  const setTestimonial = (index: number, patch: Partial<PageTestimonial>) =>
    set(design.testimonials.map((t, i) => (i === index ? { ...t, ...patch } : t)));

  return (
    <View style={{ gap: space.s3 }}>
      <CardMeta>Lo que dicen tus clientes, en sus palabras: los escribes tú.</CardMeta>
      {design.testimonials.map((t, i) => (
        <View key={i} style={styles.testimonial}>
          <View style={styles.testimonialHead}>
            <Text style={styles.fieldLabel}>Testimonio {i + 1}</Text>
            <Pressable onPress={() => set(design.testimonials.filter((_, idx) => idx !== i))} hitSlop={8}>
              <X size={16} strokeWidth={2} color={colors.textMuted} />
            </Pressable>
          </View>
          <TextInput
            value={t.text}
            onChangeText={(text) => setTestimonial(i, { text })}
            placeholder="Excelente trato con mi perro…"
            placeholderTextColor={colors.textFaint}
            multiline
            maxLength={280}
            style={[styles.input, styles.inputMultiline]}
          />
          <TextInput
            value={t.author}
            onChangeText={(author) => setTestimonial(i, { author })}
            placeholder="Nombre del cliente"
            placeholderTextColor={colors.textFaint}
            maxLength={60}
            style={styles.input}
          />
        </View>
      ))}
      {design.testimonials.length < MAX_TESTIMONIALS ? (
        <Pressable style={styles.addButton} onPress={() => set([...design.testimonials, { text: '', author: '' }])}>
          <Plus size={16} strokeWidth={2} color={colors.accent} />
          <Text style={styles.linkText}>Agregar testimonio</Text>
        </Pressable>
      ) : (
        <CardMeta>Máximo {MAX_TESTIMONIALS} testimonios.</CardMeta>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.s6 },
  group: { gap: space.s3 },
  fieldLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.text },
  linkText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.accent },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 },
  palette: {
    width: '48%', flexDirection: 'row', alignItems: 'center', gap: space.s2,
    paddingHorizontal: space.s3, paddingVertical: space.s3,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  paletteSelected: { borderColor: colors.text, borderWidth: 2, paddingHorizontal: space.s3 - 1, paddingVertical: space.s3 - 1 },
  paletteDot: { width: 20, height: 20, borderRadius: 10 },
  paletteName: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 13.5 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2, alignItems: 'center' },
  chip: {
    paddingHorizontal: space.s3 + 2, paddingVertical: space.s2,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },
  fontChip: {
    paddingHorizontal: space.s4, paddingVertical: space.s2, minHeight: 48, justifyContent: 'center',
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  fontChipSelected: { borderColor: colors.text, borderWidth: 2, paddingHorizontal: space.s4 - 1 },
  chipTextSelected: { color: colors.onAccent, fontFamily: fonts.bodySemiBold },

  colorBlock: { gap: space.s2 },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.divider },
  swatchSelected: { borderColor: colors.text, borderWidth: 3 },
  hexInput: {
    alignSelf: 'flex-start', minWidth: 110,
    paddingHorizontal: space.s3, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.divider, borderRadius: radius.sm,
    fontFamily: fonts.body, fontSize: 13, color: colors.text,
  },

  imageRow: { flexDirection: 'row', gap: space.s4 },
  imageSlot: { gap: space.s2, alignItems: 'flex-start' },
  logoSlot: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.panel },
  coverSlot: { width: 150, height: 84, borderRadius: radius.md, backgroundColor: colors.panel },
  removeLink: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted },


  testimonial: {
    gap: space.s2, paddingTop: space.s2,
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  testimonialHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: {
    minHeight: 44, paddingHorizontal: space.s3, paddingVertical: space.s2,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface,
    fontFamily: fonts.body, fontSize: 15, color: colors.text,
  },
  inputMultiline: { minHeight: 64, textAlignVertical: 'top' },

  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
