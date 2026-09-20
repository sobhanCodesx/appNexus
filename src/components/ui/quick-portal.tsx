import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { fontFamily, fontWeight, palette, radii, shadow, spacing, typeScale } from '@/design';
import { PressableScale } from './pressable-scale';

type Tone = 'cyan' | 'blue' | 'violet' | 'magenta';

const tones: Record<Tone, {
  accent: string;
  gradient: readonly [string, string];
}> = {
  cyan: {
    accent: palette.cyan,
    gradient: ['rgba(88,244,255,0.16)', 'rgba(88,244,255,0.025)'],
  },
  blue: {
    accent: palette.blue,
    gradient: ['rgba(24,124,255,0.18)', 'rgba(24,124,255,0.025)'],
  },
  violet: {
    accent: palette.violet,
    gradient: ['rgba(167,123,255,0.18)', 'rgba(167,123,255,0.025)'],
  },
  magenta: {
    accent: palette.magenta,
    gradient: ['rgba(255,85,213,0.15)', 'rgba(255,85,213,0.025)'],
  },
};

export function QuickPortal({
  title,
  caption,
  symbol,
  tone = 'blue',
  onPress,
}: {
  title: string;
  caption: string;
  symbol: string;
  tone?: Tone;
  onPress: () => void;
}) {
  const theme = tones[tone];

  return (
    <PressableScale onPress={onPress} pressedScale={0.975} style={styles.root}>
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.signalLine, { backgroundColor: theme.accent }]} />

      <View style={[styles.symbolWrap, { borderColor: theme.accent + '44' }]}>
        <Text style={[styles.symbol, { color: theme.accent }]}>{symbol}</Text>
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.caption}>{caption}</Text>
      </View>

      <View style={styles.arrowWrap}>
        <View style={[styles.arrow, { borderColor: theme.accent }]} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 154,
    minHeight: 98,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.glass,
    overflow: 'hidden',
    padding: spacing.sm,
    ...shadow.soft,
  },
  signalLine: {
    position: 'absolute',
    top: 0,
    right: 18,
    width: 44,
    height: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  symbolWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontSize: 16,
    fontWeight: fontWeight.black,
  },
  copy: {
    marginTop: spacing.sm,
    alignItems: 'flex-end',
  },
  title: {
    color: palette.white,
    fontSize: typeScale.bodySm,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    textAlign: 'right',
  },
  caption: {
    color: palette.textDim,
    fontFamily: fontFamily.regular,
    fontSize: 10,
    marginTop: 3,
    textAlign: 'right',
  },
  arrowWrap: {
    position: 'absolute',
    left: 12,
    bottom: 12,
  },
  arrow: {
    width: 8,
    height: 8,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    transform: [{ rotate: '45deg' }],
  },
});
