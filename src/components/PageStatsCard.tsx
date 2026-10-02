import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Eye, Lock, MessageCircle, Navigation } from 'lucide-react-native';
import Card from './Card';
import Button from './Button';
import Tag from './Tag';
import { CardBody, CardMeta } from './CardText';
import { api, PageStats } from '../api/client';
import { useAppState } from '../state/AppState';
import { colors, fonts, radius, space, type } from '../theme/tokens';

type Props = {
  /** Where "Ver plan VIP" takes a business that hasn't got it. */
  onSeeVip: () => void;
};

const ICONS = { view: Eye, whatsapp: MessageCircle, directions: Navigation } as const;
const LABELS = { view: 'Visitas', whatsapp: 'WhatsApp', directions: 'Cómo llegar' } as const;
const KINDS = ['view', 'whatsapp', 'directions'] as const;

/** "+3 vs. el mes pasado", "igual que el mes pasado"… */
function versus(now: number, before: number): string {
  if (now === before) return 'igual que el mes pasado';
  const diff = now - before;
  return `${diff > 0 ? '+' : ''}${diff} vs. el mes pasado`;
}

/**
 * The business's page this month: visits, and how many of those went on
 * to write on WhatsApp or ask how to get there. The full numbers are a
 * VIP (and trial) feature, decided by the backend; a free page sees its
 * visits as a preview of what it would get.
 */
export default function PageStatsCard({ onSeeVip }: Props) {
  const s = useAppState();
  const [stats, setStats] = useState<PageStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!s.token) return;
      api.getMyPageStats(s.token).then(setStats).catch(() => {});
    }, [s.token]),
  );

  if (!stats) return null;

  return (
    <Card>
      <View style={styles.head}>
        <Text style={[type.cardTitle, { flex: 1 }]}>Tu página este mes</Text>
        {!stats.unlocked && <Tag>Función VIP</Tag>}
      </View>
      <View style={styles.grid}>
        {KINDS.map((kind) => {
          const Icon = ICONS[kind];
          const value = stats.unlocked ? stats.thisMonth[kind] : kind === 'view' ? stats.thisMonth.view : null;
          return (
            <View
              key={kind}
              style={styles.stat}
              accessible
              accessibilityLabel={`${LABELS[kind]}: ${value === null ? 'bloqueado' : value}`}
            >
              <View style={styles.statHead}>
                <Icon size={15} strokeWidth={2} color={colors.accent} />
                <Text style={styles.statLabel}>{LABELS[kind]}</Text>
              </View>
              {value === null ? (
                <Lock size={22} strokeWidth={2} color={colors.textFaint} />
              ) : (
                <Text style={styles.statValue}>{value}</Text>
              )}
              {stats.unlocked && (
                <Text style={styles.statDelta}>{versus(stats.thisMonth[kind], stats.lastMonth[kind])}</Text>
              )}
            </View>
          );
        })}
      </View>
      {stats.unlocked ? (
        <CardMeta>Cuenta a cada persona una vez cada media hora. Tus propias visitas no cuentan.</CardMeta>
      ) : (
        <>
          <CardBody>
            Con VIP ves cuántas personas te escribieron por WhatsApp y cuántas pidieron cómo llegar, y cómo vas
            contra el mes pasado.
          </CardBody>
          <Button onPress={onSeeVip}>Ver plan VIP</Button>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.s3 },
  grid: { flexDirection: 'row', gap: space.s2 },
  stat: {
    flex: 1,
    gap: 4,
    padding: space.s3,
    borderRadius: radius.md,
    backgroundColor: colors.panel,
  },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.textMuted },
  statValue: { fontFamily: fonts.bodyBold, fontSize: 26, lineHeight: 30, color: colors.text },
  statDelta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted },
});
