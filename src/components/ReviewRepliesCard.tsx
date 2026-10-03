import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from './Card';
import Button from './Button';
import Sheet from './Sheet';
import Notice from './Notice';
import Field from './Field';
import { CardMeta } from './CardText';
import { BoneRow } from './Bones';
import { api, MAX_REVIEW_LENGTH, type PublicReview } from '../api/client';
import { useAppState } from '../state/AppState';
import { colors, fonts, radius, space, type } from '../theme/tokens';

const SHOWN = 3;

/**
 * The business's reviews, newest first, each with "Responder": the answer
 * is published under the review on the business's page. Answering is how
 * a business shows it listens — especially under a low rating.
 */
export default function ReviewRepliesCard() {
  const s = useAppState();
  const [reviews, setReviews] = useState<PublicReview[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState<PublicReview | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!s.accountId) return;
      api.listReviews(s.accountId).then(setReviews).catch(() => {});
    }, [s.accountId]),
  );

  if (!reviews || reviews.length === 0) return null;
  const pending = reviews.filter((r) => !r.reply).length;

  return (
    <Card>
      <View style={styles.head}>
        <Text style={[type.cardTitle, { flex: 1 }]}>Reseñas de tu negocio</Text>
        {pending > 0 && <Text style={styles.pending}>{pending} sin responder</Text>}
      </View>
      {(showAll ? reviews : reviews.slice(0, SHOWN)).map((r) => (
        <View key={r.id} style={styles.review}>
          <View style={styles.reviewHead}>
            <BoneRow value={r.rating} size={14} />
            <Text style={type.meta}>{r.authorName}</Text>
          </View>
          {r.comment && <Text style={styles.text}>{r.comment}</Text>}
          {r.reply && (
            <View style={styles.reply}>
              <Text style={styles.replyLabel}>Tu respuesta</Text>
              <Text style={styles.text}>{r.reply}</Text>
            </View>
          )}
          <Button size="sm" variant={r.reply ? 'secondary' : 'primary'} onPress={() => setEditing(r)}>
            {r.reply ? 'Editar respuesta' : 'Responder'}
          </Button>
        </View>
      ))}
      {!showAll && reviews.length > SHOWN && (
        <Text style={styles.link} onPress={() => setShowAll(true)}>
          Ver las {reviews.length} reseñas
        </Text>
      )}
      <CardMeta>Tus respuestas se publican debajo de cada reseña, en tu página.</CardMeta>
      {s.token && (
        <ReplySheet
          token={s.token}
          review={editing}
          onClose={() => setEditing(null)}
          onSaved={(id, reply) =>
            setReviews((list) => list?.map((r) => (r.id === id ? { ...r, reply } : r)) ?? list)
          }
        />
      )}
    </Card>
  );
}

function ReplySheet({
  token,
  review,
  onClose,
  onSaved,
}: {
  token: string;
  review: PublicReview | null;
  onClose: () => void;
  onSaved: (id: string, reply: string | null) => void;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forId, setForId] = useState<string | null>(null);

  // Start from the current answer each time a review is opened.
  if (review && review.id !== forId) {
    setForId(review.id);
    setText(review.reply ?? '');
    setError(null);
  }

  const save = async (value: string) => {
    if (!review) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await api.replyToReview(token, review.id, value.trim());
      onSaved(review.id, saved.reply);
      setForId(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar tu respuesta.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      visible={review !== null}
      title="Responder reseña"
      onClose={() => {
        setForId(null);
        onClose();
      }}
      footer={
        <View style={{ gap: space.s2 }}>
          <Button variant="primary" block disabled={busy || !text.trim()} onPress={() => void save(text)}>
            {busy ? 'Guardando…' : 'Publicar respuesta'}
          </Button>
          {review?.reply && (
            <Button variant="ghost" block disabled={busy} onPress={() => void save('')}>
              Quitar respuesta
            </Button>
          )}
        </View>
      }
    >
      {review && (
        <View style={{ gap: space.s1 }}>
          <View style={styles.reviewHead}>
            <BoneRow value={review.rating} size={14} />
            <Text style={type.meta}>{review.authorName}</Text>
          </View>
          {review.comment && <Text style={styles.text}>{review.comment}</Text>}
        </View>
      )}
      <Field label="Tu respuesta">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Agradece, aclara o cuenta qué vas a mejorar."
          placeholderTextColor={colors.textFaint}
          multiline
          maxLength={MAX_REVIEW_LENGTH}
          style={styles.input}
          accessibilityLabel="Tu respuesta"
        />
      </Field>
      <Text style={type.meta}>Se publica en tu página, debajo de la reseña, como "Respuesta del negocio".</Text>
      {error && <Notice tone="danger">{error}</Notice>}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.s3 },
  pending: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.accent },
  review: { gap: space.s1, paddingTop: space.s3, borderTopWidth: 1, borderTopColor: colors.divider },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: space.s2, flexWrap: 'wrap' },
  text: { ...type.body, fontSize: 14.5 },
  reply: {
    marginLeft: space.s3, paddingLeft: space.s3, gap: 2,
    borderLeftWidth: 3, borderLeftColor: colors.accent,
  },
  replyLabel: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.accent },
  link: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.accent },
  input: {
    minHeight: 110, textAlignVertical: 'top', padding: space.s3,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface,
    fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.text,
  },
});
