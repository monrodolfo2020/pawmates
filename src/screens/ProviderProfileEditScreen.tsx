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
import LocationPicker from '../components/LocationPicker';
import {
  CATEGORY_PROFILE_FIELDS,
  ProfileFieldId,
  showsField,
} from '../config/categoryFields';
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
  // Complete (the fields are filled in) and visible (also approved) are
  // different answers; only the backend's second one means "publicada".
  const [complete, setComplete] = useState(false);
  const [visible, setVisible] = useState(false);
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
  const [point, setPoint] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!s.token) return;
    api
      .getMyProviderProfile(s.token)
      .then((profile) => {
        if (profile) {
          setComplete(profile.isPublished);
          setVisible(profile.isPubliclyVisible);
          setExistingPhotoUrl(profile.photo);
          setCategory(profile.category);
          setBusinessName(profile.businessName ?? '');
          setPhotos(profile.photos);
          setPublicAddress(profile.publicAddress ?? '');
          setPoint(
            profile.latitude !== null && profile.longitude !== null
              ? { latitude: profile.latitude, longitude: profile.longitude }
              : null,
          );
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
      // A field this category doesn't ask for is sent empty rather than
      // left alone: a paseador who becomes a veterinaria must stop
      // publishing "Parque México" on their page, and '' is how the API
      // clears a field.
      const forCategory = (field: ProfileFieldId, value: string) =>
        showsField(category, field) ? value.trim() : '';
      const saved = await api.saveMyProviderProfile(s.token, {
        category,
        businessName: businessName.trim(),
        photos,
        publicAddress: forCategory('publicAddress', publicAddress),
        hours: forCategory('hours', hours),
        whatsapp: whatsapp.trim(),
        bio: bio.trim(),
        serviceArea: forCategory('serviceArea', serviceArea),
        specialty: forCategory('specialty', specialty),
        photo: photo?.base64 ?? undefined,
        priceAmount,
        priceCurrency: priceAmount !== undefined ? 'MXN' : undefined,
        plansOffered: forCategory('plansOffered', plansOffered),
        walkingSpots: forCategory('walkingSpots', walkingSpots),
        latitude: point?.latitude ?? null,
        longitude: point?.longitude ?? null,
        address: address.trim(),
        idNumber: idNumber.trim(),
        age: ageValue,
        phone: phone.trim(),
      });
      setComplete(saved.isPublished);
      setVisible(saved.isPubliclyVisible);
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
  const categoryConfig = CATEGORY_PROFILE_FIELDS[category];
  const field = (id: ProfileFieldId) => categoryConfig.fields[id];

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
          <Tag variant={visible ? 'accent' : 'outline'}>
            {visible
              ? 'Publicada — visible en el directorio'
              : complete
                ? 'Completa — esperando aprobación'
                : 'Aún no publicada'}
          </Tag>
        )}
        {!complete && loaded && (
          <CardBody>
            Completa el nombre de tu negocio y su descripción
            {isBookable(category) ? ', más tu precio por paseo,' : ''} para que tu página quede lista.
            Se publica en cuanto la aprobemos.
          </CardBody>
        )}
        {complete && !visible && loaded && (
          <CardBody>
            Tu página está lista. La estamos revisando y te avisaremos por correo, con tu enlace y tu
            código QR, en cuanto esté en línea.
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
          placeholder={categoryConfig.bioPlaceholder}
          multiline
          numberOfLines={4}
        />

        {/* Which of these appear, and what they're called, depends on the
            category — see config/categoryFields.ts. */}
        {field('serviceArea') && (
          <TextField
            label={field('serviceArea')!.label}
            value={serviceArea}
            onChangeText={setServiceArea}
            placeholder={field('serviceArea')!.placeholder}
          />
        )}
        {field('specialty') && (
          <TextField
            label={field('specialty')!.label}
            value={specialty}
            onChangeText={setSpecialty}
            placeholder={field('specialty')!.placeholder}
          />
        )}
        {isBookable(category) && (
          <TextField
            label="Precio por paseo (MXN)"
            value={priceMxn}
            onChangeText={setPriceMxn}
            placeholder="Ej. 250"
            keyboardType="numeric"
          />
        )}
        {field('plansOffered') && (
          <TextField
            label={field('plansOffered')!.label}
            value={plansOffered}
            onChangeText={setPlansOffered}
            placeholder={field('plansOffered')!.placeholder}
            multiline={field('plansOffered')!.multiline}
            numberOfLines={field('plansOffered')!.multiline ? 2 : 1}
          />
        )}
        {field('walkingSpots') && (
          <TextField
            label={field('walkingSpots')!.label}
            value={walkingSpots}
            onChangeText={setWalkingSpots}
            placeholder={field('walkingSpots')!.placeholder}
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
        {field('publicAddress') && (
          <TextField
            label={field('publicAddress')!.label}
            value={publicAddress}
            onChangeText={setPublicAddress}
            placeholder={field('publicAddress')!.placeholder}
          />
        )}
        {field('hours') && (
          <TextField
            label={field('hours')!.label}
            value={hours}
            onChangeText={setHours}
            placeholder={field('hours')!.placeholder}
          />
        )}
        <LocationPicker
          latitude={point?.latitude ?? null}
          longitude={point?.longitude ?? null}
          addressHint={publicAddress || serviceArea}
          onChange={setPoint}
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
          label="Dirección particular"
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
