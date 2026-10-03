import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Linking, Platform } from 'react-native';
import Card from './Card';
import Button from './Button';
import Tag from './Tag';
import Notice from './Notice';
import { CardBody, CardMeta, CardTitle } from './CardText';
import { api, CATEGORY_LABELS_SINGULAR, Invitation } from '../api/client';
import { useAppState } from '../state/AppState';
import { invitationUrl } from '../navigation/invitation';
import { whatsappUrl } from '../utils/contactLinks';
import { INVITATION_COLUMNS, parseInvitations } from '../utils/parseInvitations';
import { colors, fonts, radius, space, type } from '../theme/tokens';

/** What goes to the business with its link. */
export function invitationMessage(inv: Pick<Invitation, 'businessName' | 'token'>): string {
  return (
    `¡Hola! Somos PET Conect@, un directorio de servicios para mascotas. ` +
    `Le preparamos a ${inv.businessName} una página gratis para que más dueños de mascotas los encuentren. ` +
    `Véanla aquí: ${invitationUrl(inv.token)} ` +
    `Si les gusta, la reclaman creando su cuenta gratis y la publicamos. No tiene ningún costo.`
  );
}

const open = (url: string) => {
  if (Platform.OS === 'web') window.open(url, '_blank', 'noopener');
  else void Linking.openURL(url);
};

/**
 * Admin panel, "Invitaciones": pages PET Conect@ prepares for businesses
 * that aren't in the app yet, and the link each one gets to see and
 * claim its page. Nothing created here is public.
 */
export default function AdminInvitations() {
  const s = useAppState();
  const [invitations, setInvitations] = useState<Invitation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!s.token) return;
    api
      .adminListInvitations(s.token)
      .then(setInvitations)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar las invitaciones.'));
  }, [s.token]);
  useEffect(load, [load]);

  const pending = (invitations ?? []).filter((i) => !i.claimedAt).length;
  const claimed = (invitations?.length ?? 0) - pending;

  return (
    <View style={{ gap: space.s2 }}>
      <Text style={type.section}>Páginas listas para reclamar</Text>
      <CardMeta>
        Prepara la página de un negocio que todavía no está en la app y mándale el enlace. El
        negocio ve cómo quedaría y la reclama creando su cuenta. Nada de esto es público: la página
        sale en el directorio solo cuando el negocio la reclama, verifica su identidad y tú lo
        apruebas en Negocios.
      </CardMeta>
      <NewInvitationsForm onCreated={load} />
      {error && <Notice tone="danger">{error}</Notice>}
      {invitations && invitations.length > 0 && (
        <Text style={styles.h5}>
          {invitations.length} invitaciones · {claimed} reclamadas · {pending} pendientes
        </Text>
      )}
      {invitations?.length === 0 && <CardMeta>Todavía no has creado invitaciones.</CardMeta>}
      {invitations?.map((inv) => (
        <InvitationRow key={inv.id} invitation={inv} onChange={load} />
      ))}
    </View>
  );
}

