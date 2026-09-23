import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import { colors, fonts, radius, space, type } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ROLE_LABEL: Record<string, string> = {
  owner: 'Dueño de mascota',
  provider: 'Negocio',
  admin: 'Administrador',
};

export default function ProfileScreen({ navigation }: Props) {
  const s = useAppState();

  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => navigation.goBack()} title="Perfil" />
      <ScrollView contentContainerStyle={styles.body}>
        <Card row>
          <Avatar name={s.name ?? s.email ?? '?'} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.name}>{s.name ?? 'Sin nombre'}</Text>
            <Text style={type.small}>{s.email}</Text>
            <Text style={type.meta}>{s.roles.map((role) => ROLE_LABEL[role] ?? role).join(' · ')}</Text>
          </View>
        </Card>

        {s.roles.includes('owner') && (
          <View style={styles.section}>
            <Text style={type.section}>Tus mascotas</Text>
            <Card style={styles.list}>
              {s.pets.map((p, i) => (
                <Pressable
                  key={p.id}
                  style={[styles.petRow, i > 0 && styles.rowDivider]}
                  onPress={() => navigation.navigate('Onboarding', { petId: p.id })}
                >
                  <Avatar name={p.name} uri={p.photo} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={type.cardTitle}>{p.name}</Text>
                    <Text style={type.meta}>{p.breed} · {p.size}</Text>
                  </View>
                  <Text style={styles.linkText}>Editar</Text>
                </Pressable>
              ))}
              <Pressable
                style={[styles.petRow, s.pets.length > 0 && styles.rowDivider]}
                onPress={() => navigation.navigate('Onboarding')}
              >
                <View style={styles.addIcon}>
                  <Plus size={18} strokeWidth={1.75} color={colors.textMuted} />
                </View>
                <Text style={[styles.linkText, { flex: 1 }]}>
                  {s.pets.length > 0 ? 'Agregar otra mascota' : 'Agregar una mascota'}
                </Text>
              </Pressable>
            </Card>
          </View>
        )}

        {(s.roles.includes('provider') || s.roles.includes('admin')) && (
          <View style={{ gap: space.s2 }}>
            {s.roles.includes('provider') && (
              <Button block onPress={() => navigation.navigate('Dashboard')}>
                Mi negocio
              </Button>
            )}
            {s.roles.includes('admin') && (
              <Button block onPress={() => navigation.navigate('Admin')}>
                Panel de administrador
              </Button>
            )}
          </View>
        )}

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

        <Button variant="danger" block onPress={() => void s.logout()}>
          Cerrar sesión
        </Button>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.s4, paddingBottom: space.s8, gap: space.s6 },
  name: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: colors.text },
  section: { gap: space.s3 },
  list: { paddingVertical: space.s1, gap: 0 },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: space.s3, paddingVertical: space.s3 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  addIcon: {
    width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.panel,
    alignItems: 'center', justifyContent: 'center',
  },
  linkText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.accent },
  legalRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: space.s2 },
  legalLink: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, textDecorationLine: 'underline' },
  legalSeparator: { fontFamily: fonts.body, fontSize: 13, color: colors.textFaint },
});
