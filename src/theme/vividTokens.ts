// PawMates' next visual identity — brighter, warmer, and more energetic
// than both the original "blueprint" system (tokens.ts) and the muted
// "boutique" commerce system (commerceTokens.ts). Built to feel playful
// and trustworthy for a younger, urban pet-care audience: a punchy coral
// as the primary action color, a fresh mint for success/verified states,
// a warm sun-yellow for ratings/highlights, on a soft cream canvas — not
// stark white, which read too clinical for a pet app.
//
// Typography reuses fonts already loaded in App.tsx (no new dependency):
// Barlow's bold weight carries big numbers/headlines with real punch
// (more energetic than a delicate serif), Figtree stays for body text.

export const vividColors = {
  bg: '#FFF7F0',
  surface: '#FFFFFF',
  ink: '#1D1533',
  mute: '#756E85',
  muted2: '#A79FB0',
  line: '#F0E4D6',
  panel: '#F5EBE0',

  coral: '#FF6B4A',
  coralDark: '#E85234',
  coralTint: '#FFE7DE',
  coralTintLine: '#FFD2C2',

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

export const vividFonts = {
  display: 'Barlow_700Bold',
  displayMedium: 'Barlow_500Medium',
  condensed: 'BarlowCondensed_600SemiBold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemiBold: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
};

export const vividRadius = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
};

// Cycles for placeholder avatar/tile tints (mirrors commerceTokens'
// tintFor) — keeps empty-photo states colorful instead of gray boxes.
const AVATAR_TINTS = [
  { bg: '#FFE7DE', fg: '#E85234' }, // coral
  { bg: '#DAF6EF', fg: '#00A488' }, // mint
  { bg: '#FFF3D6', fg: '#C98F00' }, // sun
  { bg: '#EDE7FB', fg: '#6B4FC9' }, // grape
];

export function vividTintFor(seed: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}
