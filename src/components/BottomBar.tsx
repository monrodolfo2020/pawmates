import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, space } from '../theme/tokens';

/**
 * The fixed bar under a screen's scroll area that holds its main action
 * (and, beside it, a short summary like a price). One per screen.
 */
export default function BottomBar({ children, summary }: { children: React.ReactNode; summary?: React.ReactNode }) {
  return (
    <View style={styles.bar}>
      {summary ? (
        <View style={styles.row}>
          <View style={styles.summary}>{summary}</View>
          <View style={styles.actions}>{children}</View>
        </View>
      ) : (
        <View style={styles.stack}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: space.s4,
    paddingTop: space.s3,
    paddingBottom: space.s4,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.bg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.s3 },
  summary: { flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', gap: space.s2 },
  stack: { gap: space.s2 },
});
