import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, StyleProp, ViewStyle, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Pencil } from 'lucide-react-native';
import { colors, fonts } from '../theme/tokens';
import CornerMarks from './CornerMarks';

type Props = {
  uri: string | null;
  onChange: (uri: string | null) => void;
  style?: StyleProp<ViewStyle>;
};

async function pickFromLibrary(onChange: (uri: string) => void) {
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
  });
  if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
}

async function pickFromCamera(onChange: (uri: string) => void) {
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
  });
  if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
}

// Mirrors the design's <image-slot> for "Foto" on Onboarding, but wired to
// a real picker: tap to choose from the gallery (or camera on native).
export default function PetPhotoPicker({ uri, onChange, style }: Props) {
  const handlePress = () => {
    if (Platform.OS === 'web') {
      pickFromLibrary(onChange);
      return;
    }
    Alert.alert('Foto de tu mascota', undefined, [
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
          <Text style={styles.label}>Foto</Text>
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
