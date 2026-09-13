// Visual language for the shopping screens only (Store/Product/Cart) —
// distinct on purpose from theme/tokens.ts's blueprint system used
// everywhere else in the app. Ported from the "Kindred Pet Store" Claude
// Design mockup: bone paper, moss ink, one clay accent; Instrument Serif
// for headlines/prices/numbers, Figtree for the interface.

export const commerceColors = {
  bg: '#F7F4EE',
  surface: '#FFFFFF',
  moss: '#2E3D2F',
  clay: '#C0744C',
  ink: '#171A15',
  line: '#E4DFD5',
  mute: '#6B7065',
  muted2: '#9A9A8E',
  tintGreen: '#E7EDE2',
  tintGreenLine: '#D6DFCF',
  panel: '#EFEBE2',
};

export const commerceFonts = {
  serif: 'InstrumentSerif_400Regular',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemiBold: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
};

export const commerceRadius = {
  sm: 10,
  md: 14,
  lg: 18,
  pill: 999,
};

// Placeholder tile tints — cycles through these for products without a
// photo yet (mirrors the mockup's placeholder-tile system), so the grid
// still reads as colorful merchandise rather than a wall of empty boxes.
export const PLACEHOLDER_TINTS = [
  '#E3E8DA', '#EDE0D4', '#DEE6EA', '#E6DED2', '#E9E3D7', '#E1E6E2',
  '#EDE1D6', '#E4E4DC', '#E8E2EC', '#DEE7E0', '#E7E1E0', '#E8E0D2',
];

export function tintFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PLACEHOLDER_TINTS[hash % PLACEHOLDER_TINTS.length];
}
