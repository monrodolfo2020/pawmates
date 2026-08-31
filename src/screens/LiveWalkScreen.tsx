import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Alert, Platform } from 'react-native';
import { MessageCircle, Phone, Camera } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Polyline, Circle } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import Card from '../components/Card';
import { CardMeta, CardBody } from '../components/CardText';
import Tag from '../components/Tag';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import type { TripPoint } from '../api/client';
import { mapboxRouteImageUrl } from '../utils/mapboxStaticUrl';

type Props = NativeStackScreenProps<RootStackParamList, 'Live'>;

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Iniciando…',
  starting: 'Iniciando…',
  in_progress: '● En vivo',
  completing: 'Terminando…',
  completed: '✓ Paseo terminado',
  error: 'Error de conexión',
};

const EVENT_LABEL: Record<string, string> = {
  photo: 'Foto del paseo',
  pee: 'Pipí registrado',
  poop: 'Popó registrado',
};

const MAP_WIDTH = 300;
const MAP_HEIGHT = 210;
const MAP_PADDING = 24;

function projectRoute(route: TripPoint[]): { x: number; y: number }[] {
  if (route.length === 0) return [];
  const lats = route.map((p) => p.lat);
  const lngs = route.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.0005;
  const lngRange = maxLng - minLng || 0.0005;
  return route.map((p) => ({
    x: MAP_PADDING + ((p.lng - minLng) / lngRange) * (MAP_WIDTH - MAP_PADDING * 2),
    // Latitude grows north = up on screen = smaller y, so invert.
    y: MAP_PADDING + (1 - (p.lat - minLat) / latRange) * (MAP_HEIGHT - MAP_PADDING * 2),
  }));
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LiveWalkScreen({ navigation }: Props) {
  const s = useAppState();
  const startedRef = useRef(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loggingType, setLoggingType] = useState<'pee' | 'poop' | 'photo' | null>(null);
  const [gpsState, setGpsState] = useState<'requesting' | 'active' | 'denied'>('requesting');

  useEffect(() => {
    // StrictMode/fast-refresh can mount this screen more than once — only
    // ever start the real trip the first time this screen is reached.
    if (startedRef.current) return;
    startedRef.current = true;
    void s.startTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once the trip is actually in progress: start posting real GPS pings
  // and polling the live report-card data. Both stop the moment the walk
  // is no longer in_progress (completed, or this screen unmounts).
  useEffect(() => {
    if (s.bookingStatus !== 'in_progress') return;

    let cancelled = false;

    (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (!perm.granted) {
        setGpsState('denied');
        Alert.alert(
          'Permiso de ubicación',
          'Sin acceso a tu ubicación no se puede mostrar la ruta del paseo en el mapa, pero puedes seguir usando los botones de foto y registro.',
        );
        return;
      }
      // watchPositionAsync's own first callback can take a while to fire
      // (varies a lot by platform/browser) — get an immediate fix too so
      // the map has something to show right away instead of sitting on
      // "buscando ubicación" for no visible reason.
      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) void s.logTripLocation(current.coords.latitude, current.coords.longitude);
      } catch {
        // Ignored — watchPositionAsync below is the real ongoing source.
      }
      if (cancelled) return;
      setGpsState('active');
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
        (loc) => {
          void s.logTripLocation(loc.coords.latitude, loc.coords.longitude);
        },
      );
    })();

    pollRef.current = setInterval(() => {
      void s.refreshTrip();
    }, 5000);
    void s.refreshTrip();

    return () => {
      cancelled = true;
      watchRef.current?.remove();
      watchRef.current = null;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.bookingStatus]);

  const finished = s.bookingStatus === 'completed';

  const handleComplete = async () => {
    await s.completeTrip();
    await s.refreshTrip();
  };

  const handleLog = async (type: 'pee' | 'poop') => {
    setLoggingType(type);
    try {
      await s.logWalkEvent({ type });
    } catch {
      Alert.alert('No se pudo registrar', 'Inténtalo de nuevo.');
    } finally {
      setLoggingType(null);
    }
  };

  const handlePhoto = async () => {
    const perm =
      Platform.OS === 'web'
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso necesario', 'Activa el acceso a la cámara para tomar una foto.');
      return;
    }
    const result =
      Platform.OS === 'web'
        ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, base64: true })
        : await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6, base64: true });
    if (result.canceled || !result.assets[0]?.base64) return;
    const asset = result.assets[0];
    setLoggingType('photo');
    try {
      await s.logWalkEvent({
        type: 'photo',
        photoBase64: `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`,
      });
    } catch {
      Alert.alert('No se pudo subir la foto', 'Inténtalo de nuevo.');
    } finally {
      setLoggingType(null);
    }
  };

  const route = s.tripDetail?.route ?? [];
  const points = projectRoute(route);
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const events = s.tripDetail?.events ?? [];
  const mapImageUrl = mapboxRouteImageUrl(route, 600, 420);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Tag variant="accent">{STATUS_LABEL[s.bookingStatus] ?? '● En vivo'}</Tag>
        {finished && s.tripDetail && (
          <Text style={styles.kicker}>
            {(s.tripDetail.distanceMeters / 1000).toFixed(2)} km · {formatDuration(s.tripDetail.durationSeconds)}
          </Text>
        )}
      </View>

      <View style={styles.map}>
        {mapImageUrl ? (
          <Image source={{ uri: mapImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : points.length >= 1 ? (
          <Svg width="100%" height="100%" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} style={StyleSheet.absoluteFill}>
            {points.length >= 2 && (
              <Polyline
                points={polylinePoints}
                stroke={colors.accent}
                strokeWidth={2}
                fill="none"
                strokeDasharray="5 4"
              />
            )}
            <Circle cx={points[0].x} cy={points[0].y} r={5} fill={colors.text} />
            <Circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r={7}
              fill={colors.accent}
              stroke={colors.accent200}
              strokeWidth={4}
            />
          </Svg>
        ) : (
          <Text style={styles.mapEmpty}>
            {gpsState === 'denied'
              ? 'Sin acceso a tu ubicación'
              : s.bookingStatus === 'in_progress'
                ? 'Buscando ubicación…'
                : 'Sin datos de ruta'}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <Button variant="secondary" blueprint style={{ flex: 1 }} icon={<MessageCircle size={14} strokeWidth={1.5} color={colors.text} />}>
          Mensaje
        </Button>
        <Button variant="secondary" blueprint style={{ flex: 1 }} icon={<Phone size={14} strokeWidth={1.5} color={colors.text} />}>
          Llamar
        </Button>
      </View>

      {!finished && (
        <View style={styles.logActions}>
          <Button
            variant="secondary"
            style={{ flex: 1 }}
            disabled={loggingType !== null}
            onPress={handlePhoto}
            icon={<Camera size={14} strokeWidth={1.5} color={colors.text} />}
          >
            Foto
          </Button>
          <Button variant="secondary" style={{ flex: 1 }} disabled={loggingType !== null} onPress={() => void handleLog('pee')}>
            💧 Pipí
          </Button>
          <Button variant="secondary" style={{ flex: 1 }} disabled={loggingType !== null} onPress={() => void handleLog('poop')}>
            💩 Popó
          </Button>
        </View>
      )}

      {s.bookingStatus === 'error' && s.bookingError && (
        <View style={{ paddingHorizontal: space.s4, paddingTop: space.s2 }}>
          <Card>
            <CardBody style={{ color: colors.accent }}>{s.bookingError}</CardBody>
          </Card>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h5}>Bitácora del paseo</Text>
        {events.length === 0 && (
          <CardMeta>Todavía no hay registros — usa los botones de arriba durante el paseo.</CardMeta>
        )}
        {[...events].reverse().map((entry) => (
          <Card key={entry.id} row={entry.type === 'photo'}>
            {entry.type === 'photo' && entry.photoBase64 && (
              <Image source={{ uri: entry.photoBase64 }} style={styles.logPhoto} />
            )}
            <View style={{ flex: 1 }}>
              <CardMeta>{new Date(entry.recordedAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</CardMeta>
              <CardBody>{EVENT_LABEL[entry.type] ?? entry.type}</CardBody>
            </View>
          </Card>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {finished ? (
          <Button
            variant="primary"
            block
            blueprint
            onPress={() => navigation.navigate('Home')}
          >
            Volver al inicio
          </Button>
        ) : (
          <Button
            variant="primary"
            block
            blueprint
            disabled={s.bookingStatus === 'completing'}
            onPress={() => void handleComplete()}
          >
            Finalizar paseo
          </Button>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s4, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  kicker: { fontFamily: fonts.body, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.accent },
  map: {
    marginHorizontal: space.s4, marginBottom: space.s3, height: 210,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider,
    alignItems: 'center', justifyContent: 'center',
  },
  mapEmpty: { fontFamily: fonts.body, fontSize: 12, color: colors.text, opacity: 0.5 },
  actions: { flexDirection: 'row', gap: space.s2, paddingHorizontal: space.s4 },
  logActions: { flexDirection: 'row', gap: space.s2, paddingHorizontal: space.s4, paddingTop: space.s2 },
  scroll: { padding: space.s4, gap: space.s2 },
  h5: { fontFamily: fonts.heading, fontSize: 16, color: colors.text, marginBottom: 4 },
  logPhoto: { width: 48, height: 48, marginRight: space.s3 },
  footer: { padding: space.s4 },
});
