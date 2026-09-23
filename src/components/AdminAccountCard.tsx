import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Card from './Card';
import Button from './Button';
import Tag from './Tag';
import { CardBody, CardKicker, CardMeta } from './CardText';
import { api, AdminAccount } from '../api/client';
import { colors, fonts, radius, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Mode = 'view' | 'edit' | 'delete';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Dueño de mascota',
  provider: 'Negocio',
  admin: 'Administrador',
};

type Props = {
  account: AdminAccount;
  /** The admin looking at the panel — can't suspend or delete itself. */
  selfId: string | null;
  onChanged: () => void;
};

/**
 * One account in the admin panel, with the three things an admin can do
 * to it: correct its name or email, suspend or re-enable it, and delete
 * it for good.
 *
 * Deleting asks the admin to type the account's email, and the server
 * checks it again. It's the one action here that can't be undone, so a
 * single tap — or a tap on the wrong card — must not be enough.
 */
export default function AdminAccountCard({ account: a, selfId, onChanged }: Props) {
  const s = useAppState();
  const [mode, setMode] = useState<Mode>('view');
  const [name, setName] = useState(a.name ?? '');
  const [email, setEmail] = useState(a.email);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelf = a.id === selfId;
  const isAdmin = a.roles.includes('admin');
  // The server refuses both of these anyway; hiding the buttons just
  // keeps the admin from being offered something that will fail.
  const protectedAccount = isSelf || isAdmin;
  const suspended = a.disabledAt !== null;

  const run = async (work: () => Promise<unknown>) => {
    if (!s.token) return;
    setBusy(true);
    setError(null);
    try {
      await work();
      setMode('view');
      setConfirmEmail('');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la acción.');
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    run(() =>
      api.adminUpdateAccount(s.token!, a.id, {
        name: name.trim(),
        email: email.trim(),
      }),
    );

  const toggle = () => run(() => api.adminSetAccountEnabled(s.token!, a.id, suspended));

  const remove = () => run(() => api.adminDeleteAccount(s.token!, a.id, confirmEmail));

  const emailMatches = confirmEmail.trim().toLowerCase() === a.email.toLowerCase();
  const emailChanged = email.trim().toLowerCase() !== a.email.toLowerCase();

  return (
    <Card style={suspended ? styles.suspendedCard : undefined}>
      <View style={styles.headRow}>
        <CardKicker style={{ margin: 0, flex: 1 }}>{a.email}</CardKicker>
        {suspended && <Tag variant="accent">Suspendida</Tag>}
        {isSelf && <Tag variant="outline">Tú</Tag>}
      </View>
      <CardBody>{a.name ?? 'Sin nombre'}</CardBody>
      <View style={styles.wrapRow}>
        {a.roles.map((r) => (
          <Tag key={r} variant="outline">
            {ROLE_LABELS[r] ?? r}
          </Tag>
        ))}
        {!a.emailVerified && <Tag variant="outline">Correo sin verificar</Tag>}
      </View>
      {suspended && (
        <CardMeta>
          Suspendida desde el {new Date(a.disabledAt!).toLocaleDateString('es-MX')}. No puede
          entrar y, si es un negocio, su página no aparece.
        </CardMeta>
      )}

      {mode === 'edit' && (
        <View style={styles.form}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Nombre" />
          <Text style={styles.label}>Correo</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="correo@ejemplo.com"
          />
          {emailChanged && (
            <CardMeta>
              El correo nuevo quedará sin verificar: la persona tendrá que confirmarlo.
            </CardMeta>
          )}
          <View style={styles.actions}>
            <Button variant="secondary" style={{ flex: 1 }} disabled={busy} onPress={() => setMode('view')}>
              Cancelar
            </Button>
            <Button variant="primary" blueprint style={{ flex: 1 }} disabled={busy} onPress={() => void save()}>
              {busy ? 'Guardando…' : 'Guardar'}
            </Button>
          </View>
        </View>
      )}

      {mode === 'delete' && (
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Eliminar esta cuenta de forma definitiva</Text>
          <CardMeta>
            Se borran la cuenta, sus mascotas, su página de negocio y su enlace, su verificación y sus
            fotos. No se puede deshacer.
          </CardMeta>
          <CardMeta>
            Se conservan, sin poder vincularse ya a nadie: las reservas y conversaciones (también son
            de la otra persona), los pagos del plan VIP (la ley fiscal pide guardarlos) y la
            constancia de lo que aceptó.
          </CardMeta>
          <Text style={styles.label}>Escribe {a.email} para confirmar</Text>
          <TextInput
            value={confirmEmail}
            onChangeText={setConfirmEmail}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={a.email}
          />
          <View style={styles.actions}>
            <Button
              variant="secondary"
              style={{ flex: 1 }}
              disabled={busy}
              onPress={() => {
                setMode('view');
                setConfirmEmail('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              style={[{ flex: 1 }, styles.deleteButton]}
              disabled={busy || !emailMatches}
              onPress={() => void remove()}
            >
              {busy ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </View>
        </View>
      )}

      {error && <CardMeta style={{ color: colors.accent }}>{error}</CardMeta>}

      {mode === 'view' && (
        <View style={styles.actions}>
          <Button variant="secondary" style={{ flex: 1 }} disabled={busy} onPress={() => setMode('edit')}>
            Editar
          </Button>
          {!protectedAccount && (
            <Button variant="secondary" style={{ flex: 1 }} disabled={busy} onPress={() => void toggle()}>
              {busy ? '…' : suspended ? 'Habilitar' : 'Suspender'}
            </Button>
          )}
          {!protectedAccount && (
            <Button variant="ghost" style={{ flex: 1 }} disabled={busy} onPress={() => setMode('delete')}>
              Eliminar
            </Button>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  suspendedCard: { opacity: 0.85 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  form: { gap: space.s2, paddingTop: space.s2 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted70 },
  input: {
    paddingHorizontal: space.s3, paddingVertical: 10,
    borderWidth: 1.5, borderColor: colors.divider, borderRadius: radius.sm,
    fontFamily: fonts.body, fontSize: 13.5, color: colors.text,
  },
  actions: { flexDirection: 'row', gap: space.s2, marginTop: space.s1 },
  dangerZone: {
    gap: space.s2, marginTop: space.s2, padding: space.s3,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.accent,
    backgroundColor: colors.accent100,
  },
  dangerTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.accent },
  deleteButton: { backgroundColor: colors.accent },
});
