import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Linking } from 'react-native';
import { MapPin, Search, X, Navigation } from 'lucide-react-native';
import { api, GeoSuggestion } from '../api/client';
import { colors, fonts, radius, space } from '../theme/tokens';

type Props = {
  latitude: number | null;
  longitude: number | null;
  /** Prefills the search with whatever address the business already
   * typed, so the usual case is one tap. */
  addressHint?: string;
  onChange: (point: { latitude: number; longitude: number } | null) => void;
};

/** A link into the viewer's own maps app, which is also how the public
 * page's "Cómo llegar" works. */
export const mapsUrlFor = (latitude: number, longitude: number) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

/**
 * Places the business on the map by searching for its address.
 *
 * Search runs on a button press rather than while typing: the geocoder
 * is OpenStreetMap's Nominatim, whose usage policy asks for at most one
 * request a second and rules out autocomplete. Pressing a button also
 * means the business only sends a query when it actually wants one.
 *
 * There's no rendered map here. Drawing one would mean a maps SDK that
 * behaves differently on web and on native, and the point of the
 * coordinate today is to make the page's "Cómo llegar" exact instead of
 * a text guess — for which confirming the matched address and opening it
 * in the viewer's own maps app is enough.
 */
export default function LocationPicker({
  latitude,
  longitude,
  addressHint,
  onChange,
}: Props) {
  const [query, setQuery] = useState(addressHint ?? '');
  const [results, setResults] = useState<GeoSuggestion[] | null>(null);
  const [chosenLabel, setChosenLabel] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const hasPoint = latitude !== null && longitude !== null;

  const search = async () => {
    const term = query.trim();
    if (term.length < 4) {
      setMessage('Escribe la dirección con un poco más de detalle.');
      return;
    }
    setSearching(true);
    setMessage(null);
    setResults(null);
    try {
      const { available, results: found } = await api.searchPlaces(term);
      if (!available) {
        setMessage(
          'El buscador de direcciones no respondió. Inténtalo en un momento; tu dirección escrita se guarda igual.',
        );
        return;
      }
      setResults(found);
      if (found.length === 0) {
        setMessage('No encontramos esa dirección. Prueba con la calle, el número y la ciudad.');
      }
    } catch {
      setMessage('No se pudo buscar la dirección.');
    } finally {
      setSearching(false);
    }
  };

  const choose = (suggestion: GeoSuggestion) => {
    onChange({ latitude: suggestion.latitude, longitude: suggestion.longitude });
    setChosenLabel(suggestion.label);
    setResults(null);
    setMessage(null);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Ubicación en el mapa</Text>
      <Text style={styles.note}>
        Opcional. Sirve para que el botón "Cómo llegar" de tu página lleve al punto exacto en vez de
        buscar tu dirección por texto.
      </Text>

      {hasPoint ? (
        <View style={styles.chosen}>
          <MapPin size={16} strokeWidth={2} color={colors.accent} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.chosenText} numberOfLines={2}>
              {chosenLabel ?? 'Ubicación guardada'}
            </Text>
            <Text style={styles.coords}>
              {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
            </Text>
          </View>
          <Pressable
            onPress={() => void Linking.openURL(mapsUrlFor(latitude!, longitude!))}
            hitSlop={8}
          >
            <Navigation size={16} strokeWidth={2} color={colors.accent} />
          </Pressable>
          <Pressable
            onPress={() => {
              onChange(null);
              setChosenLabel(null);
            }}
            hitSlop={8}
          >
            <X size={16} strokeWidth={2} color={colors.textMuted70} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Calle, número, colonia y ciudad"
          placeholderTextColor={colors.textMuted50}
          style={styles.input}
          onSubmitEditing={() => void search()}
          returnKeyType="search"
        />
        <Pressable style={styles.searchBtn} onPress={() => void search()} disabled={searching}>
          <Search size={15} strokeWidth={2} color={colors.bg} />
          <Text style={styles.searchBtnText}>{searching ? '…' : 'Buscar'}</Text>
        </Pressable>
      </View>

      {results !== null && results.length > 0 && (
        <View style={styles.results}>
          {results.map((r, i) => (
            <Pressable key={`${r.latitude}-${r.longitude}-${i}`} style={styles.result} onPress={() => choose(r)}>
              <MapPin size={14} strokeWidth={1.5} color={colors.textMuted70} />
              <Text style={styles.resultText} numberOfLines={2}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.s2 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text },
  note: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted70, lineHeight: 16 },

  chosen: {
    flexDirection: 'row', alignItems: 'center', gap: space.s2,
    padding: space.s3, borderRadius: radius.md,
    backgroundColor: colors.accent100, borderWidth: 1.5, borderColor: colors.accent200,
  },
  chosenText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text },
  coords: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted70 },

  searchRow: { flexDirection: 'row', gap: space.s2, alignItems: 'center' },
  input: {
    flex: 1,
    paddingHorizontal: space.s3, paddingVertical: 10,
    borderWidth: 1.5, borderColor: colors.divider, borderRadius: radius.sm,
    fontFamily: fonts.body, fontSize: 13.5, color: colors.text,
  },
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: space.s3, paddingVertical: 11,
    borderRadius: radius.sm, backgroundColor: colors.accent,
  },
  searchBtnText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.bg },

  results: { gap: 2, borderWidth: 1.5, borderColor: colors.divider, borderRadius: radius.sm },
  result: { flexDirection: 'row', alignItems: 'center', gap: space.s2, padding: space.s3 },
  resultText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, color: colors.text },

  message: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted70, lineHeight: 17 },
});
