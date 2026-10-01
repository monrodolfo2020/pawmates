import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow, space } from '../theme/tokens';

/**
 * How wide a screen's content may grow on a big screen (a computer's
 * browser). On a phone every width is the phone's: nothing changes there.
 *
 * - `narrow`: a short form (sign in, sign up…), shown as a centred card.
 * - `regular`: most screens — a readable column, like a phone's but roomier.
 * - `wide`: work surfaces that use the room (admin, the page editor).
 */
export type ScreenWidth = 'narrow' | 'regular' | 'wide';

const MAX_WIDTH: Record<ScreenWidth, number> = { narrow: 480, regular: 760, wide: 1200 };

/** From here up the window counts as a computer screen (as in AppNav). */
const DESKTOP_BREAKPOINT = 768;

type Props = { children: React.ReactNode; style?: StyleProp<ViewStyle>; width?: ScreenWidth };

export default function ScreenContainer({ children, style, width = 'regular' }: Props) {
  const window = useWindowDimensions();
  const desktop = window.width >= DESKTOP_BREAKPOINT;
  const card = desktop && width === 'narrow';
  return (
    <SafeAreaView style={[styles.root, desktop && styles.rootDesktop, style]} edges={['top', 'bottom']}>
      <View style={[styles.column, { maxWidth: MAX_WIDTH[width] }, card && styles.card]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  // A slightly darker surround so the centred column reads as the page.
  rootDesktop: { backgroundColor: colors.panel, justifyContent: 'center' },
  column: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.bg,
  },
  // Fills the height it's given (its screen scrolls inside), up to a
  // form's worth, so a short form doesn't stretch down a tall monitor.
  card: {
    maxHeight: 880,
    marginVertical: space.s8,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.md,
  },
});
