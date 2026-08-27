import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, StyleProp, ViewStyle, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Pencil } from 'lucide-react-native';
import { colors, fonts } from '../theme/tokens';
import CornerMarks from './CornerMarks';

export type PhotoResult = { uri: string; base64: string | null };

type Props = {
  uri: string | null;
  onChange: (result: PhotoResult) => void;
  style?: StyleProp<ViewStyle>;
  label?: string;
  alertTitle?: string;
};

function toResult(asset: ImagePicker.ImagePickerAsset): PhotoResult {
  return {
    uri: asset.uri,
    base64: asset.base64 ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` : null,
  };
}

async function pickFromLibrary(onChange: (result: PhotoResult) => void) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permiso necesario', 'Activa el acceso a tus fotos para elegir una imagen.');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: true,
  });
  if (!result.canceled && result.assets[0]) onChange(toResult(result.assets[0]));
}

async function pickFromCamera(onChange: (result: PhotoResult) => void) {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permiso necesario', 'Activa el acceso a la cámara para tomar una foto.');
    return;
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: true,
  });
  if (!result.canceled && result.assets[0]) onChange(toResult(result.assets[0]));
}

// Mirrors the design's <image-slot> (e.g. "Foto" on Onboarding, the owner/
// walker avatar), but wired to a real picker: tap to choose from the
// gallery (or camera on native).
export default function PhotoPicker({
  uri, onChange, style, label = 'Foto', alertTitle = 'Elegir foto',
}: Props) {
  const handlePress = () => {
    if (Platform.OS === 'web') {
      pickFromLibrary(onChange);
      return;
    }
    Alert.alert(alertTitle, undefined, [
      { text: 'Tomar foto', onPress: () => pickFromCamera(onChange) },
      { text: 'Elegir de galería', onPress: () => pickFromLibrary(onChange) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <Pressable onPress={handlePress} style={[styles.box, style]}>
      <CornerMarks />
      {uri ? (
        <>
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
          <View style={styles.editBadge}>
            <Pencil size={11} strokeWidth={1.5} color={colors.bg} />
          </View>
        </>
      ) : (
        <>
          <Camera size={22} strokeWidth={1.5} color={colors.text} style={{ opacity: 0.45 }} />
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'rgba(89, 128, 166, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  label: { fontFamily: fonts.body, fontSize: 11, color: colors.text, opacity: 0.6 },
  editBadge: {
    position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.accent700, alignItems: 'center', justifyContent: 'center',
  },
});
