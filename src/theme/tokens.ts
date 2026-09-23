// PawMates' design tokens — the one place colors, fonts, spacing, radii
// and shadows come from. Coral on warm cream, mint for success/verified,
// sun for highlights; Barlow for headlines, Figtree for body text (both
// loaded in App.tsx).
//
// Named by role where a role exists (text, accent, divider...), and by
// hue for the secondary palette (mint, sun, grape, rose), which screens
// pick for meaning: mint = done/verified, sun = time/attention,
// rose = cancelled/problem, grape = messages.

export const colors = {
  bg: '#FFF7F0',
  surface: '#FFFFFF',
  text: '#1D1533',
  accent: '#FF6B4A',
  accent2: '#00C2A0',
  divider: '#F0E4D6',

  neutral100: '#F7F0E8',
  neutral200: '#EFE3D6',
  neutral300: '#DCD0C5',
  neutral400: '#B8ACB9',
  neutral500: '#978CA0',
  neutral600: '#756E85',
  neutral700: '#5C5570',
  neutral800: '#3D3654',
  neutral900: '#1D1533',

  accent100: '#FFE7DE',
  accent200: '#FFD2C2',
  accent300: '#FFB49B',
  accent400: '#FF9575',
  accent500: '#FF7A57',
  accent600: '#FF6B4A',
  accent700: '#E85234',
  accent800: '#C43F24',
  accent900: '#8F2C18',

  textMuted: 'rgba(29, 21, 51, 0.55)',
  textMuted70: 'rgba(29, 21, 51, 0.7)',
  textMuted50: 'rgba(29, 21, 51, 0.5)',
  /** Lighter than neutral600, for placeholders and secondary counts. */
  textFaint: '#A79FB0',
  /** A slightly darker cream than bg, for inset panels. */
  panel: '#F5EBE0',

  mint: '#00C2A0',
  mintDark: '#00947C',
  mintTint: '#DAF6EF',
  mintTintLine: '#B7ECDF',

  sun: '#FFC93C',
  sunDark: '#8A6400',
  sunTint: '#FFF3D6',
  sunTintLine: '#FFE7A8',

  grape: '#8C6FE0',
  grapeTint: '#EDE7FB',
  grapeTintLine: '#DACCF5',

  rose: '#FF4D6D',
  roseTint: '#FFE1E7',
  roseTintLine: '#FFC2CF',
};

export const fonts = {
  heading: 'Barlow_700Bold',
  headingRegular: 'Barlow_500Medium',
  condensed: 'BarlowCondensed_600SemiBold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemiBold: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
};

// space-*: 3.4 / 6.8 / 10.2 / 13.6 / 20.4 / 27.2
export const space = {
  s1: 3.4,
  s2: 6.8,
  s3: 10.2,
  s4: 13.6,
  s6: 20.4,
  s8: 27.2,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
};

export const shadow = {
  sm: {
    shadowColor: '#3D3654',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#3D3654',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lg: {
    shadowColor: '#3D3654',
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
};

// Placeholder avatar/tile tints, so an empty photo is colorful instead
// of a gray box. Picked by a stable hash of the name.
const AVATAR_TINTS = [
  { bg: colors.accent100, fg: colors.accent700 },
  { bg: colors.mintTint, fg: '#00A488' },
  { bg: colors.sunTint, fg: '#C98F00' },
  { bg: colors.grapeTint, fg: '#6B4FC9' },
];

export function tintFor(seed: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}
