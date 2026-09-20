import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { motion, palette, radii } from '@/design';

export function SkeletonBox({
  style,
  radius = radii.lg,
}: {
  style?: ViewStyle | ViewStyle[];
  radius?: number;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    pulse.value = withRepeat(
      withTiming(1, { duration: motion.cinematic }),
      -1,
      true,
    );

    return () => cancelAnimation(pulse);
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.38 + pulse.value * 0.34,
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        { borderRadius: radius },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonHero() {
  return (
    <View style={styles.heroWrap}>
      <SkeletonBox style={styles.hero} radius={radii.xxl} />
      <View style={styles.heroCopy}>
        <SkeletonBox style={styles.kicker} radius={6} />
        <SkeletonBox style={styles.heroTitle} radius={8} />
        <SkeletonBox style={styles.heroTitleShort} radius={8} />
        <SkeletonBox style={styles.heroButton} radius={radii.pill} />
      </View>
    </View>
  );
}

export function SkeletonRail() {
  return (
    <View style={styles.rail}>
      <SkeletonBox style={styles.large} />
      <SkeletonBox style={styles.large} />
    </View>
  );
}

export function SkeletonStudioRail() {
  return (
    <View style={styles.rail}>
      <SkeletonBox style={styles.studio} />
      <SkeletonBox style={styles.studio} />
      <SkeletonBox style={styles.studio} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: palette.surfaceBright,
    overflow: 'hidden',
  },
  heroWrap: {
    height: 422,
    marginHorizontal: 16,
    position: 'relative',
  },
  hero: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  heroCopy: {
    position: 'absolute',
    right: 20,
    left: 20,
    bottom: 24,
    alignItems: 'flex-end',
    gap: 10,
  },
  kicker: {
    width: 118,
    height: 10,
  },
  heroTitle: {
    width: '82%',
    height: 28,
  },
  heroTitleShort: {
    width: '58%',
    height: 28,
  },
  heroButton: {
    width: 132,
    height: 44,
    marginTop: 8,
  },
  rail: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  large: {
    width: 280,
    height: 188,
  },
  studio: {
    width: 196,
    height: 132,
  },
});
