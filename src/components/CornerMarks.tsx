import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';

// Mirrors .blueprint > .corner in styles.css: an 11x11 crosshair "+" mark
// sitting 6px outside each corner of the frame it decorates.
const CORNERS: Array<'tl' | 'tr' | 'bl' | 'br'> = ['tl', 'tr', 'bl', 'br'];

function Corner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  return (
    <View style={[styles.box, POSITIONS[position]]} pointerEvents="none">
      <View style={styles.vLine} />
      <View style={styles.hLine} />
    </View>
  );
}

export default function CornerMarks() {
  return (
    <>
      {CORNERS.map((p) => (
        <Corner key={p} position={p} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', width: 11, height: 11 },
  vLine: {
    position: 'absolute', left: 5, top: 0, width: 1, height: '100%',
    backgroundColor: colors.cornerColor,
  },
  hLine: {
    position: 'absolute', top: 5, left: 0, height: 1, width: '100%',
    backgroundColor: colors.cornerColor,
  },
});

const POSITIONS = StyleSheet.create({
  tl: { top: -6, left: -6 },
  tr: { top: -6, right: -6 },
  bl: { bottom: -6, left: -6 },
  br: { bottom: -6, right: -6 },
});