function NewInvitationsForm({ onCreated }: { onCreated: () => void }) {
  const s = useAppState();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const parsed = parseInvitations(text);

  const create = async () => {
    if (!s.token || parsed.rows.length === 0) return;
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const created = await api.adminCreateInvitations(s.token, parsed.rows);
      setDone(created.length);
      setText('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron crear las invitaciones.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardTitle>Crear invitaciones</CardTitle>
      <CardBody>
        En Excel o Google Sheets, pon un negocio por renglón con estas columnas, en este orden.
        Selecciona los renglones, cópialos y pégalos aquí:
      </CardBody>
      <View style={styles.columns}>
        {INVITATION_COLUMNS.map((c, i) => (
          <Tag key={c} variant={i < 2 ? 'accent' : 'outline'}>
            {`${i + 1}. ${c}`}
          </Tag>
        ))}
      </View>
      <CardMeta>
        Solo el nombre y la categoría son obligatorios. Usa solo datos públicos del negocio (los de
        su ficha en Google Maps, por ejemplo), no sus fotos ni sus reseñas. Si no pones descripción,
        la página dice algo general según la categoría.
      </CardMeta>
      <TextInput
        value={text}
        onChangeText={(v) => {
          setText(v);
          setDone(null);
        }}
        placeholder={'Veterinaria Patitas\tVeterinaria\tAv. Hidalgo 10, Toluca\t722 123 4567'}
        placeholderTextColor={colors.textFaint}
        multiline
        style={styles.paste}
        accessibilityLabel="Lista de negocios"
      />
      {parsed.errors.map((e) => (
        <Notice key={e} tone="warning">
          {e}
        </Notice>
      ))}
      {error && <Notice tone="danger">{error}</Notice>}
      {done !== null && (
        <Notice tone="success">
          {done === 1 ? 'Se creó 1 invitación.' : `Se crearon ${done} invitaciones.`} Abajo está el
          enlace de cada una.
        </Notice>
      )}
      <Button
        variant="primary"
        disabled={busy || parsed.rows.length === 0 || parsed.errors.length > 0}
        onPress={() => void create()}
      >
        {busy
          ? 'Creando…'
          : parsed.rows.length === 1
            ? 'Crear 1 invitación'
            : `Crear ${parsed.rows.length} invitaciones`}
      </Button>
    </Card>
  );
}

function InvitationRow({ invitation: inv, onChange }: { invitation: Invitation; onChange: () => void }) {
  const s = useAppState();
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const link = invitationUrl(inv.token);
  const whatsapp = inv.whatsapp ? whatsappUrl(inv.whatsapp) : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(invitationMessage(inv));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied — the link is shown below anyway.
    }
  };

  const remove = async () => {
    if (!s.token) return;
    setBusy(true);
    setError(null);
    try {
      await api.adminDeleteInvitation(s.token, inv.id);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo borrar.');
      setBusy(false);
    }
  };

  return (
    <Card>
      <View style={styles.row}>
        <Text style={[type.cardTitle, { flex: 1 }]}>{inv.businessName}</Text>
        <Tag variant={inv.claimedAt ? 'success' : 'warning'}>{inv.claimedAt ? 'Reclamada ✓' : 'Pendiente'}</Tag>
      </View>
      <CardMeta>
        {[CATEGORY_LABELS_SINGULAR[inv.category], inv.publicAddress, inv.whatsapp].filter(Boolean).join(' · ')}
      </CardMeta>
      {inv.claimedAt ? (
        <CardMeta>
          La reclamó {inv.claimedByEmail ?? 'una cuenta que ya no existe'} el{' '}
          {new Date(inv.claimedAt).toLocaleDateString('es-MX')}. Apruébala en Negocios cuando
          verifiques su identidad.
        </CardMeta>
      ) : (
        <>
          <Text style={styles.link} selectable>
            {link}
          </Text>
          <View style={styles.actions}>
            {whatsapp && (
              <Button
                size="sm"
                variant="primary"
                onPress={() => open(`${whatsapp}?text=${encodeURIComponent(invitationMessage(inv))}`)}
              >
                Enviar por WhatsApp
              </Button>
            )}
            <Button size="sm" onPress={() => void copy()}>
              {copied ? 'Mensaje copiado' : 'Copiar mensaje'}
            </Button>
            <Button size="sm" onPress={() => open(link)}>
              Ver página
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onPress={() => setConfirmDelete((v) => !v)}>
              Borrar
            </Button>
          </View>
          {confirmDelete && (
            <View style={styles.actions}>
              <CardMeta>¿Borrar esta invitación? El enlace dejará de funcionar.</CardMeta>
              <Button size="sm" variant="primary" disabled={busy} onPress={() => void remove()}>
                {busy ? 'Borrando…' : 'Sí, borrar'}
              </Button>
            </View>
          )}
        </>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
    </Card>
  );
}

const styles = StyleSheet.create({
  h5: { ...type.section, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 + 2 },
  paste: {
    minHeight: 120, textAlignVertical: 'top', padding: space.s3,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface,
    fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.text,
  },
  link: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.s2 },
});
