import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { fontFamily, fontWeight, palette, radii, shadow, spacing } from '@/design';
import type { HomeGame } from '@/types/api';

const fallback = require('../../../assets/images/logo-glow.png');

export function HomeGameCard({
  game,
  onPress,
}: {
  game: HomeGame;
  onPress: () => void;
}) {
  const image = game.background_url || game.cover_url;

  return (
    <PressableScale onPress={onPress} pressedScale={0.98} style={styles.card}>
      <Image
        source={image ? { uri: image } : fallback}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={['rgba(3,5,9,0.00)', 'rgba(3,5,9,0.14)', 'rgba(3,5,9,0.94)']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.cloud}>
        <View style={styles.cloudDot} />
        <Text style={styles.cloudText}>GAME CLOUD</Text>
      </View>

      <View style={styles.copy}>
        <Text style={styles.kicker}>{game.studio?.name || game.developer || 'PLAYNEXUS GAME'}</Text>
        <Text numberOfLines={2} style={styles.title}>{game.name}</Text>
        <View style={styles.open}>
          <Text style={styles.openText}>ورود به هاب</Text>
          <View style={styles.arrow} />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 214,
    height: 250,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: palette.surface,
    ...shadow.soft,
  },
  cloud: {
    alignSelf: 'flex-start',
    margin: spacing.sm,
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cloudDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.cyan,
  },
  cloudText: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 8,
    letterSpacing: 0.9,
  },
  copy: {
    marginTop: 'auto',
    padding: spacing.md,
    alignItems: 'flex-end',
  },
  kicker: {
    color: palette.cyan,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  title: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'right',
    marginTop: 4,
  },
  open: {
    width: '100%',
    marginTop: spacing.sm,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  openText: {
    color: palette.textMuted,
    fontFamily: fontFamily.bold,
    fontSize: 10,
  },
  arrow: {
    width: 8,
    height: 8,
    borderLeftWidth: 1.4,
    borderBottomWidth: 1.4,
    borderColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
});
