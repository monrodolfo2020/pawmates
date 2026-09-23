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
import Avatar from '../components/Avatar';
import { colors, fonts, radius, space, type } from '../theme/tokens';
import { useAppState } from '../state/AppState';
import { api, BookingSummary } from '../api/client';
import { formatWhen } from '../utils/bookingSlots';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const POLL_MS = 3000;

export default function ChatScreen({ navigation, route }: Props) {
  const s = useAppState();
  const { bookingId } = route.params;
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [booking, setBooking] = useState<BookingSummary | null>(null);

  // Who this conversation is with, for the header.
  useEffect(() => {
    if (!s.token) return;
    api.getBooking(s.token, bookingId).then(setBooking).catch(() => undefined);
  }, [s.token, bookingId]);
  const other = booking
    ? booking.ownerId === s.accountId
      ? booking.providerName
      : booking.ownerName
    : null;
  const pets = booking?.lines.map((l) => l.petName?.split(' · ')[0]).filter(Boolean).join(', ');

  useEffect(() => {
    // Every GET /messages here also marks the thread read for this
    // account server-side (see BookingController.listMessages) — no
    // separate ack call needed.
    void s.refreshMessages(bookingId);
    const id = setInterval(() => void s.refreshMessages(bookingId), POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    setSending(true);
    try {
      await s.sendChatMessage(bookingId, text);
      scrollRef.current?.scrollToEnd({ animated: true });
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()} label="Regresar">
          <ChevronLeft size={20} strokeWidth={1.75} color={colors.text} />
        </IconButton>
        {other && <Avatar name={other} size={40} square />}
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {other ?? 'Mensajes'}
          </Text>
          {booking && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {pets ? `${pets} · ` : ''}
              {formatWhen(booking.scheduledAt)}
            </Text>
          )}
        </View>
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
                  <Text style={[styles.time, mine && styles.timeMine]}>
                    {new Date(m.sentAt).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  </Text>
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
            placeholderTextColor={colors.textFaint}
            multiline
            onSubmitEditing={() => void handleSend()}
          />
          <IconButton
            label="Enviar"
            onPress={() => void handleSend()}
            style={[styles.send, !draft.trim() && { opacity: 0.4 }]}
          >
            <Send size={18} strokeWidth={1.75} color={colors.onAccent} />
          </IconButton>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s4, paddingVertical: space.s3,
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: colors.text },
  subtitle: { ...type.meta },
  scroll: { padding: space.s4, gap: space.s2, flexGrow: 1 },
  empty: { ...type.small, textAlign: 'center', marginTop: space.s6 },
  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%', paddingHorizontal: space.s3 + 2, paddingVertical: space.s2 + 2, borderWidth: 1,
    borderRadius: radius.lg, gap: 2,
  },
  bubbleTheirs: { backgroundColor: colors.surface, borderColor: colors.divider, borderBottomLeftRadius: 4 },
  bubbleMine: { backgroundColor: colors.accentTint, borderColor: colors.accentTintLine, borderBottomRightRadius: 4 },
  time: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
  timeMine: { textAlign: 'right' },
  bubbleText: { ...type.body },
  bubbleTextMine: {},
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: space.s2,
    paddingHorizontal: space.s4, paddingVertical: space.s3, borderTopWidth: 1, borderTopColor: colors.divider,
  },
  input: {
    flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.text, minHeight: 44,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface,
    paddingHorizontal: space.s3 + 2, paddingVertical: space.s3 - 2, maxHeight: 120,
  },
  send: { width: 44, height: 44, backgroundColor: colors.accent, borderColor: colors.accent },
});
