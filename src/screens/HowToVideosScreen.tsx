import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Modal, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Share2, X } from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import ShareVideoSheet from '../components/ShareVideoSheet';
import { colors, fonts, radius, space, type } from '../theme/tokens';
import { HOW_TO_VIDEOS, type HowToVideo } from '../config/howToVideos';

type Props = NativeStackScreenProps<RootStackParamList, 'HowTo'>;

/** Short videos that show a business how PawMates works. Open to guests
 * too: someone deciding whether to sign up is who needs them most. */
export default function HowToVideosScreen({ navigation, route }: Props) {
  const linked = route.params?.videoId;
  const [playing, setPlaying] = useState<HowToVideo | null>(null);
  // Opened from a shared link: start with that video.
  useEffect(() => {
    const video = HOW_TO_VIDEOS.find((v) => v.id === linked);
    if (video) setPlaying(video);
  }, [linked]);

  return (
    <ScreenContainer>
      <ScreenHeader
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Welcome'))}
        kicker="Para negocios"
        title="Cómo funciona"
        subtitle="Videos cortos para sacarle todo el provecho a PET Conect@."
      />
      <ScrollView contentContainerStyle={styles.body}>
        {HOW_TO_VIDEOS.map((video, i) => (
          <Card key={video.id} row onPress={() => setPlaying(video)}>
            <View style={styles.thumb}>
              <Image source={video.poster} style={styles.thumbImage} resizeMode="cover" />
              <View style={styles.playBadge}>
                <Play size={16} strokeWidth={2} color={colors.onAccent} fill={colors.onAccent} />
              </View>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={type.kicker}>Video {i + 1} · {video.length}</Text>
              <Text style={type.cardTitle}>{video.title}</Text>
              <Text style={type.meta}>{video.summary}</Text>
            </View>
          </Card>
        ))}
      </ScrollView>
      <Modal visible={playing !== null} animationType="fade" onRequestClose={() => setPlaying(null)}>
        {playing && <Player video={playing} onClose={() => setPlaying(null)} />}
      </Modal>
    </ScreenContainer>
  );
}

/** The videos are vertical (9:16). */
const VIDEO_ASPECT = 9 / 16;
const PLAYER_HEADER = 56;

/** Its own component so each video gets a fresh player. The video sits in
 * a 9:16 frame sized to fit the window, so on a wide PC screen it doesn't
 * stretch edge to edge and get cropped. */
function Player({ video, onClose }: { video: HowToVideo; onClose: () => void }) {
  const player = useVideoPlayer(video.source, (p) => {
    p.play();
  });
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const availW = window.width - space.s4 * 2;
  const availH = window.height - insets.top - insets.bottom - PLAYER_HEADER - space.s4 * 2;
  const frameH = Math.max(0, Math.min(availH, availW / VIDEO_ASPECT));
  const frameW = frameH * VIDEO_ASPECT;
  const [sharing, setSharing] = useState(false);
  return (
    <View style={[styles.playerWrap, { paddingTop: insets.top + space.s4, paddingBottom: insets.bottom + space.s4 }]}>
      <View style={[styles.playerHeader, { width: Math.max(frameW, Math.min(availW, 360)) }]}>
        <Text style={styles.playerTitle} numberOfLines={2}>{video.title}</Text>
        <Pressable style={styles.close} onPress={() => setSharing(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Compartir video">
          <Share2 size={20} strokeWidth={2} color="#FFFFFF" />
        </Pressable>
        <Pressable style={styles.close} onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar video">
          <X size={22} strokeWidth={2} color="#FFFFFF" />
        </Pressable>
      </View>
      <View style={[styles.frame, { width: frameW, height: frameH }]}>
        <VideoView player={player} style={{ width: frameW, height: frameH }} contentFit="contain" nativeControls fullscreenOptions={{ enable: true }} />
      </View>
      <ShareVideoSheet video={video} visible={sharing} onClose={() => setSharing(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.s4, paddingBottom: space.s8, gap: space.s3 },
  thumb: { width: 72, height: 128, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.panel },
  thumbImage: { width: '100%', height: '100%' },
  playBadge: {
    position: 'absolute', left: 22, top: 50, width: 28, height: 28, borderRadius: radius.pill,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  playerWrap: { flex: 1, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center' },
  playerHeader: {
    height: PLAYER_HEADER, flexDirection: 'row', alignItems: 'center', gap: space.s3,
  },
  frame: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000' },
  close: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  playerTitle: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 15, color: '#FFFFFF' },
});
