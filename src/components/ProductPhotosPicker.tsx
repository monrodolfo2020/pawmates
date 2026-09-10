import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import PhotoPicker, { PhotoResult } from './PhotoPicker';
import { colors, fonts } from '../theme/tokens';

export const MIN_PRODUCT_PHOTOS = 3;
export const MAX_PRODUCT_PHOTOS = 6;

type Props = {
  photos: string[]; // base64 data URLs
  onChange: (photos: string[]) => void;
};

// One slot per existing photo (tap to replace, "Quitar" to drop) plus one
// empty "add" slot while under the max — mirrors the backend's Product
// gallery rule (3-6 photos, see product.entity.ts).
export default function ProductPhotosPicker({ photos, onChange }: Props) {
  const replaceAt = (index: number, result: PhotoResult) => {
    if (!result.base64) return;
    const next = [...photos];
    next[index] = result.base64;
    onChange(next);
  };

  const addNew = (result: PhotoResult) => {
    if (!result.base64) return;
    onChange([...photos, result.base64]);
  };

  const removeAt = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  const needsMore = photos.length < MIN_PRODUCT_PHOTOS;

  return (
    <View style={{ gap: 6 }}>
      <View style={styles.row}>
        {photos.map((uri, i) => (
          <View key={i} style={{ gap: 3 }}>
            <PhotoPicker uri={uri} onChange={(v) => replaceAt(i, v)} style={styles.slot} alertTitle="Foto del producto" />
            <Pressable onPress={() => removeAt(i)}>
              <Text style={styles.removeLink}>Quitar</Text>
            </Pressable>
          </View>
        ))}
        {photos.length < MAX_PRODUCT_PHOTOS && (
          <PhotoPicker uri={null} onChange={addNew} style={styles.slot} label="Agregar" alertTitle="Foto del producto" />
        )}
      </View>
      <Text style={[styles.hint, needsMore && styles.hintWarn]}>
        {photos.length}/{MAX_PRODUCT_PHOTOS} fotos
        {needsMore ? ` · se requieren al menos ${MIN_PRODUCT_PHOTOS}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { width: 64, height: 64 },
  removeLink: { fontFamily: fonts.body, fontSize: 10, color: colors.accent, textAlign: 'center' },
  hint: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted70 },
  hintWarn: { color: colors.accent },
});
