import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import { BusinessService } from '../api/client';
import { colors, fonts, radius, space, type } from '../theme/tokens';
import { formatDuration, pesos } from '../utils/services';

type Props = {
  services: BusinessService[];
  /** When set, each row is a button (a walker's list: tap to book it). */
  onPick?: (service: BusinessService) => void;
  /** What a row without its own price costs, if anything. */
  fallbackPrice?: number | null;
  /** Makes the list a single choice (the booking form) instead of a set
   * of links: the picked row is marked, and no row has a chevron. */
  selectedId?: string | null;
};

/** A business's services as a price list: name and what's included on
 * the left, price and duration on the right. */
export default function ServiceList({ services, onPick, fallbackPrice = null, selectedId }: Props) {
  const choosing = selectedId !== undefined;
  return (
    <View style={styles.list}>
      {services.map((service, i) => {
        const price = service.price ?? fallbackPrice;
        const selected = selectedId === service.id;
        const body = (
          <>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={type.cardTitle}>{service.name}</Text>
              {!!service.detail && <Text style={type.meta}>{service.detail}</Text>}
            </View>
            <View style={styles.right}>
              <Text style={styles.price}>{price !== null ? pesos(price) : 'Por acordar'}</Text>
              {service.durationMinutes !== null && (
                <Text style={type.meta}>{formatDuration(service.durationMinutes)}</Text>
              )}
            </View>
            {choosing ? (
              <View style={[styles.radio, selected && styles.radioOn]}>
                {selected && <Check size={14} strokeWidth={2.5} color={colors.onAccent} />}
              </View>
            ) : (
              onPick && <ChevronRight size={18} strokeWidth={1.75} color={colors.textFaint} />
            )}
          </>
        );
        const rowStyle = [styles.row, i > 0 && styles.rowDivider, selected && styles.rowSelected];
        return onPick ? (
          <Pressable
            key={service.id}
            accessibilityRole={choosing ? 'radio' : 'button'}
            accessibilityState={choosing ? { checked: selected } : undefined}
            accessibilityLabel={`${service.name}${price !== null ? `, ${pesos(price)}` : ''}`}
            onPress={() => onPick(service)}
            style={({ pressed }) => [...rowStyle, pressed && { backgroundColor: colors.panel }]}
          >
            {body}
          </Pressable>
        ) : (
          <View key={service.id} style={rowStyle}>
            {body}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderWidth: 1, borderColor: colors.divider, borderRadius: radius.lg,
    backgroundColor: colors.surface, overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.s3, padding: space.s4 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  rowSelected: { backgroundColor: colors.accentTint },
  right: { alignItems: 'flex-end', gap: 2 },
  radio: {
    width: 22, height: 22, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  price: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
});
