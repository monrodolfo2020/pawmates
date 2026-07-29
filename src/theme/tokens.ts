// Design tokens mirrored 1:1 from the Industry design system
// (project/_ds/industry-.../styles.css). Keep in sync with that file —
// it is the source of truth for the look.

export const colors = {
  bg: '#f2f2f3',
  surface: '#e9e9ea',
  text: '#1d1f20',
  accent: '#5980a6',
  accent2: '#728fab',
  divider: 'rgba(29, 31, 32, 0.16)',

  neutral100: '#f5f5f8',
  neutral200: '#e7e7ea',
  neutral300: '#d4d4d7',
  neutral400: '#b7b7ba',
  neutral500: '#98989b',
  neutral600: '#7a7a7d',
  neutral700: '#5d5d60',
  neutral800: '#424244',
  neutral900: '#2b2b2d',

  accent100: '#eef6ff',
  accent200: '#d6ebff',
  accent300: '#b5d9fd',
  accent400: '#94bce3',
  accent500: '#749dc4',
  accent600: '#597ea3',
  accent700: '#416180',
  accent800: '#2c455d',
  accent900: '#1d2d3d',

  textMuted: 'rgba(29, 31, 32, 0.55)',
  textMuted70: 'rgba(29, 31, 32, 0.7)',
  textMuted50: 'rgba(29, 31, 32, 0.5)',
  cornerColor: 'rgba(29, 31, 32, 0.55)',
};

export const fonts = {
  heading: 'BarlowCondensed_600SemiBold',
  headingRegular: 'BarlowCondensed_400Regular',
  body: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodyBold: 'Barlow_700Bold',
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
  sm: 2,
  md: 4,
  lg: 7,
};

// Blueprint style zeroes out radius on cards/buttons/inputs/tags — this
// system draws square-cornered wireframe objects, never soft rounded ones.
export const shadow = {
  sm: {
    shadowColor: '#2b2b2d',
    shadowOpacity: 0.14,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  md: {
    shadowColor: '#2b2b2d',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  lg: {
    shadowColor: '#2b2b2d',
    shadowOpacity: 0.22,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
};
