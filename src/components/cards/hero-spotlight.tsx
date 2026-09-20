import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { LivePulse } from '@/components/ui/motion-primitives';
import { PressableScale } from '@/components/ui/pressable-scale';
import {
  fontFamily,
  fontWeight,
  palette,
  radii,
  shadow,
  spacing,
  typeScale,
} from '@/design';
import type { HomeSlide } from '@/types/api';

const fallbackImage = require('../../../assets/images/logo-glow.png');

export function HeroSpotlight({
  slide,
  onPress,
}: {
  slide?: HomeSlide;
  onPress?: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const heroHeight = Math.max(408, Math.min(438, height * 0.50));
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  const gesture = Gesture.Pan()
    .maxPointers(1)
    .onUpdate((event) => {
      x.value = Math.max(-1, Math.min(1, event.translationX / 110));
      y.value = Math.max(-1, Math.min(1, event.translationY / 140));
    })
    .onEnd(() => {
      x.value = withSpring(0, { damping: 18, stiffness: 150 });
      y.value = withSpring(0, { damping: 18, stiffness: 150 });
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 850 },
      { rotateY: interpolate(x.value, [-1, 1], [-2.5, 2.5]) + 'deg' },
      { rotateX: interpolate(y.value, [-1, 1], [2, -2]) + 'deg' },
      { scale: interpolate(Math.abs(x.value) + Math.abs(y.value), [0, 2], [1, 0.992]) },
    ],
  }));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1.05 },
      { translateX: interpolate(x.value, [-1, 1], [-7, 7]) },
      { translateY: interpolate(y.value, [-1, 1], [-5, 5]) },
    ],
  }));

  const source = slide?.mobile_image_url || slide?.desktop_image_url
    ? { uri: String(slide?.mobile_image_url || slide?.desktop_image_url) }
    : fallbackImage;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.outer, { width: width - 32 }, cardStyle]}>
        <PressableScale
          onPress={onPress}
          pressedScale={0.994}
          style={[styles.card, { height: heroHeight }]}>
          <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
            <Image
              source={source}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={220}
              priority="high"
              cachePolicy="memory-disk"
            />
          </Animated.View>

          <LinearGradient
            colors={['rgba(3,5,9,0.06)', 'rgba(3,5,9,0.00)', 'rgba(3,5,9,0.94)']}
            locations={[0, 0.38, 1]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(3,5,9,0.90)', 'rgba(3,5,9,0.00)']}
            start={{ x: 1, y: 0.5 }}
            end={{ x: 0.18, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.edgeGlow} />

          <View style={styles.topRow}>
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>01</Text>
              <View style={styles.indexLine} />
              <Text style={styles.indexCaption}>SPOTLIGHT</Text>
            </View>

            <View style={styles.liveBadge}>
              <LivePulse size={5} color={palette.cyan} />
              <Text style={styles.liveText}>NEXUS LIVE</Text>
            </View>
          </View>

          <View style={styles.copy}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowLine} />
              <Text style={styles.eyebrow}>{slide?.eyebrow || 'FEATURED NOW'}</Text>
            </View>

            <Text numberOfLines={3} style={styles.title}>
              {slide?.title || 'دنیای گیم تو، این بار واقعاً برای موبایل'}
            </Text>

            <Text numberOfLines={2} style={styles.description}>
              {slide?.description || 'محتوایی که مهمه، بازی‌هایی که دنبال می‌کنی و هر چیزی که باید قبل از بقیه ببینی.'}
            </Text>

            <View style={styles.bottomRow}>
              <View style={styles.signalMeta}>
                <Text style={styles.signalMetaLabel}>PLAYNEXUS SIGNAL</Text>
                <View style={styles.signalBars}>
                  <View style={[styles.signalBar, styles.signalBar1]} />
                  <View style={[styles.signalBar, styles.signalBar2]} />
                  <View style={[styles.signalBar, styles.signalBar3]} />
                </View>
              </View>

              <View style={styles.cta}>
                <Text style={styles.ctaText}>
                  {onPress ? slide?.button_label || 'بازش کن' : 'ویژه امروز'}
                </Text>
                <View style={styles.ctaOrb}>
                  <View style={styles.arrow} />
                </View>
              </View>
            </View>
          </View>
        </PressableScale>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'center',
    ...shadow.card,
  },
  card: {
    borderRadius: radii.xxl,
    overflow: 'hidden',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
  },
  edgeGlow: {
    position: 'absolute',
    top: -80,
    right: -74,
    width: 190,
    height: 190,
    borderRadius: 190,
    backgroundColor: 'rgba(88,244,255,0.10)',
  },
  topRow: {
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  indexBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.56)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  indexText: {
    color: palette.white,
    fontSize: 10,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
  },
  indexLine: {
    width: 12,
    height: 1,
    backgroundColor: palette.textDim,
  },
  indexCaption: {
    color: palette.textMuted,
    fontSize: 8,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.56)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.18)',
  },
  livePulseOuter: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(88,244,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePulse: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.cyan,
    ...shadow.cyanGlow,
  },
  liveText: {
    color: palette.white,
    fontSize: 9,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  copy: {
    marginTop: 'auto',
    padding: spacing.lg,
    alignItems: 'flex-end',
  },
  eyebrowRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  eyebrowLine: {
    width: 28,
    height: 2,
    borderRadius: 2,
    backgroundColor: palette.cyan,
  },
  eyebrow: {
    color: palette.cyan,
    fontSize: 10,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
  },
  title: {
    color: palette.white,
    fontSize: 30,
    lineHeight: 38,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    letterSpacing: -0.8,
    maxWidth: 330,
    writingDirection: 'rtl',
  },
  description: {
    color: 'rgba(245,248,252,0.72)',
    fontSize: typeScale.bodySm,
    lineHeight: 23,
    fontFamily: fontFamily.regular,
    textAlign: 'right',
    marginTop: spacing.sm,
    maxWidth: 320,
    writingDirection: 'rtl',
  },
  bottomRow: {
    width: '100%',
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  signalMeta: {
    alignItems: 'flex-start',
  },
  signalMetaLabel: {
    color: palette.textDim,
    fontSize: 8,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
  signalBars: {
    height: 14,
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  signalBar: {
    width: 3,
    borderRadius: 3,
    backgroundColor: palette.cyan,
  },
  signalBar1: { height: 5, opacity: 0.45 },
  signalBar2: { height: 9, opacity: 0.7 },
  signalBar3: { height: 13 },
  cta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.pill,
    paddingLeft: 7,
    paddingRight: 16,
    paddingVertical: 7,
    backgroundColor: palette.white,
  },
  ctaText: {
    color: palette.ink,
    fontSize: typeScale.bodySm,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
  },
  ctaOrb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.7,
    borderBottomWidth: 1.7,
    borderColor: palette.white,
    transform: [{ rotate: '45deg' }],
  },
});
