import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, fonts, radius, space } from '../theme/tokens';

type Props = {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

/**
 * A checkbox whose label can contain tappable links to the documents.
 *
 * Tapping the plain text of the label toggles the box, the way a
 * checkbox label normally does. Tapping the name of a document opens it
 * instead: the inner Text's own onPress wins over the outer one, so the
 * two gestures don't fight. An acceptance you can't show the person had
 * the chance to read is worth much less than one you can.
 */
export default function LegalAcceptRow({ checked, onToggle, children }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={[styles.box, checked && styles.boxChecked]}
      >
        {checked && <Check size={14} strokeWidth={3} color={colors.onAccent} />}
      </Pressable>
      <Text style={styles.label} onPress={onToggle}>
        {children}
      </Text>
    </View>
  );
}

export function LegalLink({ children, onPress }: { children: string; onPress: () => void }) {
  return (
    <Text style={styles.link} onPress={onPress}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.s3, alignItems: 'flex-start' },
  box: {
    width: 22, height: 22, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  boxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  label: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.text },
  link: { fontFamily: fonts.bodySemiBold, color: colors.accent, textDecorationLine: 'underline' },
});
