import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { colors, radius, space, shadow } from '../theme/tokens';
import CornerMarks from './CornerMarks';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: 'sm' | 'md' | 'lg';
  blueprint?: boolean;
  row?: boolean;
  onPress?: () => void;
};

// A rounded, white surface card floating on the app's cream background.
export default function Card({
  children, style, elevation, blueprint = true, row = false, onPress,
}: Props) {
  const content = (
    <View
      style={[
        styles.card,
        row && styles.row,
        elevation ? shadow[elevation] : null,
        style,
      ]}
    >
      {blueprint && <CornerMarks />}
      {children}
    </View>
  );
  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
    gap: space.s2,
    padding: space.s3,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
