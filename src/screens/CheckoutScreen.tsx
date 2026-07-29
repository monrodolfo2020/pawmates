import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import Field from '../components/Field';
import Tag from '../components/Tag';
import RadioRow from '../components/RadioRow';
import Card from '../components/Card';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import { tipOptions, paymentOptions, BASE_PRICE } from '../state/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

const money = (n: number) => `$${n.toFixed(2)}`;

export default function CheckoutScreen({ navigation }: Props) {
  const s = useAppState();
  const serviceFee = 3.2;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>Resumen y pago</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <View style={styles.row}>
            <Text style={styles.rowText}>Tarifa (3 paseos/sem × $18)</Text>
            <Text style={styles.rowText}>{money(BASE_PRICE)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>Comisión de servicio</Text>
            <Text style={styles.rowText}>{money(serviceFee)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>Propina ({s.tip}%)</Text>
            <Text style={styles.rowText}>{money(s.tipAmount)}</Text>
          </View>
          <View style={styles.hr} />
          <View style={styles.row}>
            <Text style={styles.totalText}>Total semanal</Text>
            <Text style={styles.totalText}>{money(s.total)}</Text>
          </View>
        </Card>

        <Field label="Propina para Camila">
          <View style={styles.tipRow}>
            {tipOptions.map((v) => (
              <Tag
                key={v}
                variant={s.tip === v ? 'accent' : 'outline'}
                onPress={() => s.setTip(v)}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
              >
                {v}%
              </Tag>
            ))}
          </View>
        </Field>

        <Field label="Método de pago">
          <View>
            {paymentOptions.map((p) => (
              <RadioRow key={p} label={p} selected={s.payment === p} onPress={() => s.setPayment(p)} />
            ))}
          </View>
        </Field>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          variant="primary"
          block
          blueprint
          onPress={() => navigation.navigate('Live', { walkerId: 'w1' })}
        >
          Confirmar y pagar
        </Button>
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
  scroll: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowText: { fontFamily: fonts.body, fontSize: 13, color: colors.text },
  hr: { height: 1, backgroundColor: colors.divider, marginVertical: 6 },
  totalText: { fontFamily: fonts.heading, fontSize: 17, color: colors.text },
  tipRow: { flexDirection: 'row', gap: 6 },
  footer: { padding: space.s4 },
});
