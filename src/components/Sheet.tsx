import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { colors, radius, space, type } from '../theme/tokens';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Pinned under the scrolling content (a "Listo" button, usually). */
  footer?: React.ReactNode;
};

/** A panel that slides up over the screen, for editing one thing
 * without leaving the page behind it. */
export default function Sheet({ visible, title, onClose, children, footer }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.panelWrap}>
          <View style={styles.panel} accessibilityViewIsModal>
            <View style={styles.head}>
              <Text style={[type.title, { flex: 1, fontSize: 24, lineHeight: 28 }]} accessibilityRole="header">
                {title}
              </Text>
              <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar">
                <X size={22} strokeWidth={1.75} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
            {footer && <View style={styles.footer}>{footer}</View>}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(38, 30, 44, 0.45)' },
  panelWrap: { width: '100%', maxWidth: 560, alignSelf: 'center', maxHeight: '88%' },
  panel: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg + 4,
    borderTopRightRadius: radius.lg + 4,
    maxHeight: '100%',
  },
  head: {
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
    paddingHorizontal: space.s5, paddingTop: space.s5, paddingBottom: space.s3,
  },
  body: { paddingHorizontal: space.s5, paddingBottom: space.s5, gap: space.s4 },
  footer: {
    paddingHorizontal: space.s5, paddingTop: space.s3, paddingBottom: space.s5,
    borderTopWidth: 1, borderTopColor: colors.divider, gap: space.s2,
  },
});
