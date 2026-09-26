import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { ArrowUp, Plus, X } from 'lucide-react-native';
import { MAX_SERVICES, ServiceCategory, newServiceId } from '../api/client';
import { colors, fonts, radius, space, type } from '../theme/tokens';
import { ServiceDraft, minutesProblem, priceProblem } from '../utils/services';

const emptyDraft = (): ServiceDraft => ({ id: newServiceId(), name: '', detail: '', price: '', minutes: '' });

// One believable example per kind of business, as placeholders only.
const EXAMPLES: Record<ServiceCategory, { name: string; detail: string; price: string; minutes: string }> = {
  walker: { name: 'Paseo individual', detail: 'Solo tu perro, con fotos del recorrido', price: '180', minutes: '60' },
  vet: { name: 'Consulta general', detail: 'Revisión completa y plan de cuidado', price: '450', minutes: '30' },
  grooming: { name: 'Baño y secado', detail: 'Incluye corte de uñas y limpieza de oídos', price: '350', minutes: '90' },
  boarding: { name: 'Hospedaje por noche', detail: 'Incluye 3 paseos y comida', price: '450', minutes: '' },
  training: { name: 'Clase de obediencia', detail: 'Sesión individual a domicilio', price: '500', minutes: '60' },
  other: { name: 'Traslado a consulta', detail: 'Ida y vuelta dentro de la ciudad', price: '300', minutes: '' },
};

type Props = {
  category: ServiceCategory;
  drafts: ServiceDraft[];
  onChange: (drafts: ServiceDraft[]) => void;
};

/** The business's list of services: name, what it includes, price and
 * duration, one card each. */
export default function ServicesEditor({ category, drafts, onChange }: Props) {
  const example = EXAMPLES[category];
  const set = (i: number, patch: Partial<ServiceDraft>) =>
    onChange(drafts.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const moveUp = (i: number) => {
    const next = [...drafts];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };

  return (
    <View style={{ gap: space.s3 }}>
      {drafts.map((d, i) => {
        const problem = priceProblem(d.price) ?? minutesProblem(d.minutes);
        return (
          <View key={d.id} style={styles.card}>
            <View style={styles.head}>
              <Text style={styles.label}>Servicio {i + 1}</Text>
              <View style={styles.headActions}>
                {i > 0 && (
                  <Pressable onPress={() => moveUp(i)} hitSlop={8} accessibilityRole="button"
                    accessibilityLabel={`Subir servicio ${i + 1}`}>
                    <ArrowUp size={16} strokeWidth={2} color={colors.textMuted} />
                  </Pressable>
                )}
                <Pressable onPress={() => onChange(drafts.filter((_, idx) => idx !== i))} hitSlop={8}
                  accessibilityRole="button" accessibilityLabel={`Quitar servicio ${i + 1}`}>
                  <X size={16} strokeWidth={2} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>
            <TextInput value={d.name} onChangeText={(name) => set(i, { name })} maxLength={60}
              placeholder={`Nombre (ej. ${example.name})`} placeholderTextColor={colors.textFaint}
              style={styles.input} accessibilityLabel={`Nombre del servicio ${i + 1}`} />
            <TextInput value={d.detail} onChangeText={(detail) => set(i, { detail })} maxLength={120}
              placeholder={`Qué incluye (ej. ${example.detail})`} placeholderTextColor={colors.textFaint}
              style={styles.input} accessibilityLabel={`Qué incluye el servicio ${i + 1}`} />
            <View style={styles.pair}>
              <View style={styles.half}>
                <Text style={styles.small}>Precio (MXN)</Text>
                <TextInput value={d.price} onChangeText={(price) => set(i, { price })} maxLength={9}
                  placeholder={example.price || 'Opcional'} placeholderTextColor={colors.textFaint}
                  keyboardType="numeric" style={styles.input} accessibilityLabel={`Precio del servicio ${i + 1}`} />
              </View>
              <View style={styles.half}>
                <Text style={styles.small}>Duración (min)</Text>
                <TextInput value={d.minutes} onChangeText={(minutes) => set(i, { minutes })} maxLength={4}
                  placeholder={example.minutes || 'Opcional'} placeholderTextColor={colors.textFaint}
                  keyboardType="number-pad" style={styles.input} accessibilityLabel={`Duración del servicio ${i + 1}`} />
              </View>
            </View>
            {problem && <Text style={styles.warn}>{problem}</Text>}
          </View>
        );
      })}
      {drafts.length < MAX_SERVICES && (
        <Pressable style={styles.add} accessibilityRole="button" onPress={() => onChange([...drafts, emptyDraft()])}>
          <Plus size={16} strokeWidth={2} color={colors.accent} />
          <Text style={styles.addText}>Agregar servicio</Text>
        </Pressable>
      )}
      <Text style={type.meta}>
        {category === 'walker'
          ? 'Los dueños eligen uno de estos paseos al reservar; la duración y el precio salen de aquí. Deja el precio vacío para usar tu precio base.'
          : 'El precio y la duración son opcionales: si varían, déjalos vacíos y se verá "Por acordar".'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.s2, padding: space.s3, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headActions: { flexDirection: 'row', gap: space.s4 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.text },
  small: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.textMuted },
  input: {
    minHeight: 44, paddingHorizontal: space.s3, paddingVertical: space.s2 + 2,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface,
    fontFamily: fonts.body, fontSize: 15, color: colors.text,
  },
  pair: { flexDirection: 'row', gap: space.s3 },
  half: { flex: 1, gap: 4 },
  warn: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger },
  add: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: space.s1 },
  addText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.accent },
});
