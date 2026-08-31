import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronLeft, Send } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import { colors, fonts, space } from '../theme/tokens';
import { useAppState } from '../state/AppState';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const POLL_MS = 3000;

export default function ChatScreen({ navigation }: Props) {
  const s = useAppState();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    void s.refreshMessages();
    const id = setInterval(() => void s.refreshMessages(), POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    setSending(true);
    try {
      await s.sendChatMessage(text);
      scrollRef.current?.scrollToEnd({ animated: true });
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
        </IconButton>
        <Text style={styles.title}>Mensajes</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {s.messages.length === 0 && (
            <Text style={styles.empty}>Todavía no hay mensajes — escribe el primero.</Text>
          )}
          {s.messages.map((m) => {
            const mine = m.senderId === s.accountId;
            return (
              <View key={m.id} style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{m.text}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe un mensaje…"
            placeholderTextColor={colors.textMuted}
            multiline
            onSubmitEditing={() => void handleSend()}
          />
          <IconButton onPress={() => void handleSend()}>
            <Send size={18} strokeWidth={1.5} color={colors.accent} />
          </IconButton>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
  },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  scroll: { padding: space.s4, gap: space.s2, flexGrow: 1 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: space.s6 },
  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', paddingHorizontal: space.s3, paddingVertical: space.s2, borderWidth: 1 },
  bubbleTheirs: { backgroundColor: colors.surface, borderColor: colors.divider },
  bubbleMine: { backgroundColor: colors.accent, borderColor: colors.accent },
  bubbleText: { fontFamily: fonts.body, fontSize: 14, color: colors.text },
  bubbleTextMine: { color: colors.bg },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: space.s2,
    padding: space.s4, borderTopWidth: 1, borderTopColor: colors.divider,
  },
  input: {
    flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.text,
    borderWidth: 1, borderColor: colors.divider, paddingHorizontal: space.s3,
    paddingVertical: space.s2, maxHeight: 100,
  },
});
