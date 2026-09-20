import { Platform } from 'react-native';

export const palette = {
  ink: '#030509',
  inkRaised: '#070B12',
  inkSoft: '#0A101A',
  surface: '#0D141F',
  surfaceSoft: '#101925',
  surfaceBright: '#172334',
  surfaceHalo: '#1C2C42',
  white: '#FAFCFF',
  text: '#F5F8FC',
  textMuted: '#96A4B8',
  textDim: '#66768D',
  line: 'rgba(255,255,255,0.075)',
  lineStrong: 'rgba(255,255,255,0.15)',
  glass: 'rgba(10,16,26,0.72)',
  glassStrong: 'rgba(7,11,18,0.88)',
  blue: '#55A9FF',
  blueHot: '#187CFF',
  cyan: '#58F4FF',
  violet: '#A77BFF',
  magenta: '#FF55D5',
  success: '#50E8B0',
  warning: '#FFBE55',
  danger: '#FF6178',
  black: '#000000',
} as const;

export const gradients = {
  brand: [palette.blueHot, palette.violet, palette.magenta] as const,
  brandCool: [palette.cyan, palette.blueHot, palette.violet] as const,
  hero: ['rgba(3,5,9,0.00)', 'rgba(3,5,9,0.18)', 'rgba(3,5,9,0.96)'] as const,
  heroSide: ['rgba(3,5,9,0.08)', 'rgba(3,5,9,0.88)'] as const,
  glass: ['rgba(255,255,255,0.11)', 'rgba(255,255,255,0.025)'] as const,
  radar: ['#102944', '#09111D', '#05070B'] as const,
  signal: ['rgba(88,244,255,0.18)', 'rgba(24,124,255,0.04)'] as const,
} as const;

export const spacing = {
  hairline: 2,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 56,
  massive: 72,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 34,
  pill: 999,
} as const;

export const typeScale = {
  micro: 10,
  caption: 12,
  bodySm: 14,
  body: 16,
  titleSm: 18,
  title: 22,
  titleLg: 26,
  displaySm: 30,
  display: 38,
  hero: 42,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '900',
} as const;

export const shadow = Platform.select({
  ios: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.34,
      shadowRadius: 30,
    },
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.24,
      shadowRadius: 22,
    },
    glow: {
      shadowColor: palette.blue,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.26,
      shadowRadius: 22,
    },
    cyanGlow: {
      shadowColor: palette.cyan,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
    },
  },
  default: {
    card: { elevation: 12 },
    soft: { elevation: 8 },
    glow: { elevation: 9 },
    cyanGlow: { elevation: 8 },
  },
}) ?? { card: {}, soft: {}, glow: {}, cyanGlow: {} };

export const layout = {
  screenPadding: 18,
  screenPaddingWide: 22,
  contentMax: 720,
  tabBarHeight: 68,
  touchTarget: 48,
  cardGap: 14,
} as const;
