import React, { useState } from 'react';
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
import Segmented from '../components/Segmented';
import Card from '../components/Card';
import { CardKicker, CardBody } from '../components/CardText';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import { dayOptions, timeOptions } from '../state/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'Booking'>;

export default function BookingScreen({ navigation }: Props) {
  const s = useAppState();
  const [duration, setDuration] = useState('60');

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>Paseo recurrente</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Field label="Días de la semana">
          <View style={styles.dayRow}>
            {dayOptions.map((d) => (
              <Tag
                key={d}
                variant={s.days.includes(d) ? 'accent' : 'outline'}
                onPress={() => s.toggleDay(d)}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
              >
                {d}
              </Tag>
            ))}
          </View>
        </Field>

        <Field label="Horario">
          <View>
            {timeOptions.map((t) => (
              <RadioRow key={t} label={t} selected={s.time === t} onPress={() => s.setTime(t)} />
            ))}
          </View>
        </Field>

        <Field label="Duración">
          <Segmented
            options={[{ label: '30 min', value: '30' }, { label: '60 min', value: '60' }]}
            value={duration}
            onChange={setDuration}
          />
        </Field>

        <Card>
          <CardKicker>Repite cada semana</CardKicker>
          <CardBody>
            Se generará una reserva automática para los días elegidos. Puedes pausar o cancelar
            cualquier paseo individual sin costo hasta 2h antes.
          </CardBody>
        </Card>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          variant="primary"
          block
          blueprint
          onPress={() => navigation.navigate('Checkout', { walkerId: 'w1' })}
        >
          Continuar a pago
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
  dayRow: { flexDirection: 'row', gap: 6 },
  footer: { padding: space.s4 },
});
