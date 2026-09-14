import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import TextField from '../components/TextField';
import PhotoPicker, { PhotoResult } from '../components/PhotoPicker';
import Tag from '../components/Tag';
import { CardBody } from '../components/CardText';
import { colors, fonts, space } from '../theme/tokens';
import { api } from '../api/client';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'ProviderProfileEdit'>;

export default function ProviderProfileEditScreen({ navigation }: Props) {
  const s = useAppState();
  const [loaded, setLoaded] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [photo, setPhoto] = useState<PhotoResult | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [priceMxn, setPriceMxn] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!s.token) return;
    api
      .getMyProviderProfile(s.token)
      .then((profile) => {
        if (profile) {
          setIsPublished(profile.isPublished);
          setExistingPhotoUrl(profile.photo);
          setBio(profile.bio ?? '');
          setServiceArea(profile.serviceArea ?? '');
          setSpecialty(profile.specialty ?? '');
          setPriceMxn(profile.price ? String(profile.price.amount / 100) : '');
        }
        setLoaded(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'No se pudo cargar tu página.');
        setLoaded(true);
      });
  }, [s.token]);

  const handleSave = async () => {
    if (!s.token) return;
    setError(null);
    setSaving(true);
    try {
      const priceAmount = priceMxn.trim() ? Math.round(Number(priceMxn) * 100) : undefined;
      const saved = await api.saveMyProviderProfile(s.token, {
        bio: bio.trim(),
        serviceArea: serviceArea.trim(),
        specialty: specialty.trim(),
        photo: photo?.base64 ?? undefined,
        priceAmount,
        priceCurrency: priceAmount !== undefined ? 'MXN' : undefined,
      });
      setIsPublished(saved.isPublished);
      if (saved.photo) setExistingPhotoUrl(saved.photo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar tu página.');
    } finally {
      setSaving(false);
    }
  };

  const previewUri = photo?.uri ?? existingPhotoUrl;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>Mi página pública</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {loaded && (
          <Tag variant={isPublished ? 'accent' : 'outline'}>
            {isPublished ? 'Publicada — visible para dueños' : 'Aún no publicada'}
          </Tag>
        )}
        {!isPublished && loaded && (
          <CardBody>
            Completa al menos tu biografía y tu precio por paseo para que tu página se publique
            automáticamente.
          </CardBody>
        )}
        {error && <CardBody style={{ color: colors.accent }}>{error}</CardBody>}

        <PhotoPicker
          uri={previewUri}
          onChange={setPhoto}
          style={styles.photo}
          label="Foto de perfil"
          alertTitle="Foto de perfil"
        />

        <TextField
          label="Biografía"
          value={bio}
          onChangeText={setBio}
          placeholder="Cuéntale a los dueños sobre ti y tu experiencia paseando perros."
          multiline
          numberOfLines={4}
        />
        <TextField
          label="Zona de servicio"
          value={serviceArea}
          onChangeText={setServiceArea}
          placeholder="Ej. Roma Norte, CDMX"
        />
        <TextField
          label="Especialidad"
          value={specialty}
          onChangeText={setSpecialty}
          placeholder="Ej. Perros grandes y energéticos"
        />
        <TextField
          label="Precio por paseo (MXN)"
          value={priceMxn}
          onChangeText={setPriceMxn}
          placeholder="Ej. 850"
          keyboardType="numeric"
        />

        <Button variant="primary" block blueprint onPress={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', gap: space.s2,
  },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  body: { paddingHorizontal: space.s4, paddingBottom: space.s4, gap: space.s3 },
  photo: { width: 88, height: 88 },
});
