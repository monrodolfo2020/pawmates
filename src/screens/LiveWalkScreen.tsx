import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MessageCircle, Phone } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import Card from '../components/Card';
import { CardMeta, CardBody } from '../components/CardText';
import ImagePlaceholder from '../components/ImagePlaceholder';
import Tag from '../components/Tag';
import { colors, fonts, space } from '../theme/tokens';
import { liveLog } from '../state/mockData';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Live'>;

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Iniciando…',
  starting: 'Iniciando…',
  in_progress: '● En vivo',
  completing: 'Terminando…',
  completed: '✓ Paseo terminado',
  error: 'Error de conexión',
};

export default function LiveWalkScreen({ navigation }: Props) {
  const s = useAppState();
  const startedRef = useRef(false);

  useEffect(() => {
    // StrictMode/fast-refresh can mount this screen more than once — only
    // ever start the real trip the first time this screen is reached.
    if (startedRef.current) return;
    startedRef.current = true;
    void s.startTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finished = s.bookingStatus === 'completed';

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Tag variant="accent">{STATUS_LABEL[s.bookingStatus] ?? '● En vivo'}</Tag>
        <Text style={styles.kicker}>Camila R.</Text>
      </View>

      <View style={styles.map}>
        <Svg width="100%" height="100%" viewBox="0 0 300 210" style={StyleSheet.absoluteFill}>
          <Path
            d="M40 170 L90 120 L130 140 L190 60 L250 40"
            stroke={colors.accent}
            strokeWidth={2}
            fill="none"
            strokeDasharray="5 4"
          />
        </Svg>
        <View style={styles.startDot} />
        <View style={styles.endDot} />
      </View>

      <View style={styles.actions}>
        <Button variant="secondary" blueprint style={{ flex: 1 }} icon={<MessageCircle size={14} strokeWidth={1.5} color={colors.text} />}>
          Mensaje
        </Button>
        <Button variant="secondary" blueprint style={{ flex: 1 }} icon={<Phone size={14} strokeWidth={1.5} color={colors.text} />}>
          Llamar
        </Button>
      </View>

      {s.bookingStatus === 'error' && s.bookingError && (
        <View style={{ paddingHorizontal: space.s4, paddingTop: space.s2 }}>
          <Card>
            <CardBody style={{ color: colors.accent }}>{s.bookingError}</CardBody>
          </Card>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h5}>Bitácora del paseo</Text>
        {liveLog.map((entry) => (
          <Card key={entry.time} row={entry.photo}>
            {entry.photo && <ImagePlaceholder label="Foto" style={styles.logPhoto} />}
            <View style={{ flex: 1 }}>
              <CardMeta>{entry.time}</CardMeta>
              <CardBody>{entry.text}</CardBody>
            </View>
          </Card>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {finished ? (
          <Button
            variant="primary"
            block
            blueprint
            onPress={() => navigation.navigate('Home')}
          >
            Volver al inicio
          </Button>
        ) : (
          <Button
            variant="primary"
            block
            blueprint
            disabled={s.bookingStatus === 'completing'}
            onPress={() => void s.completeTrip()}
          >
            Finalizar paseo
          </Button>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s4, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  kicker: { fontFamily: fonts.body, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.accent },
  map: {
    marginHorizontal: space.s4, marginBottom: space.s3, height: 210,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider,
  },
  startDot: {
    position: 'absolute', left: '13%', top: '75%', width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.text,
  },
  endDot: {
    position: 'absolute', left: '81%', top: '15%', width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.accent, borderWidth: 4, borderColor: colors.accent200,
  },
  actions: { flexDirection: 'row', gap: space.s2, paddingHorizontal: space.s4 },
  scroll: { padding: space.s4, gap: space.s2 },
  h5: { fontFamily: fonts.heading, fontSize: 16, color: colors.text, marginBottom: 4 },
  logPhoto: { width: 48, height: 48, marginRight: space.s3 },
  footer: { padding: space.s4 },
});
