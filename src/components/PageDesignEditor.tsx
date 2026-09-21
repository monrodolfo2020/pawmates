import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Switch } from 'react-native';
import { ArrowUp, ArrowDown, X, Plus } from 'lucide-react-native';
import PhotoPicker from './PhotoPicker';
import Card from './Card';
import { CardBody, CardMeta } from './CardText';
import {
  FONT_LABELS,
  PAGE_FONTS,
  PAGE_TEMPLATES,
  PageDesign,
  PageFont,
  PageSection,
  PageTemplate,
  SECTION_LABELS,
  TEMPLATE_LABELS,
} from '../api/client';
import { colors, fonts, radius, space } from '../theme/tokens';

type Props = {
  design: PageDesign;
  onChange: (design: PageDesign) => void;
};

const MAX_TESTIMONIALS = 6; // matches parsePageDesign on the backend

// No OS color picker exists in React Native, and a free-form hex field
// alone is a good way to end up with unreadable pages, so each color is a
// row of curated swatches — with the hex still editable underneath for
// anyone matching an exact brand color.
const PRIMARY_SWATCHES = ['#FF6B4A', '#E85234', '#00C2A0', '#2E86DE', '#8E44AD', '#F2A33C', '#1D1533'];
const BACKGROUND_SWATCHES = ['#FFF7F0', '#FFFFFF', '#F7F0E8', '#F2F7F6', '#1D1533', '#221E2E'];
const TEXT_SWATCHES = ['#1D1533', '#3A3350', '#FFFFFF', '#F7F0E8'];

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
        placeholderTextColor={colors.textMuted50}
        style={styles.hexInput}
      />
    </View>
  );
}

/**
 * The VIP plan's page editor. It never saves or publishes anything on its
 * own — it hands a whole PageDesign back up on every change, and
 * MyPageScreen decides when that becomes a draft on the server and when
 * the draft goes live. That's what makes the live preview next to it
 * honest: it renders exactly the object this returns.
 */
