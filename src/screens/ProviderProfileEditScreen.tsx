import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import Button from '../components/Button';
import TextField from '../components/TextField';
import PhotoPicker, { PhotoResult } from '../components/PhotoPicker';
import GalleryPicker from '../components/GalleryPicker';
import Tag from '../components/Tag';
import { CardBody } from '../components/CardText';
import { colors, fonts, space } from '../theme/tokens';
import {
  api,
  CATEGORY_LABELS_SINGULAR,
  SERVICE_CATEGORIES,
  ServiceCategory,
  isBookable,
} from '../api/client';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'ProviderProfileEdit'>;

export default function ProviderProfileEditScreen({ navigation }: Props) {
  const s = useAppState();
  const [loaded, setLoaded] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [photo, setPhoto] = useState<PhotoResult | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<ServiceCategory>('walker');
  const [businessName, setBusinessName] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [publicAddress, setPublicAddress] = useState('');
  const [hours, setHours] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [bio, setBio] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [priceMxn, setPriceMxn] = useState('');
  const [plansOffered, setPlansOffered] = useState('');
  const [walkingSpots, setWalkingSpots] = useState('');
  const [address, setAddress] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
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
          setCategory(profile.category);
          setBusinessName(profile.businessName ?? '');
          setPhotos(profile.photos);
          setPublicAddress(profile.publicAddress ?? '');
          setHours(profile.hours ?? '');
          setWhatsapp(profile.whatsapp ?? '');
          setBio(profile.bio ?? '');
          setServiceArea(profile.serviceArea ?? '');
          setSpecialty(profile.specialty ?? '');
          setPriceMxn(profile.price ? String(profile.price.amount / 100) : '');
          setPlansOffered(profile.plansOffered ?? '');
          setWalkingSpots(profile.walkingSpots ?? '');
          setAddress(profile.address ?? '');
          setIdNumber(profile.idNumber ?? '');
          setAge(profile.age !== null ? String(profile.age) : '');
          setPhone(profile.phone ?? '');
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
      const ageValue = age.trim() ? Number(age) : undefined;
      const saved = await api.saveMyProviderProfile(s.token, {
        category,
        businessName: businessName.trim(),
        photos,
        publicAddress: publicAddress.trim(),
        hours: hours.trim(),
        whatsapp: whatsapp.trim(),
        bio: bio.trim(),
        serviceArea: serviceArea.trim(),
        specialty: specialty.trim(),
        photo: photo?.base64 ?? undefined,
        priceAmount,
        priceCurrency: priceAmount !== undefined ? 'MXN' : undefined,
        plansOffered: plansOffered.trim(),
        walkingSpots: walkingSpots.trim(),
        address: address.trim(),
        idNumber: idNumber.trim(),
        age: ageValue,
        phone: phone.trim(),
      });
      setIsPublished(saved.isPublished);
      if (saved.photo) setExistingPhotoUrl(saved.photo);
      // Comes back as hosted URLs — swapping the local base64 for them
      // keeps a second save from re-uploading the same images.
      setPhotos(saved.photos);
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
        <Text style={styles.title}>Editar mi página</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {loaded && (
          <Tag variant={isPublished ? 'accent' : 'outline'}>
            {isPublished ? 'Publicada — visible en el directorio' : 'Aún no publicada'}
          </Tag>
        )}
        {!isPublished && loaded && (
          <CardBody>
            Completa el nombre de tu negocio y su descripción
            {isBookable(category) ? ', más tu precio por paseo,' : ''} para que tu página se publique
            automáticamente.
          </CardBody>
        )}
        {error && <CardBody style={{ color: colors.accent }}>{error}</CardBody>}

        <View style={{ gap: 5 }}>
          <Text style={styles.fieldLabel}>Tipo de negocio</Text>
          <View style={styles.categoryRow}>
            {SERVICE_CATEGORIES.map((c) => (
              <Pressable key={c} onPress={() => setCategory(c)}>
                <Tag variant={category === c ? 'accent' : 'outline'}>{CATEGORY_LABELS_SINGULAR[c]}</Tag>
              </Pressable>
            ))}
          </View>
        </View>

        <TextField
          label="Nombre del negocio"
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="Ej. Veterinaria San Ángel"
        />

        <PhotoPicker
          uri={previewUri}
          onChange={setPhoto}
          style={styles.photo}
          label="Logo o foto"
          alertTitle="Logo o foto principal"
        />

        <TextField
          label="Descripción"
          value={bio}
          onChangeText={setBio}
          placeholder="Cuéntale a los dueños qué ofreces y por qué confiar en ti."
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
        {isBookable(category) && (
          <TextField
            label="Precio por paseo (MXN)"
            value={priceMxn}
            onChangeText={setPriceMxn}
            placeholder="Ej. 850"
            keyboardType="numeric"
          />
        )}
        <TextField
          label="Servicios que ofreces"
          value={plansOffered}
          onChangeText={setPlansOffered}
          placeholder="Ej. Consulta general, vacunas, baño y corte"
          multiline
          numberOfLines={2}
        />
        {isBookable(category) && (
          <TextField
            label="Parques o sitios donde paseas"
            value={walkingSpots}
            onChangeText={setWalkingSpots}
            placeholder="Ej. Parque México, Bosque de Chapultepec"
          />
        )}

        <View style={{ gap: 4, marginTop: space.s2 }}>
          <Text style={styles.sectionTitle}>Tu página para compartir</Text>
          <Text style={styles.sectionNote}>
            Esto es lo que ven quienes abren el enlace de tu negocio.
          </Text>
        </View>
        <View style={{ gap: 5 }}>
          <Text style={styles.fieldLabel}>Fotos del negocio</Text>
          <GalleryPicker photos={photos} onChange={setPhotos} />
        </View>
        <TextField
          label="Dirección del negocio (pública)"
          value={publicAddress}
          onChangeText={setPublicAddress}
          placeholder="Ej. Av. Revolución 1200, CDMX"
        />
        <TextField
          label="Horarios"
          value={hours}
          onChangeText={setHours}
          placeholder="Ej. Lun a Sáb de 9:00 a 19:00"
        />
        <TextField
          label="WhatsApp"
          value={whatsapp}
          onChangeText={setWhatsapp}
          placeholder="Ej. 5511223344"
          keyboardType="phone-pad"
        />

        <View style={{ gap: 4, marginTop: space.s2 }}>
          <Text style={styles.sectionTitle}>Verificación (privado)</Text>
          <Text style={styles.sectionNote}>
            Esta información no se muestra en tu página — solo la ven nuestro equipo de
            verificación y tú, para dar más confianza a los dueños.
          </Text>
        </View>
        <TextField
          label="Dirección"
          value={address}
          onChangeText={setAddress}
          placeholder="Tu dirección actual"
        />
        <TextField
          label="Número de identidad (INE, cédula, etc.)"
          value={idNumber}
          onChangeText={setIdNumber}
          placeholder="Ej. INE1234567890"
        />
        <TextField label="Edad" value={age} onChangeText={setAge} placeholder="Ej. 29" keyboardType="numeric" />
        <TextField
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          placeholder="Ej. 5511223344"
          keyboardType="phone-pad"
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
  sectionTitle: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  sectionNote: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted70 },
  fieldLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted70 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
