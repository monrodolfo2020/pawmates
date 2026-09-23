import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Linking } from 'react-native';
import { Lock, Sparkles, Ticket } from 'lucide-react-native';
import Button from './Button';
import Card from './Card';
import { CardBody, CardMeta } from './CardText';
import Tag from './Tag';
import {
  api,
  BillingPeriod,
  BillingPlans,
  MyBillingPlan,
  PERIOD_LABELS,
} from '../api/client';
import { colors, fonts, radius, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = {
  /** Called once the plan actually changed, so the screen around this
   * can refetch the profile and open the editor. */
  onActivated: () => void;
};

const money = (cents: number, currency: string) =>
  '$' + (cents / 100).toLocaleString('es-MX') + ' ' + currency;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

const perPeriod: Record<BillingPeriod, string> = { monthly: 'al mes', annual: 'al año' };

/**
 * Everything a business sees about paying for VIP: what it costs, how to
 * start it, and when it runs out.
 *
 * There's no payment gateway connected yet, so `plans.online` is
 * normally false and the code box is the real path — an admin issues a
 * code once the business has paid by transfer. The checkout button is
 * wired up anyway, because when a gateway is connected it's the same
 * button.
 */
export default function PlanCard({ onActivated }: Props) {
  const s = useAppState();
  const [plans, setPlans] = useState<BillingPlans | null>(null);
  const [mine, setMine] = useState<MyBillingPlan | null>(null);
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    api.getBillingPlans().then(setPlans).catch(() => {});
    if (s.token) api.getMyBillingPlan(s.token).then(setMine).catch(() => {});
  }, [s.token]);

  const priceOf = (p: BillingPeriod) => plans?.periods.find((x) => x.period === p);
  const monthly = priceOf('monthly');
  const annual = priceOf('annual');
  // Worth saying out loud — it's the reason the annual option exists.
  const monthsFree =
    monthly && annual ? Math.round(12 - annual.amount / monthly.amount) : 0;

  const checkout = async () => {
    if (!s.token) return;
    setBusy(true);
    setError(null);
    try {
      const session = await api.startCheckout(s.token, period);
      await Linking.openURL(session.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir el pago.');
    } finally {
      setBusy(false);
    }
  };

  const redeem = async () => {
    if (!s.token || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.redeemPlanCode(s.token, code.trim());
      setDone(`Tu plan VIP queda activo hasta el ${formatDate(result.expiresAt)}.`);
      setCode('');
      onActivated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo activar el código.');
    } finally {
      setBusy(false);
    }
  };

  const isVip = mine?.isVip ?? false;
  const lapsed = mine?.plan === 'vip' && !mine.isVip;

  return (
    <Card>
      <View style={styles.rowStart}>
        {isVip ? (
          <Sparkles size={18} strokeWidth={1.5} color={colors.accent} />
        ) : (
          <Lock size={18} strokeWidth={1.5} color={colors.accent} />
        )}
        <CardBody style={{ margin: 0, flex: 1 }}>
          {isVip ? 'Tu plan VIP' : 'Diseño personalizado — plan VIP'}
        </CardBody>
        {isVip && <Tag variant="accent">Activo</Tag>}
      </View>

      {isVip && mine?.expiresAt && (
        <CardMeta>Se renueva o vence el {formatDate(mine.expiresAt)}.</CardMeta>
      )}
      {isVip && !mine?.expiresAt && (
        <CardMeta>Tu plan está activo sin fecha de vencimiento.</CardMeta>
      )}
      {lapsed && (
        <CardMeta>
          Tu plan VIP venció{mine?.expiresAt ? ` el ${formatDate(mine.expiresAt)}` : ''}. Tu página
          sigue publicada con el diseño de PawMates, y tu diseño personalizado te espera tal como lo
          dejaste: vuelve a activar VIP y reaparece.
        </CardMeta>
      )}
      {!isVip && !lapsed && (
        <CardMeta>
          Tu página usa el diseño estándar de PawMates, que se ve bien tal cual. Con VIP eliges
          colores y tipografía, subes tu logo y tu portada, cambias de plantilla y decides qué
          secciones aparecen y en qué orden.
        </CardMeta>
      )}

      <View style={styles.priceRow}>
        {(['monthly', 'annual'] as BillingPeriod[]).map((p) => {
          const price = priceOf(p);
          const selected = p === period;
          return (
            <Pressable
              key={p}
              style={[styles.priceBox, selected && styles.priceBoxSelected]}
              onPress={() => setPeriod(p)}
            >
              <Text style={styles.priceLabel}>{PERIOD_LABELS[p]}</Text>
              <Text style={styles.priceAmount}>
                {price ? money(price.amount, price.currency) : '—'}
              </Text>
              <Text style={styles.priceMeta}>{perPeriod[p]}</Text>
              {p === 'annual' && monthsFree > 0 && (
                <Text style={styles.priceSave}>{monthsFree} meses gratis</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {plans?.online ? (
        <Button variant="primary" block disabled={busy} onPress={() => void checkout()}>
          {busy
            ? 'Abriendo…'
            : `${isVip ? 'Renovar' : 'Activar'} VIP ${PERIOD_LABELS[period].toLowerCase()}`}
        </Button>
      ) : (
        <CardMeta>
          Los pagos en línea todavía no están disponibles. Escríbenos para {isVip ? 'renovar' : 'contratar'}{' '}
          tu plan y te damos un código de activación.
        </CardMeta>
      )}

      <View style={styles.divider} />

      <View style={styles.rowStart}>
        <Ticket size={16} strokeWidth={1.5} color={colors.accent} />
        <CardBody style={{ margin: 0, flex: 1 }}>¿Tienes un código de activación?</CardBody>
      </View>
      {isVip && (
        <CardMeta>Se suma al tiempo que te queda, no lo reemplaza.</CardMeta>
      )}
      <View style={styles.codeRow}>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="Ej. AB3D9K2M"
          placeholderTextColor={colors.textMuted50}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={20}
          style={styles.codeInput}
        />
        <Button variant="secondary" disabled={busy || !code.trim()} onPress={() => void redeem()}>
          {busy ? '…' : 'Activar'}
        </Button>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {done && <Text style={styles.done}>{done}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  rowStart: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },

  priceRow: { flexDirection: 'row', gap: space.s2 },
  priceBox: {
    flex: 1, gap: 2, padding: space.s3,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  priceBoxSelected: { borderColor: colors.accent, backgroundColor: colors.accent100 },
  priceLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted70 },
  priceAmount: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  priceMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted70 },
  priceSave: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.accent, marginTop: 2 },

  divider: { height: 1, backgroundColor: colors.divider, marginVertical: space.s1 },

  codeRow: { flexDirection: 'row', gap: space.s2, alignItems: 'center' },
  codeInput: {
    flex: 1,
    paddingHorizontal: space.s3, paddingVertical: 10,
    borderWidth: 1.5, borderColor: colors.divider, borderRadius: radius.sm,
    fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: 1, color: colors.text,
  },

  error: { fontFamily: fonts.body, fontSize: 13, color: colors.accent },
  done: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
});
