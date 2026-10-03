import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Gift, PawPrint } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import MicrositeView from '../components/MicrositeView';
import Button from '../components/Button';
import Notice from '../components/Notice';
import { api, InvitationPreview } from '../api/client';
import { clearInvitation, invitationToken } from '../navigation/invitation';
import { colors, fonts, radius, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Invite'>;

const PAGE_MAX_WIDTH = 720;

/**
 * What a business sees when it opens the link PET Conect@ sent it: the
 * page we prepared for it, exactly as it would look, and the way to
 * claim it. Nothing here is public yet — see the backend's
 * BusinessInvitation.
 */
export default function InviteScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = invitationToken();
    if (!token) {
      setError('Este enlace no tiene una invitación.');
      return;
    }
    api
      .getInvitation(token)
      .then(setInvitation)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo abrir la invitación.'));
  }, []);

  const leave = () => {
    clearInvitation();
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  if (error || invitation?.claimed) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <PawPrint size={40} strokeWidth={1.25} color={colors.text} />
          <Text style={styles.notFoundTitle}>
            {invitation?.claimed ? 'Esta página ya fue reclamada' : 'Invitación no encontrada'}
          </Text>
          <Text style={styles.muted}>
            {invitation?.claimed
              ? `Alguien ya creó la cuenta de ${invitation.businessName}. Si fuiste tú, inicia sesión con tu cuenta de negocio.`
              : error}
          </Text>
          {invitation?.claimed && (
            <Button variant="primary" onPress={() => navigation.navigate('Login')}>
              Iniciar sesión
            </Button>
          )}
          <Button onPress={leave}>Conocer PET Conect@</Button>
        </View>
      </ScreenContainer>
    );
  }

  if (!invitation) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={styles.muted}>Cargando…</Text>
        </View>
      </ScreenContainer>
    );
  }

  const columnWidth = Math.min(width, PAGE_MAX_WIDTH);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ width: columnWidth, gap: space.s4 }}>
          <View style={styles.offer}>
            <View style={styles.offerHead}>
              <View style={styles.offerIcon}>
                <Gift size={20} strokeWidth={2} color={colors.accent} />
              </View>
              <Text style={styles.kicker}>PET Conect@ · Invitación</Text>
            </View>
            <Text style={styles.title}>Preparamos una página gratis para {invitation.businessName}</Text>
            <Text style={styles.body}>
              PET Conect@ es un directorio donde los dueños de mascotas encuentran servicios cerca de
              ellos. Abajo ves cómo quedaría tu página. Todavía no es pública: se publica solo si la
              reclamas.
            </Text>
            <View style={styles.steps}>
              <Step n={1}>Crea tu cuenta de negocio. Es gratis.</Step>
              <Step n={2}>Confirma tu identidad con una foto tuya y de tu identificación.</Step>
              <Step n={3}>Revisamos tu página, la publicamos y te mandamos tu enlace y tu código QR.</Step>
            </View>
            <Button
              variant="primary"
              block
              onPress={() =>
                navigation.navigate('Signup', {
                  role: 'provider',
                  businessName: invitation.businessName,
                  category: invitation.category,
                })
              }
            >
              Reclamar mi página gratis
            </Button>
            <Button block onPress={() => navigation.navigate('Login')}>
              Ya tengo cuenta de negocio
            </Button>
            <Text style={styles.small}>
              Al reclamarla puedes cambiar todo: textos, fotos, horario y diseño.
            </Text>
          </View>

          <Notice title="Vista previa" style={{ marginHorizontal: space.s4 }}>
            Así verán tu página los dueños de mascotas. Los datos son los que encontramos públicos de
            tu negocio; corrígelos cuando la reclames.
          </Notice>
          <View style={[styles.frame, { backgroundColor: invitation.page.design.backgroundColor }]}>
            <MicrositeView business={invitation.page} design={invitation.page.design} />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{n}</Text>
      </View>
      <Text style={[styles.body, { flex: 1 }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { alignItems: 'center', paddingBottom: space.s8, paddingTop: space.s4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s3, paddingHorizontal: space.s6 },
  notFoundTitle: { ...type.title, textAlign: 'center' },
  muted: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  offer: {
    marginHorizontal: space.s4, padding: space.s4, gap: space.s3,
    borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  offerHead: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  offerIcon: {
    width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.accentTint,
    alignItems: 'center', justifyContent: 'center',
  },
  kicker: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.accent },
  title: { ...type.title },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.text },
  small: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  steps: { gap: space.s2 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: space.s2 },
  stepNumber: {
    width: 24, height: 24, borderRadius: radius.pill, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginTop: -1,
  },
  stepNumberText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.onAccent },
  frame: {
    marginHorizontal: space.s4, borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
});
