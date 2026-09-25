import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { ChevronRight, Plus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Notice from '../components/Notice';
import Sheet from '../components/Sheet';
import TextField from '../components/TextField';
import { api } from '../api/client';
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
  const [sheet, setSheet] = useState<'name' | 'password' | null>(null);
  const [name, setName] = useState('');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const open = (which: 'name' | 'password') => {
    setError(null);
    setName(s.name ?? '');
    setCurrent('');
    setNext('');
    setConfirm('');
    setSheet(which);
  };

  const run = async (work: () => Promise<void>, message: string) => {
    setBusy(true);
    setError(null);
    try {
      await work();
      setSheet(null);
      setDone(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  const mismatch = confirm.length > 0 && next !== confirm;
  const passwordReady = current.length > 0 && next.length >= 8 && next === confirm;

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
          <Button size="sm" onPress={() => open('name')}>Editar</Button>
        </Card>

        {done && <Notice tone="success">{done}</Notice>}

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

        <View style={styles.section}>
          <Text style={type.section}>Seguridad</Text>
          <Card row onPress={() => open('password')}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={type.cardTitle}>Cambiar contraseña</Text>
              <Text style={type.meta}>Necesitas tu contraseña actual.</Text>
            </View>
            <ChevronRight size={18} strokeWidth={1.75} color={colors.textFaint} />
          </Card>
          <Text style={type.meta}>
            Para cambiar tu correo escríbenos a rmonterrozag@gmail.com desde el correo actual.
          </Text>
        </View>

        <Button variant="danger" block onPress={() => void s.logout()}>
          Cerrar sesión
        </Button>
      </ScrollView>

      <Sheet
        visible={sheet === 'name'}
        title="Tu nombre"
        onClose={() => setSheet(null)}
        footer={
          <Button variant="primary" block disabled={busy || !name.trim()}
            onPress={() => void run(() => s.updateName(name.trim()), 'Guardamos tu nombre.')}>
            {busy ? 'Guardando…' : 'Guardar'}
          </Button>
        }
      >
        <TextField label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre"
          autoCapitalize="words" maxLength={80} />
        {error && <Notice tone="danger">{error}</Notice>}
      </Sheet>

      <Sheet
        visible={sheet === 'password'}
        title="Cambiar contraseña"
        onClose={() => setSheet(null)}
        footer={
          <Button variant="primary" block disabled={busy || !passwordReady}
            onPress={() =>
              void run(async () => {
                if (!s.token) return;
                await api.changePassword(s.token, current, next);
              }, 'Cambiamos tu contraseña.')
            }>
            {busy ? 'Guardando…' : 'Cambiar contraseña'}
          </Button>
        }
      >
        <TextField label="Contraseña actual" value={current} onChangeText={setCurrent} secureTextEntry placeholder="••••••••" />
        <TextField label="Contraseña nueva" value={next} onChangeText={setNext} secureTextEntry placeholder="Mínimo 8 caracteres" />
        <TextField label="Confirma la contraseña nueva" value={confirm} onChangeText={setConfirm} secureTextEntry
          placeholder="Escríbela otra vez" />
        {mismatch && <Notice tone="danger">Las contraseñas no coinciden.</Notice>}
        {error && <Notice tone="danger">{error}</Notice>}
        <Text style={type.meta}>
          ¿No recuerdas la actual? Cierra sesión y usa "¿Olvidaste tu contraseña?" al iniciar sesión.
        </Text>
      </Sheet>
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
