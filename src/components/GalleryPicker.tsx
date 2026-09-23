import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import PhotoPicker from './PhotoPicker';
import { colors, fonts, radius, space } from '../theme/tokens';

type Props = {
  /** Mix of already-hosted URLs (saved before) and base64 data URLs
   * (added in this session) — the backend uploads whichever are new and
   * keeps the rest, so the caller can treat them the same. */
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
};

// The micro-page's photo gallery: a strip of thumbnails with a remove
// badge each, plus one empty slot that opens the same picker every other
// photo field in the app uses.
export default function GalleryPicker({ photos, onChange, max = 8 }: Props) {
  return (
    <View style={styles.row}>
      {photos.map((uri, i) => (
        <View key={`${uri}-${i}`} style={styles.thumbWrap}>
          <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
          <Pressable
            style={styles.removeBadge}
            onPress={() => onChange(photos.filter((_, idx) => idx !== i))}
            hitSlop={6}
          >
            <X size={12} strokeWidth={2.5} color={colors.onAccent} />
          </Pressable>
        </View>
      ))}
      {photos.length < max && (
        <PhotoPicker
          uri={null}
          label="Agregar"
          alertTitle="Foto del negocio"
          style={styles.thumb}
          onChange={(result) => {
            if (result.base64) onChange([...photos, result.base64]);
          }}
        />
      )}
      {photos.length >= max && <Text style={styles.maxNote}>Máximo {max} fotos.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2, alignItems: 'center' },
  thumbWrap: { position: 'relative' },
  thumb: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.panel },
  removeBadge: {
    position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center',
  },
  maxNote: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
});
