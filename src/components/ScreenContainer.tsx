import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme/tokens';

type Props = { children: React.ReactNode; style?: StyleProp<ViewStyle> };

export default function ScreenContainer({ children, style }: Props) {
  return (
    <SafeAreaView style={[styles.root, style]} edges={['top', 'bottom']}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
