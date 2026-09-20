import AsyncStorage from '@react-native-async-storage/async-storage';

// Per-booking "I've seen this thread" marker, kept client-side (like the
// session and cart already are) rather than round-tripping through the
// backend just for a read receipt. Written by ChatScreen on every message
// refresh, read by DashboardScreen to badge a booking's "Enviar mensaje"
// button when the other side has sent something since.
const keyFor = (bookingId: string) => `pawmates.chatRead.${bookingId}`;

export async function markChatRead(bookingId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(bookingId), new Date().toISOString());
  } catch {
    // Best-effort — worst case the unread badge lingers a bit too long.
  }
}

export async function getChatReadAt(bookingId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(keyFor(bookingId));
  } catch {
    return null;
  }
}
