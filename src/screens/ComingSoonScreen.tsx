import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChevronLeft, Clock } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import { colors, fonts, space } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ComingSoon'>;

export default function ComingSoonScreen({ navigation, route }: Props) {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>{route.params.title}</Text>
      </View>
      <View style={styles.body}>
        <Clock size={32} strokeWidth={1.5} color={colors.accent} />
        <Text style={styles.message}>{route.params.title} está en camino — todavía no disponible en esta versión.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
  },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s3, paddingHorizontal: space.s6 },
  message: { fontFamily: fonts.body, fontSize: 14, color: colors.text, opacity: 0.75, textAlign: 'center' },
});
