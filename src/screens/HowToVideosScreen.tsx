import React, { useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Modal, Pressable } from 'react-native';
import { Play, X } from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import { colors, fonts, radius, space, type } from '../theme/tokens';
import { HOW_TO_VIDEOS, type HowToVideo } from '../config/howToVideos';

type Props = NativeStackScreenProps<RootStackParamList, 'HowTo'>;

/** Short videos that show a business how PawMates works. Open to guests
 * too: someone deciding whether to sign up is who needs them most. */
export default function HowToVideosScreen({ navigation }: Props) {
  const [playing, setPlaying] = useState<HowToVideo | null>(null);

  return (
    <ScreenContainer>
      <ScreenHeader
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Welcome'))}
        kicker="Para negocios"
        title="Cómo funciona"
        subtitle="Videos cortos para sacarle todo el provecho a PawMates."
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

/** Its own component so each video gets a fresh player. */
function Player({ video, onClose }: { video: HowToVideo; onClose: () => void }) {
  const player = useVideoPlayer(video.source, (p) => {
    p.play();
  });
  return (
    <View style={styles.playerWrap}>
      <VideoView player={player} style={styles.video} contentFit="contain" nativeControls fullscreenOptions={{ enable: true }} />
      <Pressable style={styles.close} onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar video">
        <X size={22} strokeWidth={2} color="#FFFFFF" />
      </Pressable>
      <Text style={styles.playerTitle}>{video.title}</Text>
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
  playerWrap: { flex: 1, backgroundColor: '#000' },
  video: { flex: 1 },
  close: {
    position: 'absolute', top: 48, right: 20, width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  playerTitle: {
    position: 'absolute', top: 56, left: 20, right: 76,
    fontFamily: fonts.bodySemiBold, fontSize: 15, color: '#FFFFFF',
  },
});
