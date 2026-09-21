import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { ChevronLeft, Link2, ExternalLink, Copy, Check } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import Card from '../components/Card';
import { CardBody, CardMeta } from '../components/CardText';
import Tag from '../components/Tag';
import { colors, fonts, radius, space } from '../theme/tokens';
import { api, MyProviderProfile, isBookable } from '../api/client';
import { useAppState } from '../state/AppState';
import { micrositeUrl } from '../utils/contactLinks';

type Props = NativeStackScreenProps<RootStackParamList, 'MyPage'>;

/** What the business still has to fill in before its page goes live —
 * mirrors ProviderProfile's publish rule on the backend, which is what
 * actually decides. */
function missingToPublish(profile: MyProviderProfile): string[] {
  const missing: string[] = [];
  if (!profile.businessName) missing.push('el nombre del negocio');
  if (!profile.bio) missing.push('la descripción');
  if (isBookable(profile.category) && !profile.price) missing.push('la tarifa por paseo');
  return missing;
}

export default function MyPageScreen({ navigation }: Props) {
  const s = useAppState();
  const [profile, setProfile] = useState<MyProviderProfile | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!s.token) return;
      api.getMyProviderProfile(s.token).then(setProfile).catch(() => setProfile(null));
    }, [s.token]),
  );

  const url = profile?.slug ? micrositeUrl(profile.slug) : null;

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied (or missing outside a browser) —
      // the link is on screen right next to this button either way.
    }
  };

  const published = profile?.isPublished ?? false;
  const missing = profile ? missingToPublish(profile) : [];

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>Mi página</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {profile === undefined && <CardMeta>Cargando…</CardMeta>}

        {profile !== undefined && (
          <Card>
            <View style={styles.rowBetween}>
              <CardBody style={{ margin: 0 }}>Estado</CardBody>
              <Tag variant={published ? 'accent' : 'outline'}>
                {published ? 'Publicada ✓' : 'Sin publicar'}
              </Tag>
            </View>
            {!published && (
              <CardMeta>
                {missing.length
                  ? `Falta ${missing.join(', ')} para que tu página sea visible.`
                  : 'Completa tu página para publicarla.'}
              </CardMeta>
            )}
          </Card>
        )}

        {published && url && (
          <Card>
            <View style={styles.rowStart}>
              <Link2 size={18} strokeWidth={1.5} color={colors.accent} />
              <CardBody style={{ margin: 0, flex: 1 }}>Tu enlace para compartir</CardBody>
            </View>
            <View style={styles.linkBox}>
              <Text style={styles.linkText} selectable numberOfLines={2}>
                {url}
              </Text>
            </View>
            <View style={styles.actionsRow}>
              <Button
                variant="secondary"
                style={{ flex: 1 }}
                icon={
                  copied ? (
                    <Check size={14} strokeWidth={2} color={colors.text} />
                  ) : (
                    <Copy size={14} strokeWidth={1.5} color={colors.text} />
                  )
                }
                onPress={() => void copyLink()}
              >
                {copied ? 'Copiado' : 'Copiar enlace'}
              </Button>
              <Button
                variant="primary"
                blueprint
                style={{ flex: 1 }}
                icon={<ExternalLink size={14} strokeWidth={1.5} color={colors.bg} />}
                onPress={() => void Linking.openURL(url)}
              >
                Ver mi página
              </Button>
            </View>
            <CardMeta>
              Compártelo en tus redes o con tus clientes: se abre sin necesidad de crear una cuenta.
            </CardMeta>
          </Card>
        )}

        <Button variant="secondary" block blueprint onPress={() => navigation.navigate('ProviderProfileEdit')}>
          Editar mi página
        </Button>

        <Card>
          <CardBody style={{ margin: 0 }}>Diseño de tu página</CardBody>
          <CardMeta>
            Tu página usa el diseño estándar de PawMates. Muy pronto vas a poder personalizar colores,
            tipografía, portada y secciones con el plan VIP.
          </CardMeta>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
  },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  body: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowStart: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  linkBox: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    backgroundColor: colors.neutral100, borderRadius: radius.sm,
  },
  linkText: { fontFamily: fonts.body, fontSize: 13, color: colors.text },
  actionsRow: { flexDirection: 'row', gap: space.s2 },
});
