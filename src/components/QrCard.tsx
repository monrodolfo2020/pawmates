import React from 'react';
import { View, Text, Image, StyleSheet, Linking, Platform } from 'react-native';
import { QrCode, Download } from 'lucide-react-native';
import Card from './Card';
import Button from './Button';
import { CardMeta, CardTitle } from './CardText';
import { micrositeQrUrl } from '../api/client';
import { colors, fonts, space } from '../theme/tokens';

/**
 * The business's QR code, ready to print.
 *
 * The image is the same PNG the approval email links to and attaches, so
 * what the business prints from here is identical to what it received.
 * Download goes through the browser rather than the app because what
 * people do with it next — print it, send it to whoever makes their
 * flyers — happens outside the app anyway.
 */
export default function QrCard({ slug }: { slug: string }) {
  const url = micrositeQrUrl(slug);

  const download = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // A plain link with `download` saves the file instead of opening it;
      // the server's own filename is used when the browser allows it.
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${slug}.png`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
    void Linking.openURL(url);
  };

  return (
    <Card>
      <View style={styles.row}>
        <QrCode size={18} strokeWidth={1.75} color={colors.textMuted} />
        <CardTitle style={{ flex: 1 }}>Tu código QR</CardTitle>
      </View>
      <CardMeta>
        Imprímelo en tu mostrador, tus tarjetas o tus volantes: quien lo escanee llega directo a tu
        página.
      </CardMeta>
      <View style={styles.qrFrame}>
        <Image source={{ uri: url }} style={styles.qr} resizeMode="contain" />
      </View>
      <Button
        variant="secondary"
        icon={<Download size={14} strokeWidth={1.5} color={colors.text} />}
        onPress={download}
      >
        Descargar para imprimir
      </Button>
      <Text style={styles.note}>Es de alta resolución: se ve nítido aunque lo imprimas grande.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  qrFrame: { alignItems: 'center', paddingVertical: space.s2 },
  qr: { width: 200, height: 200 },
  note: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, textAlign: 'center' },
});
