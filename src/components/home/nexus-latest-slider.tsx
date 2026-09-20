import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { fontFamily, fontWeight, palette, radii, shadow, spacing } from '@/design';
import type { NexusLatestItem } from '@/types/api';

const fallback = require('../../../assets/images/logo-glow.png');

const kindLabel: Record<NexusLatestItem['kind'], string> = {
  feed: 'FEED',
  video: 'VIDEO',
  studio: 'STUDIO',
  game: 'GAME',
  product: 'STORE',
};

const kindCaption: Record<NexusLatestItem['kind'], string> = {
  feed: 'تازه در فید',
  video: 'ویدیوی جدید',
  studio: 'استودیوی تازه',
  game: 'بازی جدید',
  product: 'محصول جدید',
};

function open(item: NexusLatestItem) {
  if (item.kind === 'studio') {
    router.push({ pathname: '/studio/[slug]', params: { slug: item.slug } });
    return;
  }
  if (item.kind === 'game') {
    router.push({ pathname: '/channel/[slug]', params: { slug: item.slug } });
    return;
  }
  if (item.kind === 'product') {
    router.push({ pathname: '/product/[slug]', params: { slug: item.slug } });
    return;
  }
  router.push({ pathname: '/content/[slug]', params: { slug: item.slug } });
}

export function NexusLatestSlider({ items }: { items: NexusLatestItem[] }) {
  const { width } = useWindowDimensions();
  const cardWidth = width - 32;
  const [active, setActive] = useState(0);

  if (!items.length) return null;

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={cardWidth}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
          setActive(Math.max(0, Math.min(items.length - 1, next)));
        }}>
        {items.map((item, index) => {
          const productLike = item.kind === 'product';

          return (
            <View key={item.key} style={{ width: cardWidth }}>
              <PressableScale
                onPress={() => open(item)}
                pressedScale={0.994}
                style={[styles.card, { width: cardWidth }]}>
                <View style={[styles.media, productLike && styles.productMedia]}>
                  <Image
                    source={item.image_url ? { uri: item.image_url } : fallback}
                    style={StyleSheet.absoluteFill}
                    contentFit={productLike ? 'contain' : 'cover'}
                    cachePolicy="memory-disk"
                    transition={180}
                  />
                </View>

                <LinearGradient
                  colors={['rgba(3,5,9,0.02)', 'rgba(3,5,9,0.10)', 'rgba(3,5,9,0.95)']}
                  locations={[0, 0.46, 1]}
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.top}>
                  <View style={styles.kindBadge}>
                    <View style={styles.kindDot} />
                    <Text style={styles.kindText}>{kindLabel[item.kind]}</Text>
                  </View>

                  <Text style={styles.counter}>
                    {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                  </Text>
                </View>

                <View style={styles.copy}>
                  <Text style={styles.kicker}>{kindCaption[item.kind]}</Text>
                  <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
                  {item.subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{item.subtitle}</Text> : null}

                  <View style={styles.footer}>
                    <View style={styles.openOrb}><View style={styles.arrow} /></View>
                    <Text style={styles.openText}>بازش کن</Text>
                  </View>
                </View>

                <View style={styles.signal} />
              </PressableScale>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.dots}>
        {items.map((item, index) => (
          <View
            key={item.key + '-dot'}
            style={[styles.dot, index === active && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: spacing.xl,
  },
  card: {
    height: 356,
    borderRadius: radii.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: palette.surface,
    ...shadow.card,
  },
  media: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: palette.surface,
  },
  productMedia: {
    backgroundColor: 'rgba(242,245,249,0.97)',
  },
  top: {
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kindBadge: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.60)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.17)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kindDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.cyan,
  },
  kindText: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 8,
    letterSpacing: 1,
  },
  counter: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: fontFamily.black,
    fontSize: 9,
    letterSpacing: 1,
  },
  copy: {
    marginTop: 'auto',
    padding: spacing.lg,
    alignItems: 'flex-end',
  },
  kicker: {
    color: palette.cyan,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 9,
    letterSpacing: 1,
  },
  title: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 26,
    lineHeight: 33,
    textAlign: 'right',
    marginTop: 6,
    maxWidth: 330,
  },
  subtitle: {
    color: 'rgba(245,248,252,0.68)',
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
  footer: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  openText: {
    color: palette.white,
    fontFamily: fontFamily.bold,
    fontSize: 11,
  },
  openOrb: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
  signal: {
    position: 'absolute',
    bottom: 0,
    right: 28,
    width: 64,
    height: 2,
    backgroundColor: palette.cyan,
  },
  dots: {
    minHeight: 22,
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  dotActive: {
    width: 20,
    backgroundColor: palette.cyan,
  },
});