export default function PageDesignEditor({ design, onChange }: Props) {
  const set = (patch: Partial<PageDesign>) => onChange({ ...design, ...patch });

  const moveSection = (index: number, delta: number) => {
    const next = [...design.sections];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set({ sections: next });
  };

  const toggleSection = (id: PageSection, enabled: boolean) => {
    set({ sections: design.sections.map((s) => (s.id === id ? { ...s, enabled } : s)) });
  };

  const setTestimonial = (index: number, patch: Partial<{ text: string; author: string }>) => {
    set({
      testimonials: design.testimonials.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    });
  };

  return (
    <View style={styles.wrap}>
      <Card>
        <CardBody style={{ margin: 0 }}>Plantilla</CardBody>
        <Chips options={PAGE_TEMPLATES} labels={TEMPLATE_LABELS} value={design.template}
          onChange={(template: PageTemplate) => set({ template })} />
        <CardMeta>
          Galería pone tus fotos primero. Minimalista quita la portada y deja solo una franja de color.
        </CardMeta>
      </Card>

      <Card>
        <CardBody style={{ margin: 0 }}>Tipografía</CardBody>
        <Chips options={PAGE_FONTS} labels={FONT_LABELS} value={design.font}
          onChange={(font: PageFont) => set({ font })} />
      </Card>

      <Card>
        <CardBody style={{ margin: 0 }}>Colores</CardBody>
        <ColorRow label="Color principal" value={design.primaryColor} swatches={PRIMARY_SWATCHES}
          onChange={(primaryColor) => set({ primaryColor })} />
        <ColorRow label="Fondo" value={design.backgroundColor} swatches={BACKGROUND_SWATCHES}
          onChange={(backgroundColor) => set({ backgroundColor })} />
        <ColorRow label="Texto" value={design.textColor} swatches={TEXT_SWATCHES}
          onChange={(textColor) => set({ textColor })} />
      </Card>

      <Card>
        <CardBody style={{ margin: 0 }}>Logo y portada</CardBody>
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
      </Card>

      <Card>
        <CardBody style={{ margin: 0 }}>Secciones</CardBody>
        <CardMeta>Arrástralas con las flechas para cambiar el orden, o apágalas para ocultarlas.</CardMeta>
        {design.sections.map((section, i) => (
          <View key={section.id} style={styles.sectionRow}>
            <View style={styles.arrows}>
              <Pressable onPress={() => moveSection(i, -1)} disabled={i === 0} hitSlop={4}>
                <ArrowUp size={16} strokeWidth={2}
                  color={i === 0 ? colors.textMuted50 : colors.text} />
              </Pressable>
              <Pressable onPress={() => moveSection(i, 1)} disabled={i === design.sections.length - 1} hitSlop={4}>
                <ArrowDown size={16} strokeWidth={2}
                  color={i === design.sections.length - 1 ? colors.textMuted50 : colors.text} />
              </Pressable>
            </View>
            <Text style={styles.sectionName}>{SECTION_LABELS[section.id]}</Text>
            <Switch
              value={section.enabled}
              onValueChange={(enabled) => toggleSection(section.id, enabled)}
              trackColor={{ true: colors.accent, false: colors.divider }}
              thumbColor={colors.surface}
            />
          </View>
        ))}
      </Card>

      <Card>
        <CardBody style={{ margin: 0 }}>Testimonios</CardBody>
        <CardMeta>
          Lo que dicen tus clientes, en tus palabras: los escribes tú, no se recogen desde la app.
        </CardMeta>
        {design.testimonials.map((t, i) => (
          <View key={i} style={styles.testimonial}>
            <View style={styles.testimonialHead}>
              <Text style={styles.fieldLabel}>Testimonio {i + 1}</Text>
              <Pressable
                onPress={() => set({ testimonials: design.testimonials.filter((_, idx) => idx !== i) })}
                hitSlop={8}
              >
                <X size={14} strokeWidth={2} color={colors.textMuted70} />
              </Pressable>
            </View>
            <TextInput
              value={t.text}
              onChangeText={(text) => setTestimonial(i, { text })}
              placeholder="Excelente trato con mi perro…"
              placeholderTextColor={colors.textMuted50}
              multiline
              maxLength={280}
              style={[styles.input, styles.inputMultiline]}
            />
            <TextInput
              value={t.author}
              onChangeText={(author) => setTestimonial(i, { author })}
              placeholder="Nombre del cliente"
              placeholderTextColor={colors.textMuted50}
              maxLength={60}
              style={styles.input}
            />
          </View>
        ))}
        {design.testimonials.length < MAX_TESTIMONIALS ? (
          <Pressable
            style={styles.addButton}
            onPress={() => set({ testimonials: [...design.testimonials, { text: '', author: '' }] })}
          >
            <Plus size={14} strokeWidth={2} color={colors.accent} />
            <Text style={styles.addText}>Agregar testimonio</Text>
          </Pressable>
        ) : (
          <CardMeta>Máximo {MAX_TESTIMONIALS} testimonios.</CardMeta>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.s4 },
  fieldLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted70 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2, alignItems: 'center' },
  chip: {
    paddingHorizontal: space.s3, paddingVertical: 6,
    borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.divider,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  chipTextSelected: { color: colors.bg },

  colorBlock: { gap: space.s2 },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.divider },
  swatchSelected: { borderColor: colors.text, borderWidth: 3 },
  hexInput: {
    alignSelf: 'flex-start', minWidth: 110,
    paddingHorizontal: space.s3, paddingVertical: 6,
    borderWidth: 1.5, borderColor: colors.divider, borderRadius: radius.sm,
    fontFamily: fonts.body, fontSize: 13, color: colors.text,
  },

  imageRow: { flexDirection: 'row', gap: space.s4 },
  imageSlot: { gap: space.s2, alignItems: 'flex-start' },
  logoSlot: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.accent100 },
  coverSlot: { width: 150, height: 84, borderRadius: radius.md, backgroundColor: colors.accent100 },
  removeLink: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted70 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: space.s3 },
  arrows: { gap: 2 },
  sectionName: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.text },

  testimonial: {
    gap: space.s2, paddingTop: space.s2,
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  testimonialHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: {
    paddingHorizontal: space.s3, paddingVertical: 8,
    borderWidth: 1.5, borderColor: colors.divider, borderRadius: radius.sm,
    fontFamily: fonts.body, fontSize: 13.5, color: colors.text,
  },
  inputMultiline: { minHeight: 64, textAlignVertical: 'top' },

  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.accent },
});
