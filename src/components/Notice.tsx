import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, fonts, radius, space } from '../theme/tokens';

type Tone = 'info' | 'success' | 'warning' | 'danger';

/**
 * A short message in a tinted box: errors (danger), "waiting for
 * someone" (warning), "done" (success), or a plain note (info).
 */
export default function Notice({
  children, tone = 'info', title, style,
}: { children?: React.ReactNode; tone?: Tone; title?: string; style?: StyleProp<ViewStyle> }) {
  const t = TONES[tone];
  return (
    <View style={[styles.box, { backgroundColor: t.bg, borderColor: t.line }, style]} accessibilityRole={tone === 'danger' ? 'alert' : undefined}>
      {title && <Text style={[styles.title, { color: t.fg }]}>{title}</Text>}
      {children != null && children !== false && (
        typeof children === 'string' ? <Text style={[styles.text, tone !== 'info' && { color: t.fg }]}>{children}</Text> : children
      )}
    </View>
  );
}

const TONES: Record<Tone, { bg: string; line: string; fg: string }> = {
  info: { bg: colors.panel, line: colors.panel, fg: colors.text },
  success: { bg: colors.successTint, line: colors.successLine, fg: colors.success },
  warning: { bg: colors.warningTint, line: colors.warningLine, fg: colors.warning },
  danger: { bg: colors.dangerTint, line: colors.dangerLine, fg: colors.danger },
};

const styles = StyleSheet.create({
  box: { padding: space.s3 + 2, borderRadius: radius.md, borderWidth: 1, gap: space.s1 },
  title: { fontFamily: fonts.bodyBold, fontSize: 14 },
  text: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.text },
});
