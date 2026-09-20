import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/pressable-scale';
import { fontWeight, gradients, palette, radii, shadow, spacing, typeScale } from '@/design';
import type { HomeSlide } from '@/types/api';

const fallbackImage = require('../../../assets/images/logo-glow.png');

export function HeroSpotlight({ slide, onPress }: { slide?: HomeSlide; onPress?: () => void }) {
  const { width } = useWindowDimensions();
  const rotate = useSharedValue(0);
  const lift = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      rotate.value = Math.max(-4, Math.min(4, event.translationX / 34));
      lift.value = Math.max(-6, Math.min(0, event.translationY / 18));
    })
    .onEnd(() => {
      rotate.value = withSpring(0);
      lift.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { rotateZ: String(rotate.value) + 'deg' }],
  }));

  const source = slide?.mobile_image_url || slide?.desktop_image_url
    ? { uri: String(slide?.mobile_image_url || slide?.desktop_image_url) }
    : fallbackImage;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.outer, { width: width - 36 }, animatedStyle]}>
        <PressableScale onPress={onPress} pressedScale={0.988} style={styles.card}>
          <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} priority="high" />
          <LinearGradient colors={gradients.hero} locations={[0, 0.52, 1]} style={StyleSheet.absoluteFill} />

          <View style={styles.topRow}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>PLAYNEXUS NOW</Text>
            </View>
            <View style={styles.neonMark} />
          </View>

          <View style={styles.copy}>
            <Text style={styles.eyebrow}>{slide?.eyebrow || 'مرکز گیم تو'}</Text>
            <Text numberOfLines={2} style={styles.title}>
              {slide?.title || 'دنیای بازی را مثل یک اپ واقعی زندگی کن'}
            </Text>
            <Text numberOfLines={2} style={styles.description}>
              {slide?.description || 'خبر، ویدیو، رادار انتشار و فروشگاه؛ همه در یک تجربه سریع و کاملاً موبایلی.'}
            </Text>
            <View style={styles.cta}>
              <Text style={styles.ctaText}>شروع کن</Text>
              <View style={styles.arrow} />
            </View>
          </View>
        </PressableScale>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  outer: { alignSelf: 'center', ...shadow.card },
  card: {
    height: 430,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.lineStrong,
  },
  topRow: {
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    backgroundColor: 'rgba(5,7,11,0.64)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  liveDot: { width: 7, height: 7, borderRadius: 9, backgroundColor: palette.cyan },
  liveText: { color: palette.white, fontSize: 10, fontWeight: fontWeight.bold, letterSpacing: 1.2 },
  neonMark: {
    width: 12,
    height: 12,
    borderRadius: 5,
    backgroundColor: palette.blue,
    transform: [{ rotate: '45deg' }],
  },
  copy: { marginTop: 'auto', padding: spacing.xl, alignItems: 'flex-end' },
  eyebrow: {
    color: palette.cyan,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  title: {
    color: palette.white,
    fontSize: 31,
    lineHeight: 39,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    maxWidth: 310,
  },
  description: {
    color: 'rgba(247,250,255,0.74)',
    fontSize: typeScale.bodySm,
    lineHeight: 23,
    textAlign: 'right',
    marginTop: spacing.sm,
    maxWidth: 310,
  },
  cta: {
    marginTop: spacing.lg,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: palette.white,
  },
  ctaText: { color: palette.ink, fontSize: typeScale.bodySm, fontWeight: fontWeight.black },
  arrow: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: palette.ink,
    transform: [{ rotate: '-135deg' }],
  },
});
