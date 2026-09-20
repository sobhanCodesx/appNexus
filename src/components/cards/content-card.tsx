import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { fontWeight, palette, radii, shadow, spacing, typeScale } from '@/design';
import type { ContentCard as ContentItem } from '@/types/api';

const fallbackImage = require('../../../assets/images/logo-glow.png');

function imageOf(item: ContentItem) {
  const uri = item.thumbnail_url || item.image_url || item.cover_url || item.game?.cover_url;
  return uri ? { uri } : fallbackImage;
}

export function ContentCard({
  item,
  width = 284,
  onPress,
  featured = false,
}: {
  item: ContentItem;
  width?: number | string;
  onPress?: () => void;
  featured?: boolean;
}) {
  const duration = item.duration ? Math.max(1, Math.round(item.duration / 60)) : null;

  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.982}
      style={[
        styles.card,
        featured && styles.featured,
        { width } as never,
      ]}>
      <Image
        source={imageOf(item)}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        recyclingKey={String(item.id)}
        transition={180}
      />

      <LinearGradient
        colors={[
          'rgba(3,5,9,0.00)',
          'rgba(3,5,9,0.12)',
          'rgba(3,5,9,0.94)',
        ]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topMeta}>
        <View style={styles.typeBadge}>
          <View style={styles.typeDot} />
          <Text style={styles.typeText}>
            {item.type === 'video' ? 'VIDEO' : item.type === 'short' ? 'SHORT' : 'FEED'}
          </Text>
        </View>
        {duration ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{duration}m</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.meta}>
        <Text style={styles.game}>
          {item.game?.name || item.channel?.name || item.feed_type || 'PLAYNEXUS'}
        </Text>

        <Text
          numberOfLines={featured ? 3 : 2}
          style={[styles.title, featured && styles.featuredTitle]}>
          {item.title}
        </Text>

        <View style={styles.footer}>
          <View style={styles.footerMetric}>
            <View style={styles.metricDot} />
            <Text style={styles.footerText}>
              {item.views ? item.views.toLocaleString('fa-IR') + ' بازدید' : 'تازه'}
            </Text>
          </View>
          <View style={styles.openOrb}>
            <View style={styles.openArrow} />
          </View>
        </View>
      </View>

      <View style={styles.bottomSignal} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 198,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    ...shadow.soft,
  },
  featured: {
    height: 318,
  },
  topMeta: {
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    height: 28,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.cyan,
  },
  typeText: {
    color: palette.white,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  durationBadge: {
    minWidth: 34,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  meta: {
    marginTop: 'auto',
    padding: spacing.md,
    alignItems: 'flex-end',
  },
  game: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 0.9,
    marginBottom: 6,
  },
  title: {
    color: palette.white,
    fontSize: typeScale.titleSm,
    lineHeight: 25,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    letterSpacing: -0.2,
  },
  featuredTitle: {
    fontSize: typeScale.titleLg,
    lineHeight: 34,
    maxWidth: 330,
  },
  footer: {
    width: '100%',
    marginTop: spacing.sm,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerMetric: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  metricDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.textDim,
  },
  footerText: {
    color: palette.textMuted,
    fontSize: typeScale.micro,
    fontWeight: fontWeight.medium,
  },
  openOrb: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.4,
    borderBottomWidth: 1.4,
    borderColor: palette.white,
    transform: [{ rotate: '45deg' }],
  },
  bottomSignal: {
    position: 'absolute',
    right: 18,
    bottom: 0,
    width: 52,
    height: 2,
    backgroundColor: palette.cyan,
    opacity: 0.6,
  },
});
