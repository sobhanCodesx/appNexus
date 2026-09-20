import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { completeOnboarding } from '@/services/onboarding';

const slides = [
  {
    kicker: 'YOUR GAME WORLD',
    title: 'همه چیز گیم، بدون شلوغی',
    body: 'خبر، ویدیو، استودیو، کالکشن و بازی‌هایی که واقعاً برات مهم‌اند؛ در یک تجربه کاملاً موبایلی.',
    symbol: '◇',
    accent: palette.blue,
  },
  {
    kicker: 'GAME RADAR',
    title: 'قبل از بقیه ببین چی در راهه',
    body: 'انتشارهای تازه PlayStation و Xbox را سریع پیدا کن و از بین انبوه خبرها مستقیم به چیزی که مهمه برس.',
    symbol: '◎',
    accent: palette.cyan,
  },
  {
    kicker: 'WATCH · STORE · PLAY',
    title: 'از کشف تا خرید، یک جریان',
    body: 'ویدیو را ببین، بازی را دنبال کن، نسخه مناسب را انتخاب کن و تجربه‌ات را همان‌جا ادامه بده.',
    symbol: '▶',
    accent: palette.violet,
  },
] as const;

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const progress = useSharedValue(0);

  const goNext = async () => {
    if (index < slides.length - 1) {
      const next = index + 1;
      setIndex(next);
      progress.value = withTiming(next);
      scrollRef.current?.scrollTo({ x: width * next, animated: true });
      void Haptics.selectionAsync();
      return;
    }

    await completeOnboarding();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.max(0, Math.min(slides.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)));
    setIndex(next);
    progress.value = withTiming(next);
  };

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.root}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.brandRow}>
          <View style={styles.brandMark}><View style={styles.brandCore} /></View>
          <Text style={styles.brand}>PLAYNEXUS</Text>
        </Animated.View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          style={styles.pager}>
          {slides.map((slide, slideIndex) => (
            <View key={slide.kicker} style={[styles.slide, { width }]}>
              <Animated.View entering={FadeInDown.delay(slideIndex * 80).duration(550)} style={styles.visual}>
                <View style={[styles.orbit, { borderColor: slide.accent + '55' }]}>
                  <View style={[styles.orbitInner, { borderColor: slide.accent + '88' }]}>
                    <Text style={[styles.symbol, { color: slide.accent }]}>{slide.symbol}</Text>
                  </View>
                  <View style={[styles.signal, { backgroundColor: slide.accent }]} />
                </View>
              </Animated.View>

              <View style={styles.copy}>
                <Text style={[styles.kicker, { color: slide.accent }]}>{slide.kicker}</Text>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.body}>{slide.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.progressRow}>
            {slides.map((slide, slideIndex) => (
              <ProgressDot
                key={slide.kicker}
                index={slideIndex}
                progress={progress}
              />
            ))}
          </View>

          <PressableScale onPress={() => void goNext()} style={styles.cta}>
            <Text style={styles.ctaText}>{index === slides.length - 1 ? 'ورود به PlayNexus' : 'ادامه'}</Text>
            <Text style={styles.ctaArrow}>←</Text>
          </PressableScale>

          {index < slides.length - 1 ? (
            <PressableScale
              haptic={false}
              onPress={async () => {
                await completeOnboarding();
                router.replace('/(tabs)');
              }}
              style={styles.skip}>
              <Text style={styles.skipText}>رد کردن</Text>
            </PressableScale>
          ) : <View style={styles.skip} />}
        </View>
      </View>
    </Screen>
  );
}

function ProgressDot({
  index,
  progress,
}: {
  index: number;
  progress: Animated.SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const distance = Math.abs(progress.value - index);
    return {
      width: interpolate(distance, [0, 1], [34, 8]),
      opacity: interpolate(distance, [0, 1], [1, 0.34]),
    };
  });

  return <Animated.View style={[styles.progressDot, style]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  brandRow: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(77,163,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCore: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: palette.blue,
    transform: [{ rotate: '45deg' }],
  },
  brand: {
    color: palette.white,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: fontWeight.black,
  },
  pager: { flex: 1 },
  slide: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    justifyContent: 'center',
  },
  visual: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 58,
  },
  orbit: {
    width: 230,
    height: 230,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.015)',
  },
  orbitInner: {
    width: 142,
    height: 142,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,7,11,0.54)',
  },
  symbol: {
    fontSize: 62,
    fontWeight: fontWeight.regular,
  },
  signal: {
    position: 'absolute',
    top: 24,
    right: 54,
    width: 10,
    height: 10,
    borderRadius: 10,
  },
  copy: { alignItems: 'flex-end' },
  kicker: {
    fontSize: typeScale.micro,
    letterSpacing: 1.4,
    fontWeight: fontWeight.black,
  },
  title: {
    color: palette.white,
    fontSize: 36,
    lineHeight: 46,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  body: {
    color: palette.textMuted,
    fontSize: typeScale.body,
    lineHeight: 27,
    textAlign: 'right',
    marginTop: spacing.md,
  },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.lg,
  },
  progressRow: {
    height: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginBottom: spacing.lg,
  },
  progressDot: {
    height: 6,
    borderRadius: 999,
    backgroundColor: palette.white,
  },
  cta: {
    minHeight: 60,
    borderRadius: radii.lg,
    backgroundColor: palette.white,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  ctaText: {
    color: palette.ink,
    fontSize: typeScale.body,
    fontWeight: fontWeight.black,
  },
  ctaArrow: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: fontWeight.bold,
  },
  skip: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    color: palette.textDim,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.bold,
  },
});
