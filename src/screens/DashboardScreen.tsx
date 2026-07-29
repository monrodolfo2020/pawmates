import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import { CardKicker, CardTitle, CardMeta, CardBody } from '../components/CardText';
import Tag from '../components/Tag';
import Button from '../components/Button';
import BottomTabBar from '../components/BottomTabBar';
import { colors, fonts, space } from '../theme/tokens';
import { weekDays, requests } from '../state/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Modo paseador</Text>
          <Text style={styles.title}>Hola, Camila</Text>
        </View>
        <Pressable
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
        >
          <Tag variant="outline">Modo dueño</Tag>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card elevation="sm">
          <CardKicker>Ingresos esta semana</CardKicker>
          <Text style={styles.earnings}>$412.50</Text>
          <CardMeta>12 paseos completados</CardMeta>
        </Card>

        <View>
          <Text style={styles.label}>Esta semana</Text>
          <View style={styles.weekRow}>
            {weekDays.map((wd, i) => (
              <Card key={i} style={styles.weekCell}>
                <CardKicker style={{ margin: 0 }}>{wd.label}</CardKicker>
                <Text style={styles.weekCount}>{wd.count}</Text>
              </Card>
            ))}
          </View>
        </View>

        <View style={{ gap: space.s2 }}>
          <Text style={styles.h5}>Solicitudes nuevas</Text>
          {requests.map((r) => (
            <Card key={r.pet}>
              <View style={styles.reqHeader}>
                <CardTitle style={{ fontSize: 15 }}>{r.pet}</CardTitle>
                <Tag variant="outline">{r.time}</Tag>
              </View>
              <CardBody>{r.detail}</CardBody>
              <View style={styles.reqActions}>
                <Button variant="secondary" style={{ flex: 1 }}>Rechazar</Button>
                <Button variant="primary" blueprint style={{ flex: 1 }}>Aceptar</Button>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      <BottomTabBar items={['Panel', 'Solicitudes', 'Mensajes', 'Perfil']} activeIndex={0} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s4, paddingTop: space.s4, paddingBottom: space.s2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  kicker: { fontFamily: fonts.body, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.accent },
  title: { fontFamily: fonts.heading, fontSize: 22, color: colors.text },
  scroll: { paddingHorizontal: space.s4, gap: space.s4, paddingBottom: space.s4 },
  earnings: { fontFamily: fonts.heading, fontSize: 34, color: colors.text, lineHeight: 38 },
  label: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted70, marginBottom: 5 },
  weekRow: { flexDirection: 'row', gap: 6 },
  weekCell: { flex: 1, alignItems: 'center', padding: 6, gap: 2 },
  weekCount: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  h5: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  reqActions: { flexDirection: 'row', gap: 6 },
});
