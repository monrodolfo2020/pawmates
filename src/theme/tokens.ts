// PawMates' design tokens — the one place colors, fonts, spacing, radii
// and shadows come from.
//
// "Cálido editorial": warm bone background, ink text, Instrument Serif
// for screen titles and business names, Figtree for everything else
// (both loaded in App.tsx).
//
// Color has a job, or it isn't used:
//   accent  — the one action color: primary buttons, links, selection.
//   success — verified / done / confirmed.
//   warning — pending / waiting for someone.
//   danger  — cancelled / rejected / errors.
// Everything else is ink on bone and white.

export const colors = {
  bg: '#FBF6F1',
  surface: '#FFFFFF',
  /** A slightly darker bone than bg, for inset panels and tracks. */
  panel: '#F4ECE3',
  text: '#261E2C',
  /** Secondary text; 5.4:1 on bg. */
  textMuted: '#6B6273',
  /** Placeholders and tertiary counts only — not for anything to read. */
  textFaint: '#9A91A1',
  /** Text on an accent/ink fill. */
  onAccent: '#FFFFFF',
  divider: '#ECE2D7',
  border: '#DDD1C4',

  // 4.7:1 with white text.
  accent: '#C8492A',
  accentPressed: '#A83C22',
  accentTint: '#FBE7DF',
  accentTintLine: '#F3CDBF',

  success: '#2F7A55',
  successTint: '#E4F2EA',
  successLine: '#C3E3D1',

  warning: '#8A5A00',
  warningTint: '#FCF1D9',
  warningLine: '#F2DDA8',

  danger: '#B42348',
  dangerTint: '#FBE3E8',
  dangerLine: '#F2C2CE',
};

export const fonts = {
  /** Serif, one weight: screen titles and business names, 20px and up. */
  display: 'InstrumentSerif_400Regular',
  /** Bold sans: numbers, prices, short UI headings. */
  heading: 'Figtree_700Bold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemiBold: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
};

// Ready-made text styles, so screens don't invent sizes.
export const type = {
  display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.text },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.text },
  section: { fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 22, color: colors.text },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, lineHeight: 21, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  small: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: colors.textMuted },
  meta: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17, color: colors.textMuted },
  kicker: {
    fontFamily: fonts.bodySemiBold, fontSize: 11.5, letterSpacing: 0.8,
    textTransform: 'uppercase' as const, color: colors.textMuted,
  },
};

// A 4px grid. Screens use s4 (16) for side gutters and s6 (24) between
// sections; cards pad with s4.
export const space = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s8: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const shadow = {
  sm: {
    shadowColor: '#261E2C',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: '#261E2C',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lg: {
    shadowColor: '#261E2C',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};

// Placeholder avatar tints, so a business without a photo gets its
// initials on a soft color instead of an empty box. Picked by a stable
// hash of the name.
const AVATAR_TINTS = [
  { bg: '#FBE7DF', fg: '#A83C22' },
  { bg: '#E4F2EA', fg: '#2F6B4F' },
  { bg: '#FCF1D9', fg: '#7A5200' },
  { bg: '#ECE6F3', fg: '#5B4A78' },
  { bg: '#E3EEF3', fg: '#335E73' },
];

export function tintFor(seed: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}
