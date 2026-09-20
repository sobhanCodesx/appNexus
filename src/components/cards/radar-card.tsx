import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { fontWeight, palette, radii, shadow, spacing, typeScale } from '@/design';
import type { GameRadarItem } from '@/types/api';

const fallbackImage = require('../../../assets/images/logo-glow.png');

export function RadarCard({
  item,
  width = 252,
  onPress,
}: {
  item: GameRadarItem;
  width?: number | string;
  onPress?: () => void;
}) {
  const image = item.banner_url || item.cover_url;

  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.982}
      style={[styles.card, { width } as never]}>
      <Image
        source={image ? { uri: image } : fallbackImage}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        recyclingKey={String(item.id)}
        transition={180}
      />

      <LinearGradient
        colors={['rgba(3,5,9,0.02)', 'rgba(3,5,9,0.14)', 'rgba(3,5,9,0.96)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.radarRingOuter}>
        <View style={styles.radarRingInner}>
          <View style={styles.radarPing} />
        </View>
      </View>

      <View style={styles.topRow}>
        <View style={styles.signalBadge}>
          <View style={styles.signalDot} />
          <Text style={styles.signalText}>RADAR</Text>
        </View>

        <View style={styles.platforms}>
          {item.psn?.available ? <PlatformBadge label="PS" /> : null}
          {item.xbox?.available ? <PlatformBadge label="XBOX" /> : null}
        </View>
      </View>

      <View style={styles.copy}>
        <Text style={styles.eyebrow}>NEXT ON YOUR RADAR</Text>
        <Text numberOfLines={2} style={styles.title}>{item.title}</Text>

        <View style={styles.footer}>
          <Text style={styles.subtitle}>سیگنال انتشار PlayNexus</Text>
          <View style={styles.arrowOrb}><View style={styles.arrow} /></View>
        </View>
      </View>
    </PressableScale>
  );
}

function PlatformBadge({ label }: { label: string }) {
  return (
    <View style={styles.platformBadge}>
      <Text style={styles.platformText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 322,
    borderRadius: radii.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: palette.surface,
    ...shadow.soft,
  },
  radarRingOuter: {
    position: 'absolute',
    top: 82,
    right: -32,
    width: 126,
    height: 126,
    borderRadius: 126,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRingInner: {
    width: 72,
    height: 72,
    borderRadius: 72,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPing: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: palette.cyan,
    ...shadow.cyanGlow,
  },
  topRow: {
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signalBadge: {
    height: 28,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.60)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signalDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.cyan,
  },
  signalText: {
    color: palette.white,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  platforms: {
    flexDirection: 'row',
    gap: 5,
  },
  platformBadge: {
    paddingHorizontal: 8,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.60)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformText: {
    color: palette.text,
    fontSize: 8,
    fontWeight: fontWeight.black,
  },
  copy: {
    marginTop: 'auto',
    padding: spacing.lg,
    alignItems: 'flex-end',
  },
  eyebrow: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    color: palette.white,
    fontSize: typeScale.title,
    lineHeight: 30,
    fontWeight: fontWeight.black,
    textAlign: 'right',
  },
  footer: {
    width: '100%',
    marginTop: spacing.sm,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.medium,
  },
  arrowOrb: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: 'rgba(88,244,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.4,
    borderBottomWidth: 1.4,
    borderColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
});
