import { Platform } from 'react-native';

export const palette = {
  ink: '#05070B',
  inkRaised: '#0A0E15',
  surface: '#0E141F',
  surfaceSoft: '#121A27',
  surfaceBright: '#182335',
  white: '#F7FAFF',
  text: '#F4F7FB',
  textMuted: '#8E9AAD',
  textDim: '#627086',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.14)',
  blue: '#4DA3FF',
  blueHot: '#1E7CFF',
  cyan: '#55F6FF',
  violet: '#A66BFF',
  magenta: '#FF4FD8',
  success: '#4BE6A9',
  warning: '#FFB84D',
  danger: '#FF5D73',
  black: '#000000',
} as const;

export const gradients = {
  brand: [palette.blueHot, palette.violet, palette.magenta] as const,
  hero: ['rgba(5,7,11,0.04)', 'rgba(5,7,11,0.42)', palette.ink] as const,
  glass: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)'] as const,
  radar: ['#10243B', '#0A0E15'] as const,
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 56,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const typeScale = {
  micro: 11,
  caption: 12,
  bodySm: 14,
  body: 16,
  titleSm: 18,
  title: 22,
  displaySm: 28,
  display: 36,
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
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.34,
      shadowRadius: 28,
    },
    glow: {
      shadowColor: palette.blue,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.22,
      shadowRadius: 20,
    },
  },
  default: {
    card: { elevation: 12 },
    glow: { elevation: 8 },
  },
}) ?? { card: {}, glow: {} };

export const layout = {
  screenPadding: 18,
  contentMax: 720,
  tabBarHeight: 72,
  touchTarget: 48,
} as const;
