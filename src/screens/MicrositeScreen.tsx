import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { PawPrint } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import MicrositeView from '../components/MicrositeView';
import { colors, fonts, space, type } from '../theme/tokens';
import { api, ProviderDetail } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Microsite'>;

// Desktop gets the page in a centered column rather than stretched edge
// to edge — this is a landing page someone was linked to, not an app
// screen, and full-width body text at 1400px is unreadable.
const PAGE_MAX_WIDTH = 720;

/**
 * The business's public micro-page. What it looks like is entirely
 * `business.design`, which the backend already resolved for us: a VIP
 * business gets whatever it last published, and a free one gets
 * PawMates' own design handed back as its design (see the backend's
 * ProviderProfile.effectiveDesign). So this screen never has to know
 * about plans — it just fetches and renders.
 *
 * Served standalone at /s/<slug> — see RootNavigator's microsite gate.
 * Every visitor is treated as a signed-out stranger, because that's who
 * a shared link usually reaches.
 */
export default function MicrositeScreen({ route }: Props) {
  const { slug } = route.params;
  const { width } = useWindowDimensions();
  const [business, setBusiness] = useState<ProviderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getProviderBySlug(slug)
      .then(setBusiness)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar esta página.'));
  }, [slug]);

  if (error) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <PawPrint size={40} strokeWidth={1.25} color={colors.text} />
          <Text style={styles.notFoundTitle}>Página no encontrada</Text>
          <Text style={styles.notFoundBody}>{error}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!business) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={styles.notFoundBody}>Cargando…</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <View style={[styles.canvas, { backgroundColor: business.design.backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ width: Math.min(width, PAGE_MAX_WIDTH) }}>
          <MicrositeView business={business} design={business.design} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1 },
  scroll: { alignItems: 'center', paddingBottom: space.s8 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s3, paddingHorizontal: space.s6 },
  notFoundTitle: { ...type.title },
  notFoundBody: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
