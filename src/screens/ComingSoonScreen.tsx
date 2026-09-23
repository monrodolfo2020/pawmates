import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { colors, fonts, space } from '../theme/tokens';
import ScreenHeader from '../components/ScreenHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'ComingSoon'>;

export default function ComingSoonScreen({ navigation, route }: Props) {
  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => navigation.goBack()} title={route.params.title} />
      <View style={styles.body}>
        <Clock size={32} strokeWidth={1.25} color={colors.text} />
        <Text style={styles.message}>{route.params.title} está en camino — todavía no disponible en esta versión.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s3, paddingHorizontal: space.s6 },
  message: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
