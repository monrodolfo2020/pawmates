import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { IconButton } from './Button';
import { colors, space, type } from '../theme/tokens';

type Props = {
  title?: string;
  /** A line under the title, in sans. */
  subtitle?: string;
  /** Small uppercase line above the title. */
  kicker?: string;
  onBack?: () => void;
  /** Something small on the right (a button, a status). */
  right?: React.ReactNode;
};

/**
 * Every screen's top: an optional back button, then a serif title.
 * The title sits under the back row rather than beside it, so long
 * business names don't get squeezed.
 */
export default function ScreenHeader({ title, subtitle, kicker, onBack, right }: Props) {
  return (
    <View style={styles.wrap}>
      {(onBack || right) && (
        <View style={styles.bar}>
          {onBack ? (
            <IconButton onPress={onBack} label="Regresar">
              <ChevronLeft size={20} strokeWidth={1.75} color={colors.text} />
            </IconButton>
          ) : (
            <View />
          )}
          {right}
        </View>
      )}
      {(title || kicker) && (
        <View style={styles.text}>
          {kicker && <Text style={type.kicker}>{kicker}</Text>}
          {title && (
            <Text style={type.title} accessibilityRole="header">
              {title}
            </Text>
          )}
          {subtitle && <Text style={type.small}>{subtitle}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.s4, paddingTop: space.s3, paddingBottom: space.s3, gap: space.s3 },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 },
  text: { gap: space.s1 },
});
