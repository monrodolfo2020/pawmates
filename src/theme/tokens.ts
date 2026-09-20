// PawMates' app-wide design tokens. Was a "blueprint" wireframe system
// (flat corners, hairline borders, corner-mark decoration) mirrored from
// an early static mockup; replaced with the vivid identity introduced in
// theme/vividTokens.ts (bright coral + mint on warm cream, bold Barlow
// headlines, Figtree body) so every screen using these tokens — still
// most of the app — inherits the new look without a per-screen rewrite.
// Key names are kept 1:1 with the old system for exactly that reason.

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
  cornerColor: 'rgba(29, 21, 51, 0.3)',
};

export const fonts = {
  heading: 'Barlow_700Bold',
  headingRegular: 'Barlow_500Medium',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
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
