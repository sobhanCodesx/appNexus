import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { fontWeight, palette, radii, spacing, typeScale } from '@/design';
import type { GameRadarItem } from '@/types/api';

const fallbackImage = require('../../../assets/images/logo-glow.png');

export function RadarCard({
  item,
  width = 246,
  onPress,
}: {
  item: GameRadarItem;
  width?: number | string;
  onPress?: () => void;
}) {
  const image = item.banner_url || item.cover_url;

  return (
    <PressableScale onPress={onPress} style={[styles.card, { width } as never]}>
      <Image
        source={image ? { uri: image } : fallbackImage}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        recyclingKey={String(item.id)}
        transition={180}
      />
      <LinearGradient colors={['transparent', 'rgba(5,7,11,0.88)']} style={StyleSheet.absoluteFill} />
      <View style={styles.platforms}>
        {item.psn?.available ? <PlatformBadge label="PS" /> : null}
        {item.xbox?.available ? <PlatformBadge label="XBOX" /> : null}
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>در رادار PlayNexus</Text>
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
    height: 300,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
  },
  platforms: { position: 'absolute', top: spacing.sm, left: spacing.sm, flexDirection: 'row', gap: 6 },
  platformBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(5,7,11,0.70)',
    borderWidth: 1,
    borderColor: palette.lineStrong,
  },
  platformText: { color: palette.white, fontSize: 9, fontWeight: fontWeight.black },
  copy: { marginTop: 'auto', padding: spacing.lg, alignItems: 'flex-end' },
  title: {
    color: palette.white,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: fontWeight.black,
    textAlign: 'right',
  },
  subtitle: {
    marginTop: 5,
    color: palette.textMuted,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.medium,
  },
});
