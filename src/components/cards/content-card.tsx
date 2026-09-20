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
  width = 280,
  onPress,
}: {
  item: ContentItem;
  width?: number | string;
  onPress?: () => void;
}) {
  return (
    <PressableScale onPress={onPress} style={[styles.card, { width } as never]}>
      <Image
        source={imageOf(item)}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        recyclingKey={String(item.id)}
        transition={180}
      />
      <LinearGradient
        colors={['rgba(5,7,11,0.02)', 'rgba(5,7,11,0.36)', 'rgba(5,7,11,0.96)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.meta}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.game?.name || item.feed_type || 'PLAYNEXUS'}</Text>
        </View>
        <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {item.views ? item.views.toLocaleString('fa-IR') + ' بازدید' : 'جدید'}
          </Text>
          {item.duration ? (
            <Text style={styles.footerText}>{Math.max(1, Math.round(item.duration / 60))} دقیقه</Text>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 188,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    ...shadow.card,
  },
  meta: { marginTop: 'auto', padding: spacing.md, alignItems: 'flex-end' },
  badge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(77,163,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.28)',
    marginBottom: spacing.xs,
  },
  badgeText: { color: palette.cyan, fontSize: 10, fontWeight: fontWeight.bold },
  title: {
    color: palette.white,
    fontSize: typeScale.titleSm,
    lineHeight: 25,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
  },
  footer: {
    width: '100%',
    marginTop: spacing.xs,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  footerText: {
    color: palette.textMuted,
    fontSize: typeScale.micro,
    fontWeight: fontWeight.medium,
  },
});
