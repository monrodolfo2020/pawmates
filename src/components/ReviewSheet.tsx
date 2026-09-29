import React, { useEffect, useState } from 'react';
import { Text, TextInput, StyleSheet, View } from 'react-native';
import Sheet from './Sheet';
import Button from './Button';
import Notice from './Notice';
import Field from './Field';
import { BonePicker, RATING_WORDS } from './Bones';
import { api, MAX_REVIEW_LENGTH, type OwnReview } from '../api/client';
import { colors, fonts, radius, space, type } from '../theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  token: string;
  providerId: string;
  businessName: string;
  /** The booking being reviewed, for a business booked in the app. */
  bookingId?: string;
  /** The review already written, to edit it. */
  existing?: OwnReview | null;
  onSaved: (review: OwnReview) => void;
};

/** Rate a business in huesitos and, if you like, say why. */
export default function ReviewSheet({
  visible, onClose, token, providerId, businessName, bookingId, existing, onSaved,
}: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setRating(existing?.rating ?? 0);
    setComment(existing?.comment ?? '');
    setError(null);
  }, [visible, existing]);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const saved = await api.writeReview(token, providerId, {
        rating,
        comment: comment.trim() || undefined,
        bookingId,
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar tu reseña.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      title={existing ? 'Tu reseña' : 'Califica el servicio'}
      onClose={onClose}
      footer={
        <Button variant="primary" block disabled={busy || rating === 0} onPress={() => void save()}>
          {busy ? 'Guardando…' : existing ? 'Guardar cambios' : 'Publicar reseña'}
        </Button>
      }
    >
      <Text style={type.body}>¿Cómo te fue con {businessName}?</Text>
      <View style={{ gap: space.s2 }}>
        <BonePicker value={rating} onChange={setRating} />
        <Text style={styles.word}>{rating > 0 ? RATING_WORDS[rating] : 'Toca los huesitos para calificar'}</Text>
      </View>
      <Field label="Cuéntanos más (opcional)">
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="¿Qué te gustó? ¿Qué podría mejorar?"
          placeholderTextColor={colors.textFaint}
          multiline
          maxLength={MAX_REVIEW_LENGTH}
          style={styles.input}
          accessibilityLabel="Tu reseña"
        />
      </Field>
      <Text style={type.meta}>
        Tu reseña se publica en la página del negocio con tu nombre y la inicial de tu apellido.
      </Text>
      {error && <Notice tone="danger">{error}</Notice>}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  word: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textMuted },
  input: {
    minHeight: 110, textAlignVertical: 'top', padding: space.s3,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface,
    fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.text,
  },
});
