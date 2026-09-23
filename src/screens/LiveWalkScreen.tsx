import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Platform } from 'react-native';
import { ChevronLeft, MessageCircle, Camera } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Polyline, Circle } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button, { IconButton } from '../components/Button';
import Card from '../components/Card';
import { CardMeta, CardBody } from '../components/CardText';
import Tag from '../components/Tag';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import { api, BookingSummary, TripDetail, TripPoint } from '../api/client';
import { mapboxRouteImageUrl } from '../utils/mapboxStaticUrl';
import { resizeImagePhoto } from '../utils/resizeImagePhoto';
import { formatWhen } from '../utils/bookingSlots';

type Props = NativeStackScreenProps<RootStackParamList, 'Live'>;

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Por iniciar',
  in_progress: '● En vivo',
  completed: '✓ Terminado',
  cancelled: 'Cancelado',
};

const EVENT_LABEL: Record<string, string> = {
  photo: 'Foto del paseo',
  pee: 'Pipí',
  poop: 'Popó',
};

const POLL_MS = 5000;
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

/**
 * One booking's walk, seen from whichever side you're on.
 *
 * The business runs it from their own phone: they start it, their GPS
 * draws the route, they log photos and pee/poop, and they finish it.
 * The owner only watches — the screen polls the same trip data and
 * shows the route and log as they come in, then the summary.
 *
 * Nothing here lives in global state: the booking id comes from the
 * route, so a business with several walks today opens each on its own.
 */
