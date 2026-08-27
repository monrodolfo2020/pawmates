import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Card from '../components/Card';
import { CardKicker, CardBody, CardMeta } from '../components/CardText';
import Tag from '../components/Tag';
import { api, AdminAccount, AdminVerification } from '../api/client';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Admin'>;

const STATUS_VARIANT: Record<string, 'accent' | 'outline'> = {
  pending: 'outline',
  verified: 'accent',
  rejected: 'outline',
};

export default function AdminScreen({ navigation }: Props) {
  const s = useAppState();
  const [accounts, setAccounts] = useState<AdminAccount[] | null>(null);
  const [verifications, setVerifications] = useState<AdminVerification[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!s.token) return;
    Promise.all([api.adminListAccounts(s.token), api.adminListVerifications(s.token)])
      .then(([a, v]) => {
        setAccounts(a);
        setVerifications(v);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el panel.'));
  }, [s.token]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>Panel de administrador</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {error && (
          <Card>
            <CardBody style={{ color: colors.accent }}>{error}</CardBody>
          </Card>
        )}

        <View style={{ gap: space.s2 }}>
          <Text style={styles.h5}>Verificaciones de paseadores</Text>
          {verifications?.length === 0 && <CardMeta>No hay verificaciones registradas.</CardMeta>}
          {verifications?.map((v) => (
            <Card key={v.id}>
              <View style={styles.row}>
                <CardKicker style={{ margin: 0 }}>Cuenta {v.accountId.slice(0, 8)}…</CardKicker>
                <Tag variant={STATUS_VARIANT[v.status] ?? 'outline'}>{v.status}</Tag>
              </View>
              <CardMeta>Enviada {new Date(v.createdAt).toLocaleString()}</CardMeta>
            </Card>
          ))}
        </View>

        <View style={{ gap: space.s2 }}>
          <Text style={styles.h5}>Cuentas ({accounts?.length ?? '…'})</Text>
          {accounts?.map((a) => (
            <Card key={a.id}>
              <CardKicker style={{ margin: 0 }}>{a.email}</CardKicker>
              <CardBody>{a.name ?? 'Sin nombre'}</CardBody>
              <View style={styles.wrapRow}>
                {a.roles.map((r) => (
                  <Tag key={r} variant="outline">{r}</Tag>
                ))}
              </View>
            </Card>
          ))}
        </View>
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
  h5: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
