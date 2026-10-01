import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { Check, Download, Link2, Mail, MessageCircle, Send, Share2, ThumbsUp } from 'lucide-react-native';
import Sheet from './Sheet';
import { colors, fonts, radius, space } from '../theme/tokens';
import type { HowToVideo } from '../config/howToVideos';
import { videoShareUrl } from '../navigation/sharedVideo';

type Props = { video: HowToVideo; visible: boolean; onClose: () => void };

/** The networks that take a link straight from a URL. Instagram and
 * TikTok don't, which is what "Descargar el video" is for. */
function networkLinks(text: string, url: string) {
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(url);
  return [
    { label: 'WhatsApp', icon: MessageCircle, href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
    { label: 'Facebook', icon: ThumbsUp, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: 'X (Twitter)', icon: Send, href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { label: 'Correo', icon: Mail, href: `mailto:?subject=${t}&body=${encodeURIComponent(`${text}\n${url}`)}` },
  ];
}

/** Share a "Cómo funciona" video: its own link to the usual networks, the
 * phone's share menu where there is one, or the file itself. */
export default function ShareVideoSheet({ video, visible, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const url = videoShareUrl(video.id);
  const text = `Mira cómo funciona PET Conect@: «${video.title}»`;
  const canShareNatively =
    Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const open = (href: string) => {
    if (Platform.OS === 'web') window.open(href, '_blank', 'noopener');
    else void Linking.openURL(href);
  };

  const shareNatively = async () => {
    try {
      await navigator.share({ title: video.title, text, url });
      onClose();
    } catch {
      // Cancelled, or the browser refused — the options below still work.
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied — the link is shown below anyway.
    }
  };

  const download = () => {
    const uri = Asset.fromModule(video.source).uri;
    if (Platform.OS !== 'web') return void Linking.openURL(uri);
    const a = document.createElement('a');
    a.href = uri;
    a.download = `PET-Conecta-${video.id}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Sheet visible={visible} title="Compartir video" onClose={onClose}>
      <View style={styles.list}>
        {canShareNatively && (
          <Row icon={Share2} label="Compartir…" onPress={() => void shareNatively()} />
        )}
        {networkLinks(text, url).map((n) => (
          <Row key={n.label} icon={n.icon} label={n.label} onPress={() => open(n.href)} />
        ))}
        <Row
          icon={copied ? Check : Link2}
          label={copied ? 'Enlace copiado' : 'Copiar enlace'}
          onPress={() => void copyLink()}
        />
        <Row
          icon={Download}
          label="Descargar el video"
          hint="Para subirlo a Instagram, TikTok o tus estados."
          onPress={download}
        />
      </View>
      <Text style={styles.url} selectable>{url}</Text>
    </Sheet>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
  onPress,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  label: string;
  hint?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button">
      <View style={styles.icon}>
        <Icon size={18} strokeWidth={2} color={colors.accent} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.label}>{label}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.s1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.s3, paddingVertical: space.s2 },
  icon: {
    width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.panel,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  hint: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  url: { marginTop: space.s3, fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
});
