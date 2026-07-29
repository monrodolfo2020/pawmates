import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Camera } from 'lucide-react-native';
import { colors, fonts } from '../theme/tokens';
import CornerMarks from './CornerMarks';

type Props = {
  label: string;
  style?: StyleProp<ViewStyle>;
  blueprint?: boolean;
};

// Stands in for the design's <image-slot> — a duotone blueprint placeholder
// box with a caption, since there's no real photo backing this prototype.
export default function ImagePlaceholder({ label, style, blueprint = true }: Props) {
  return (
    <View style={[styles.box, style]}>
      {blueprint && <CornerMarks />}
      <Camera size={22} strokeWidth={1.5} color={colors.text} style={{ opacity: 0.45 }} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'rgba(89, 128, 166, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  label: { fontFamily: fonts.body, fontSize: 11, color: colors.text, opacity: 0.6 },
});
