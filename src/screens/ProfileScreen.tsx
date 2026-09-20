import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { vividColors as v, vividFonts as vf, vividRadius as vr } from '../theme/vividTokens';
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
            <ChevronLeft size={16} strokeWidth={2} color={v.ink} />
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
            {s.roles.includes('owner') && (
              <Pressable
                style={styles.outlineBtn}
                onPress={() => navigation.navigate('Orders', { mode: 'purchases', title: 'Mis compras' })}
              >
                <Text style={styles.outlineBtnText}>Mis compras</Text>
              </Pressable>
            )}
            {s.roles.includes('provider') && (
              <Pressable
                style={styles.outlineBtn}
                onPress={() => navigation.navigate('Orders', { mode: 'sales', title: 'Pedidos por entregar' })}
              >
                <Text style={styles.outlineBtnText}>Pedidos por entregar</Text>
              </Pressable>
            )}
            {s.roles.includes('provider') && (
              <Pressable style={styles.outlineBtn} onPress={() => navigation.navigate('Dashboard')}>
                <Text style={styles.outlineBtnText}>Modo paseador</Text>
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
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: v.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14 },
  backBtn: {
    width: 36, height: 36, borderRadius: vr.pill, borderWidth: 1, borderColor: v.line,
    backgroundColor: v.surface, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: vf.display, fontSize: 26, color: v.ink },
  body: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  card: { padding: 18, borderRadius: vr.lg, backgroundColor: v.surface, borderWidth: 1, borderColor: v.line, gap: 4 },
  kicker: { fontFamily: vf.bodySemiBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: v.muted2 },
  name: { fontFamily: vf.display, fontSize: 24, color: v.ink, marginTop: 2 },
  mutedBody: { fontFamily: vf.body, fontSize: 13.5, color: v.mute },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  roleTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: vr.pill, borderWidth: 1, borderColor: v.line, backgroundColor: v.panel },
  roleTagText: { fontFamily: vf.bodySemiBold, fontSize: 11, color: v.mute },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: v.line, marginTop: 4 },
  addPetRow: { paddingTop: 10, marginTop: 4, borderTopWidth: 1, borderTopColor: v.line },
  linkText: { fontFamily: vf.bodySemiBold, fontSize: 13.5, color: v.coral },
  outlineBtn: { paddingVertical: 14, borderRadius: vr.md, borderWidth: 1, borderColor: v.line, backgroundColor: v.surface, alignItems: 'center' },
  outlineBtnText: { fontFamily: vf.bodySemiBold, fontSize: 14, color: v.ink },
  primaryBtn: { paddingVertical: 14, borderRadius: vr.md, backgroundColor: v.coral, alignItems: 'center' },
  primaryBtnText: { fontFamily: vf.bodyBold, fontSize: 14, color: v.bg },
});