export default function LiveWalkScreen({ navigation, route }: Props) {
  const s = useAppState();
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'start' | 'finish' | 'pee' | 'poop' | 'photo' | null>(null);
  const [gpsState, setGpsState] = useState<'off' | 'requesting' | 'active' | 'denied'>('off');

  const isWalker = booking !== null && booking.providerId === s.accountId;
  const status = trip?.status ?? booking?.status ?? null;
  const live = status === 'in_progress';
  const finished = status === 'completed';
  const petLabel = booking?.lines.map((l) => l.petName?.split(' · ')[0]).filter(Boolean).join(', ') || 'la mascota';

  const refresh = useCallback(async () => {
    if (!s.token) return;
    try {
      setTrip(await api.getTrip(s.token, bookingId));
    } catch {
      // Polled — the next tick tries again.
    }
  }, [s.token, bookingId]);

  // Who's who, once.
  useEffect(() => {
    if (!s.token) return;
    api
      .getBooking(s.token, bookingId)
      .then((b) => {
        setBooking(b);
        if (b.providerId !== s.accountId) {
          api
            .getProvider(s.token, b.providerId)
            .then((p) => setBusinessName(p.name))
            .catch(() => undefined);
        }
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'No se pudo abrir este paseo.'));
    void refresh();
  }, [s.token, s.accountId, bookingId, refresh]);

  // Both sides keep polling until the walk is over: the owner to see it
  // start and move, the business to see its own log land.
  useEffect(() => {
    if (finished || status === 'cancelled') return;
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [finished, status, refresh]);

  // The business's phone is the one on the walk, so only it reports GPS.
  useEffect(() => {
    if (!isWalker || !live || !s.token) return;
    const token = s.token;
    let cancelled = false;
    let watch: Location.LocationSubscription | null = null;
    const report = (lat: number, lng: number) =>
      api.logTripLocation(token, bookingId, lat, lng).catch(() => undefined);

    (async () => {
      setGpsState('requesting');
      const perm = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (!perm.granted) {
        setGpsState('denied');
        return;
      }
      setGpsState('active');
      try {
        const now = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) void report(now.coords.latitude, now.coords.longitude);
      } catch {
        // The watch below is the real ongoing source.
      }
      if (cancelled) return;
      watch = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
        (loc) => void report(loc.coords.latitude, loc.coords.longitude),
      );
      if (cancelled) watch.remove();
    })();

    return () => {
      cancelled = true;
      watch?.remove();
    };
  }, [isWalker, live, s.token, bookingId]);

  const act = async (kind: NonNullable<typeof busy>, run: (token: string) => Promise<unknown>) => {
    if (!s.token) return;
    setBusy(kind);
    setActionError(null);
    try {
      await run(s.token);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo completar. Inténtalo de nuevo.');
    } finally {
      setBusy(null);
    }
  };

  const takePhoto = async () => {
    const perm =
      Platform.OS === 'web'
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setActionError('Activa el acceso a la cámara para tomar una foto.');
      return;
    }
    const result =
      Platform.OS === 'web'
        ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 })
        : await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (result.canceled || !result.assets[0]) return;
    const photo = await resizeImagePhoto(result.assets[0]);
    if (!photo.base64) return;
    await act('photo', (t) => api.logWalkEvent(t, bookingId, { type: 'photo', photoBase64: photo.base64! }));
  };

  const routePoints = trip?.route ?? [];
  const points = projectRoute(routePoints);
  const events = trip?.events ?? [];
  const mapImageUrl = mapboxRouteImageUrl(routePoints, 600, 420);
  const other = isWalker ? booking?.ownerName ?? 'el dueño' : businessName ?? 'el negocio';

  const mapEmptyText = (() => {
    if (status === 'confirmed') return 'La ruta aparecerá cuando empiece el paseo';
    if (!live) return 'Sin datos de ruta';
    if (!isWalker) return 'Esperando la ubicación del paseo…';
    if (gpsState === 'denied') return 'Sin acceso a tu ubicación';
    return 'Buscando tu ubicación…';
  })();

  if (loadError) {
    return (
      <ScreenContainer>
        <Header onBack={() => navigation.goBack()} title="Paseo" />
        <View style={styles.pad}>
          <CardMeta style={{ color: colors.accent }}>{loadError}</CardMeta>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header onBack={() => navigation.goBack()} title={`Paseo de ${petLabel}`} tag={status ? STATUS_LABEL[status] : undefined} />

      {!booking && <CardMeta style={styles.pad}>Cargando…</CardMeta>}

      {booking && (
        <ScrollView contentContainerStyle={styles.scroll}>
          {status === 'confirmed' && (
            <Card>
              <CardBody>
                {isWalker
                  ? `Programado para el ${formatWhen(booking.scheduledAt)}. Cuando llegues por ${petLabel}, toca "Iniciar paseo": ${other} verá la ruta en vivo.`
                  : `${other} todavía no inicia el paseo (programado para el ${formatWhen(booking.scheduledAt)}). Esta pantalla se actualiza sola.`}
              </CardBody>
            </Card>
          )}

          {isWalker && live && gpsState === 'denied' && (
            <CardMeta style={{ color: colors.accent }}>
              Sin permiso de ubicación no se dibuja la ruta. Puedes seguir registrando fotos y
              necesidades; actívalo en tu navegador o teléfono para que {other} vea el recorrido.
            </CardMeta>
          )}

          <View style={styles.map}>
            {mapImageUrl ? (
              <Image source={{ uri: mapImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : points.length >= 1 ? (
              <Svg width="100%" height="100%" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} style={StyleSheet.absoluteFill}>
                {points.length >= 2 && (
                  <Polyline
                    points={points.map((p) => `${p.x},${p.y}`).join(' ')}
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
              <Text style={styles.mapEmpty}>{mapEmptyText}</Text>
            )}
          </View>

          {(live || finished) && trip && (
            <View style={styles.stats}>
              <Stat label="Distancia" value={`${(trip.distanceMeters / 1000).toFixed(2)} km`} />
              <Stat label="Tiempo" value={formatDuration(trip.durationSeconds)} />
              <Stat label="Pipí" value={String(trip.peeCount)} />
              <Stat label="Popó" value={String(trip.poopCount)} />
            </View>
          )}

          {isWalker && live && (
            <View style={styles.row}>
              <Button
                variant="secondary"
                style={{ flex: 1 }}
                disabled={busy !== null}
                onPress={() => void takePhoto()}
                icon={<Camera size={14} strokeWidth={1.5} color={colors.text} />}
              >
                {busy === 'photo' ? 'Subiendo…' : 'Foto'}
              </Button>
              <Button
                variant="secondary"
                style={{ flex: 1 }}
                disabled={busy !== null}
                onPress={() => void act('pee', (t) => api.logWalkEvent(t, bookingId, { type: 'pee' }))}
              >
                💧 Pipí
              </Button>
              <Button
                variant="secondary"
                style={{ flex: 1 }}
                disabled={busy !== null}
                onPress={() => void act('poop', (t) => api.logWalkEvent(t, bookingId, { type: 'poop' }))}
              >
                💩 Popó
              </Button>
            </View>
          )}

          <Button
            variant="secondary"
            blueprint
            icon={<MessageCircle size={14} strokeWidth={1.5} color={colors.text} />}
            onPress={() => navigation.navigate('Chat', { bookingId })}
          >
            {`Mensaje a ${other}`}
          </Button>

          {actionError && <CardMeta style={{ color: colors.accent }}>{actionError}</CardMeta>}

          <Text style={styles.h5}>{finished ? 'Resumen del paseo' : 'Bitácora'}</Text>
          {events.length === 0 && (
            <CardMeta>
              {isWalker && live
                ? 'Usa los botones de arriba para registrar el paseo.'
                : 'Todavía no hay registros.'}
            </CardMeta>
          )}
          {[...events].reverse().map((entry) => (
            <Card key={entry.id} row={entry.type === 'photo'}>
              {entry.type === 'photo' && entry.photoBase64 && (
                <Image source={{ uri: entry.photoBase64 }} style={styles.logPhoto} />
              )}
              <View style={{ flex: 1 }}>
                <CardMeta>
                  {new Date(entry.recordedAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </CardMeta>
                <CardBody>{EVENT_LABEL[entry.type] ?? entry.type}</CardBody>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {booking && isWalker && (status === 'confirmed' || live) && (
        <View style={styles.footer}>
          {status === 'confirmed' ? (
            <Button
              variant="primary"
              block
              blueprint
              disabled={busy !== null}
              onPress={() => void act('start', (t) => api.startTrip(t, bookingId))}
            >
              {busy === 'start' ? 'Iniciando…' : 'Iniciar paseo'}
            </Button>
          ) : (
            <Button
              variant="primary"
              block
              blueprint
              disabled={busy !== null}
              onPress={() => void act('finish', (t) => api.completeTrip(t, bookingId))}
            >
              {busy === 'finish' ? 'Terminando…' : 'Terminar paseo'}
            </Button>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}

function Header({ onBack, title, tag }: { onBack: () => void; title: string; tag?: string }) {
  return (
    <View style={styles.header}>
      <IconButton onPress={onBack}>
        <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
      </IconButton>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {tag && <Tag variant="accent">{tag}</Tag>}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
  },
  title: { flex: 1, fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  pad: { paddingHorizontal: space.s4 },
  scroll: { paddingHorizontal: space.s4, gap: space.s3, paddingBottom: space.s4 },
  map: {
    height: 210,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  mapEmpty: { fontFamily: fonts.body, fontSize: 12, color: colors.text, opacity: 0.5, textAlign: 'center', paddingHorizontal: space.s4 },
  stats: { flexDirection: 'row', gap: space.s2 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: space.s2, borderWidth: 1, borderColor: colors.divider },
  statValue: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  statLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted70 },
  row: { flexDirection: 'row', gap: space.s2 },
  h5: { fontFamily: fonts.heading, fontSize: 16, color: colors.text, marginTop: space.s2 },
  logPhoto: { width: 48, height: 48, marginRight: space.s3 },
  footer: { padding: space.s4 },
});
