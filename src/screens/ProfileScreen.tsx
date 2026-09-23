import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { colors, fonts, radius } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ROLE_LABEL: Record<string, string> = {
  owner: 'Dueño de mascota',
  provider: 'Paseador',
  admin: 'Administrador',
};

export default function ProfileScreen({ navigation }: Props) {
  const s = useAppState();

  return (
    <ScreenContainer>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} strokeWidth={2} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Perfil</Text>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <Text style={styles.kicker}>Cuenta</Text>
            <Text style={styles.name}>{s.name ?? 'Sin nombre'}</Text>
            <Text style={styles.mutedBody}>{s.email}</Text>
            <View style={styles.wrapRow}>
              {s.roles.map((role) => (
                <View key={role} style={styles.roleTag}>
                  <Text style={styles.roleTagText}>{ROLE_LABEL[role] ?? role}</Text>
                </View>
              ))}
            </View>
          </View>

          {s.roles.includes('owner') && (
            <View style={styles.card}>
              <Text style={styles.kicker}>Tus mascotas</Text>
              {s.pets.map((p) => (
                <View key={p.id} style={styles.petRow}>
                  <Text style={[styles.mutedBody, { flex: 1 }]}>{p.name} · {p.breed} · {p.size}</Text>
                  <Pressable onPress={() => navigation.navigate('Onboarding', { petId: p.id })}>
                    <Text style={styles.linkText}>Editar</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable style={styles.addPetRow} onPress={() => navigation.navigate('Onboarding')}>
                <Text style={styles.linkText}>
                  {s.pets.length > 0 ? '+ Agregar otra mascota' : '+ Agregar una mascota'}
                </Text>
              </Pressable>
            </View>
          )}

          <View style={{ gap: 10 }}>
            {s.roles.includes('provider') && (
              <Pressable style={styles.outlineBtn} onPress={() => navigation.navigate('Dashboard')}>
                <Text style={styles.outlineBtnText}>Mi negocio</Text>
              </Pressable>
            )}
            {s.roles.includes('admin') && (
              <Pressable style={styles.outlineBtn} onPress={() => navigation.navigate('Admin')}>
                <Text style={styles.outlineBtnText}>Panel de administrador</Text>
              </Pressable>
            )}
            <Pressable style={styles.primaryBtn} onPress={() => void s.logout()}>
              <Text style={styles.primaryBtnText}>Salir</Text>
            </Pressable>
          </View>

          {/* The documents have to stay reachable after signup, not only
              on the screen where they were accepted. */}
          <View style={styles.legalRow}>
            <Text
              style={styles.legalLink}
              onPress={() => navigation.navigate('LegalDocument', { type: 'privacy_notice' })}
            >
              Aviso de Privacidad
            </Text>
            <Text style={styles.legalSeparator}>·</Text>
            <Text
              style={styles.legalLink}
              onPress={() =>
                navigation.navigate('LegalDocument', {
                  type: s.roles.includes('provider') ? 'provider_agreement' : 'owner_terms',
                })
              }
            >
              {s.roles.includes('provider') ? 'Acuerdo de Prestadores' : 'Términos y Condiciones'}
            </Text>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14 },
  backBtn: {
    width: 36, height: 36, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.divider,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: fonts.heading, fontSize: 26, color: colors.text },
  body: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  card: { padding: 18, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, gap: 4 },
  kicker: { fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.textFaint },
  name: { fontFamily: fonts.heading, fontSize: 24, color: colors.text, marginTop: 2 },
  mutedBody: { fontFamily: fonts.body, fontSize: 13.5, color: colors.neutral600 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  roleTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.panel },
  roleTagText: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.neutral600 },
  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 4 },
  legalLink: { fontFamily: fonts.body, fontSize: 12.5, color: colors.neutral600, textDecorationLine: 'underline' },
  legalSeparator: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textFaint },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.divider, marginTop: 4 },
  addPetRow: { paddingTop: 10, marginTop: 4, borderTopWidth: 1, borderTopColor: colors.divider },
  linkText: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.accent },
  outlineBtn: { paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center' },
  outlineBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text },
  primaryBtn: { paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center' },
  primaryBtnText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.bg },
});
